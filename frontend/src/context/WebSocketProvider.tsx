import { useEffect, useState } from "react";
import { RawGridType, StatsType, WebSocketContext, type GridType } from "./WebSocketContext";

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [grids, setGrids] = useState<GridType[]>([]);
  const [lastPaints, setLastPaints] = useState<GridType[]>([]);
  const [stats, setStats] = useState<StatsType>({ totalPaints: 0, totalUniqueUsers: 0 });

  /**
   * Transforms raw grid data into a formatted structure usable by the UI.
   */
  const formatGrids = (data: RawGridType[]): GridType[] => {
    const formatted: GridType[] = data.map((grid: RawGridType) => ({
      ...grid,
      isOwned: grid.painter !== "0x0000000000000000000000000000000000000000",
      nftName: (() => {
        try {
          const meta = grid.metadata as string | { name: string };
          return typeof meta === "string" ? JSON.parse(meta).name : meta.name;
        } catch {
          return "unknown";
        }
      })(),
      nftImage: (() => {
        try {
          const meta = grid.metadata as string | { image: string };
          const image = typeof meta === "string" ? JSON.parse(meta).image : meta.image;
          return image.startsWith("ipfs://") ? image.replace("ipfs://", "https://ipfs.io/ipfs/") : image;
        } catch {
          return "unknown";
        }
      })(),
      nftLink: grid.nftAddress.startsWith("stars")
        ? `https://www.stargaze.zone/m/${grid.nftAddress}/${grid.tokenId}`
        : `https://explorer.forma.art/token/${grid.nftAddress}/instance/${grid.tokenId}`
    }));

    return formatted;
  };

  useEffect(() => {
    const WS_URL = import.meta.env.VITE_BACKEND_WSS;
    console.log(WS_URL);

    const ws = new WebSocket(WS_URL);

    /**
     * Handles initial full grid state from backend.
     */
    const initializeGrids = async (data: RawGridType[]) => {
      try {
        const formatted = formatGrids(data);
        if (formatted.length <= 0) return;

        setGrids(formatted);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("❌ Grid init error:", message);
      }
    };

    /**
     * Updates only the changed grid tiles from a WebSocket payload.
     */
    const updateGrids = async (data: RawGridType[]) => {
      try {
        const formatted = formatGrids(data);
        if (formatted.length <= 0) return;

        setGrids(prevGrids =>
          prevGrids.map(grid => {
            const updated = formatted.find(g => g.gridId === grid!.gridId);
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
        setLastPaints(formatGrids(data.payload.lastPaints));
        setStats(data.payload.stats);
      }

      if (data.type === "gridUpdate") {
        updateGrids(data.payload.updatedGrid);
        setLastPaints(formatGrids(data.payload.lastPaints));
        setStats(data.payload.stats);
      }
    };

    ws.onclose = () => {
      console.log("🔌 WebSocket closed");
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