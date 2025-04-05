import {
  gridCache,
  updatedGridCache,
  setGrid,
  markGridAsUpdated,
  clearUpdatedGrids,
} from "./gridState";
import {
  recentPaints,
  clearRecentPaints,
  setRecentPaint
} from "./paintState";
import { setStats } from "./statsState";
import { broadcastToClients } from "../server";
import { type RawGridType, type StatsType } from "../utils/types";

// ─────────────────────────────────────────────
// 🔁 Grid Polling System
// ─────────────────────────────────────────────

/**
 * Fetches updated grid, paint, and stats data from the indexer API.
 * - Detects grid changes by comparing previous vs. current state
 * - Broadcasts updates to WebSocket clients if there are changes
 * - Caches the latest state in memory for real-time usage
 *
 * This function is intended to be run periodically (e.g. every 2.5s).
 */
export async function updateGridState() {
  try {
    clearUpdatedGrids();
    clearRecentPaints();

    // ─── 1. Fetch all 1500 grids from indexer ─────
    const res = await fetch(`${process.env.INDEXER_URL}/api/grids`);
    const grids: RawGridType[] = await res.json() as RawGridType[];

    for (const grid of grids) {
      const existing = gridCache.get(grid.gridId);
      const changed = existing && JSON.stringify(existing) !== JSON.stringify(grid);

      setGrid(grid);
      if (changed) markGridAsUpdated(grid);
    }

    // ─── 2. Fetch last 10 painted tiles ─────
    const lastPaintRes = await fetch(`${process.env.INDEXER_URL}/api/last-painted`);
    const paints: RawGridType[] = await lastPaintRes.json() as RawGridType[];

    paints.forEach((paint, i) => {
      if (paint.painter.toLowerCase() !== "0x0000000000000000000000000000000000000000") {
        setRecentPaint(i, paint);
      }
    });

    // ─── 3. Fetch global paint stats ─────
    const statsRes = await fetch(`${process.env.INDEXER_URL}/api/stats`);
    const statsData: StatsType = await statsRes.json() as StatsType;
    setStats(statsData);

    // ─── 4. Broadcast updates if there are any ─────
    const updates = Array.from(updatedGridCache.values());

    if (updates.length > 0) {
      broadcastToClients("gridUpdate", {
        updatedGrid: updates,
        lastPaints: Array.from(recentPaints.values()),
        stats: statsData,
      });
    }

    console.log(`✅ Map updated. Modified: ${updates.length} grids.`);
  } catch (err: any) {
    const shortMsg = err?.message?.slice(0, 300)?.replace(/\n/g, " ") || "Unknown error";
    console.error("❌ [updateGridState] Failed:", shortMsg);
  }
}

/**
 * Starts the automatic grid polling loop.
 * Executes every 2500 milliseconds (2.5s) to keep the backend state fresh.
 */
export function startGridPolling() {
  setInterval(updateGridState, 2500);
}