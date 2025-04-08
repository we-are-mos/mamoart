import { type GridType } from "../utils/types";

// ─────────────────────────────────────────────
// 🧠 Grid State Management (In-Memory Caching)
// ─────────────────────────────────────────────

/**
 * Stores all 1500 grid tiles fetched from the indexer.
 * Each entry maps gridId to its corresponding NFT data.
 */
const gridCache = new Map<number, GridType>();

/**
 * Tracks only the grids that changed in the latest polling cycle.
 * This is used to broadcast minimal updates to WebSocket clients.
 */
const updatedGridCache = new Map<number, GridType>();

/**
 * Caches metadata (parsed JSON) by token key.
 * Key format: `${contract}-${tokenId}`
 */
const metadataCache = new Map<string, any>();

/**
 * Inserts or updates a grid tile in the main cache.
 * Called for all 1500 grids on every polling iteration.
 *
 * @param grid - The latest data for a specific grid
 */
export function setGrid(grid: GridType) {
  gridCache.set(grid.gridId, grid);
}

/**
 * Retrieves a specific grid by its ID.
 * Used when rendering or validating paint data.
 *
 * @param gridId - The ID of the grid tile
 * @returns The matching grid or undefined
 */
export function getGrid(gridId: number): GridType | undefined {
  return gridCache.get(gridId);
}

/**
 * Returns all cached grid tiles.
 * Typically used to initialize clients with the full grid state.
 */
export function getAllGrids(): GridType[] {
  return Array.from(gridCache.values());
}

/**
 * Flags a grid as updated. Called only when a difference is detected.
 * Marked grids will be included in the next WebSocket broadcast.
 *
 * @param grid - The changed grid to be tracked
 */
export function markGridAsUpdated(grid: GridType) {
  updatedGridCache.set(grid.gridId, grid);
}

/**
 * Returns the list of currently marked updated grids.
 */
export function getUpdatedGrids(): GridType[] {
  return Array.from(updatedGridCache.values());
}

/**
 * Clears the update tracker before a new polling cycle begins.
 */
export function clearUpdatedGrids() {
  updatedGridCache.clear();
}

/**
 * Generates a unique cache key for NFT metadata.
 * Used to avoid repeated fetches for the same NFT.
 *
 * @param contract - NFT contract address
 * @param tokenId - NFT token ID
 * @returns A string key in the format `contract-tokenId`
 */
export function getMetadataKey(contract: string, tokenId: string): string {
  return `${contract}-${tokenId}`;
}

/**
 * Exposes internal caches (read-only).
 */
export { gridCache, updatedGridCache, metadataCache };