import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import { WebSocket, WebSocketServer } from "ws";
import chalk from "chalk";

import getNFTsRoute from "./routes/getNFTs";
import gridNFTRoute from "./routes/gridNFT";
import createTxRoute from "./routes/createTx";
import connectKeplrRoute from "./routes/connectKeplr";

import { startGridPolling, updateGridState } from "./state/polling";
import { getAllGrids } from "./state/gridState";
import { getRecentPaints } from "./state/paintState";
import { getStats } from "./state/statsState";
import { startTIAPolling, updateTIAPrice } from "./state/tiaState";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4444;

// Create shared HTTP server for both Express and WebSocket
const server = http.createServer(app);

// ─────────────────────────────────────────────
// 🛡️ Middleware & Security
// ─────────────────────────────────────────────

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || [];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: false,
}));

app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));
app.use(express.json({ limit: "100kb" }));

// ─────────────────────────────────────────────
// 📦 API Routes
// ─────────────────────────────────────────────

app.get("/", (req, res) => {
  res.status(200).send("Mamoart Backend is alive ✅");
});

app.use("/getNFTs", getNFTsRoute);
app.use("/gridNFT", gridNFTRoute)
app.use("/createTx", createTxRoute);
app.use("/connectKeplr", connectKeplrRoute);

// ─────────────────────────────────────────────
// 🧠 Initial Data + Background Polling
// ─────────────────────────────────────────────

try {
  await updateGridState(); // preload data before clients arrive
  startGridPolling();      // start periodic updates

  await updateTIAPrice();
  startTIAPolling();
} catch (err: any) {
  console.error("❌ Failed to initialize grid state:", err?.message || "Unknown error");
}

// ─────────────────────────────────────────────
// 📡 WebSocket Setup
// ─────────────────────────────────────────────

const wss = new WebSocketServer({ server });
const connections = new Map();

const MAX_CONNECTIONS_PER_IP = 5;
const MAX_MESSAGES_IN_MINUTE = 15;

function getClientIP(req: http.IncomingMessage) {
  const cfIP = req.headers['cf-connecting-ip'];
  if (typeof cfIP === 'string') return cfIP;

  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();

  const remote = req.socket?.remoteAddress;
  if (remote?.startsWith("::ffff:")) return remote.slice(7);
  return remote || 'unknown';
}

wss.on("connection", (ws: WebSocket, req: http.IncomingMessage) => {
  const ip = getClientIP(req);
  (ws as any).isAlive = true;

  console.log(chalk.green(`📡 New WebSocket client connected from ${ip}`));
  console.log(chalk.blue(`👥 Total connected clients: ${wss.clients.size}`));

  if (!connections.has(ip)) {
    connections.set(ip, { connections: 1, messageTimestamps: [] });
  } else {
    const connectionData = connections.get(ip);
    connectionData.connections += 1;

    if (connectionData.connections > MAX_CONNECTIONS_PER_IP) {
      console.warn(chalk.red(`[RateLimit] ❌ Too many connections from ${ip}`));
      ws.close(4000, "Too many connections from same IP");
      return;
    }
  }

  ws.on("message", (msg) => {
    if (ws.readyState !== WebSocket.OPEN) return;

    try {
      const data = JSON.parse(msg.toString());
      const connectionData = connections.get(ip);
      const now = Date.now();

      connectionData.messageTimestamps = (connectionData.messageTimestamps || []).filter(
        (timestamp: any) => now - timestamp <= 60_000
      );
      connectionData.messageTimestamps.push(now);

      if (connectionData.messageTimestamps.length > MAX_MESSAGES_IN_MINUTE) {
        console.warn(chalk.red(`[RateLimit] ❌ Too many messages in 1 min from ${ip}`));
        ws.close(4001, "Too many messages in short time");
        return;
      }
      
      if (data.type === "keepAlive") {
        (ws as any).isAlive = true;      
      }
  
    } catch (err) {
      console.error(chalk.red("❌ WS message parse error:"), err);
    }
  });
  
  const interval = setInterval(() => {
    if (!(ws as any).isAlive) {
      console.log(chalk.yellow("❌ Client inactive, closing connection."));
      if (wss.clients.has(ws)) {
        (ws as any).isAlive = false;
        ws.close();
      }
    }
  }, 30000);

  ws.on("close", () => {
    const connectionData = connections.get(ip);
    if(connectionData) {
      connectionData.connections -= 1;
      if (connectionData.connections <= 0) {
        connections.delete(ip);
      }
    }
    clearInterval(interval);
    console.log(chalk.yellow(`🔌 Connection closed at ${ip}`));
    console.log(chalk.blue(`👥 Total connected clients: ${wss.clients.size}`));
  });

  try {
    const initPayload = {
      type: "init",
      payload: {
        paintGrid: getAllGrids(),
        lastPaints: getRecentPaints(),
        stats: getStats(),
      },
    };

    ws.send(JSON.stringify(initPayload));
  } catch (err: any) {
    console.error("❌ Failed to send init payload:", err?.message || "Unknown error");
  }
});

// ─────────────────────────────────────────────
// 📢 Broadcast Utility
// ─────────────────────────────────────────────

type WebSocketMessageType = "init" | "gridUpdate";

/**
 * Sends a typed message to all connected WebSocket clients
 */
export function broadcastToClients(type: WebSocketMessageType, payload: any): void {
  const message = JSON.stringify({ type, payload });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (err: any) {
        console.error("❌ WS send error:", err?.message || "Unknown error");
      }
    }
  });
}

// ─────────────────────────────────────────────
// 🚀 Start Server
// ─────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`🟢 WebSocket server running on http://localhost:${PORT}`);
});