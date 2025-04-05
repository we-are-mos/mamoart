import type { StatsType } from "../utils/types";

// ─────────────────────────────────────────────
// 📊 In-memory stats state
// ─────────────────────────────────────────────

/**
 * Stores the latest fetched stats in memory.
 * This is updated during polling and served to WebSocket clients on init.
 */
let stats: StatsType = {
  totalPaints: 0,
  totalUniqueUsers: 0,
};

/**
 * Updates the in-memory stats value.
 * This is typically called by the grid polling system.
 *
 * @param newStats - The latest stats data from indexer
 */
export function setStats(newStats: StatsType) {
  stats = newStats;
}

/**
 * Returns the currently cached stats object.
 * Used when sending `init` payload to newly connected clients.
 *
 * @returns The most recent stats object in memory.
 */
export function getStats(): StatsType {
  return stats;
}