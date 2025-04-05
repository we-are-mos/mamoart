import { createContext } from "react";

/**
 * GridType represents a fully processed grid with enriched NFT metadata
 * used by the frontend (including ownership, image, name, etc.)
 */
export type GridType = {
  gridId: number;
  isOwned: boolean;
  nftName: string;
  nftImage: string;
  nftAddress: string;
  tokenId: number;
  metadata: string;
  nftLink: string;
  painter: string;
  block: number;
  txHash: string;
  paintedAt: string;
};

/**
 * RawGridType is the raw form received from the backend or blockchain,
 * typically without any frontend-specific enrichments.
 */
export type RawGridType = {
  gridId: number;
  nftAddress: string;
  tokenId: number;
  metadata: string;
  painter: string;
  block: number;
  txHash: string;
  paintedAt: string;
};

/**
 * StatsType represents global statistics about grid paints
 */
export type StatsType = {
  totalPaints: number;
  totalUniqueUsers: number;
};

/**
 * WebSocketContextType defines the structure for WebSocket shared context,
 * which includes the socket instance and live reactive state data
 */
interface WebSocketContextType {
  socket: WebSocket | null;
  grids: GridType[];
  lastPaints: GridType[];
  stats: StatsType;
}

/**
 * React context used to provide WebSocket connection and shared data
 * (grids, stats, recent paints) across the application.
 */
export const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  grids: [],
  lastPaints: [],
  stats: { totalPaints: 0, totalUniqueUsers: 0 },
});