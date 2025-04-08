import { type GridType } from "../utils/types";

// ─────────────────────────────────────────────
// 🧠 In-memory cache for recent paints
// ─────────────────────────────────────────────

/**
 * Stores the last 10 painted grid tiles.
 * This is updated during each polling cycle and sent to new clients on connection.
 */
const recentPaints = new Map<number, GridType>();

/**
 * Sets the paint data for a specific index (0–9).
 * Called during polling after fetching /last-painted from the indexer.
 *
 * @param index - Index in the lastPaints array (0 = most recent)
 * @param grid - Grid data representing the NFT paint
 */
export function setRecentPaint(index: number, grid: GridType) {
  recentPaints.set(index, grid);
}

/**
 * Returns the current list of last painted tiles as an array.
 * Used in the WebSocket `init` payload and UI history views.
 */
export function getRecentPaints(): GridType[] {
  return Array.from(recentPaints.values());
}

/**
 * Clears all recent paints from the cache.
 * Called before a fresh polling result is processed.
 */
export function clearRecentPaints() {
  recentPaints.clear();
}

/**
 * Exposes the raw internal map (read-only).
 * This is used in broadcasting logic to avoid repeated `.getRecentPaints()`
 */
export { recentPaints };