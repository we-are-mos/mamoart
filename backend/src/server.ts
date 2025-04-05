import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import { WebSocketServer, WebSocket } from "ws";

import getNFTsRoute from "./routes/getNFTs";
import createTxRoute from "./routes/createTx";
import connectKeplrRoute from "./routes/connectKeplr";

import { startGridPolling, updateGridState } from "./state/polling";
import { getAllGrids } from "./state/gridState";
import { getRecentPaints } from "./state/paintState";
import { getStats } from "./state/statsState";

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
    if (!origin || ALLOWED_ORIGINS!.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "100kb" }));

// ─────────────────────────────────────────────
// 📦 API Routes
// ─────────────────────────────────────────────

app.use("/getNFTs", getNFTsRoute);
app.use("/createTx", createTxRoute);
app.use("/connectKeplr", connectKeplrRoute);

// ─────────────────────────────────────────────
// 🧠 Initial Data + Background Polling
// ─────────────────────────────────────────────

try {
  await updateGridState(); // preload data before clients arrive
  startGridPolling();      // start periodic updates
} catch (err: any) {
  console.error("❌ Failed to initialize grid state:", err?.message || "Unknown error");
}

// ─────────────────────────────────────────────
// 📡 WebSocket Setup
// ─────────────────────────────────────────────

const wss = new WebSocketServer({ server });

wss.on("connection", (ws: WebSocket) => {
  console.log("📡 New WebSocket client connected");

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