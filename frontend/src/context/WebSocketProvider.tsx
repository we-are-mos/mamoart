import { useEffect, useState } from "react";
import { StatsType, WebSocketContext, type GridType } from "./WebSocketContext";

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [grids, setGrids] = useState<GridType[]>([]);
  const [lastPaints, setLastPaints] = useState<GridType[]>([]);
  const [stats, setStats] = useState<StatsType>({ totalPaints: 0, totalUniqueUsers: 0 });

  useEffect(() => {
    const WS_URL = import.meta.env.VITE_BACKEND_WSS;

    const ws = new WebSocket(WS_URL);

    /**
     * Handles initial full grid state from backend.
     */
    const initializeGrids = async (data: GridType[]) => {
      try {
        setGrids(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("❌ Grid init error:", message);
      }
    };

    /**
     * Updates only the changed grid tiles from a WebSocket payload.
     */
    const updateGrids = async (data: GridType[]) => {
      try {
        setGrids(prevGrids =>
          prevGrids.map(grid => {
            const updated = data.find(g => g.gridId === grid!.gridId);
            return updated ? updated : grid;
          })
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("❌ Grid update error:", message);
      }
    };

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
      setSocket(ws);
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "init") {
        initializeGrids(data.payload.paintGrid);
        setLastPaints(data.payload.lastPaints);
        setStats(data.payload.stats);
      }

      if (data.type === "gridUpdate") {
        updateGrids(data.payload.updatedGrid);
        setLastPaints(data.payload.lastPaints);
        setStats(data.payload.stats);
      }
    };

    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "keepAlive" }));
      }
    }, 25000);

    ws.onclose = () => {
      console.log("🔌 WebSocket closed");
      clearInterval(heartbeat);
      setSocket(null);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket, grids, lastPaints, stats }}>
      {children}
    </WebSocketContext.Provider>
  );
};