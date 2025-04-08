// ─────────────────────────────────────────────
// 🧩 Shared Types used across the backend
// ─────────────────────────────────────────────

/**
 * Represents a single grid unit in the paintable canvas.
 * This data is fetched from the indexer and cached in memory.
 */
export type RawGridType = {
  /** Unique identifier of the grid (0 to 1499) */
  gridId: number;

  /** NFT contract address (can be Stars or Forma) */
  nftAddress: string;

  /** Token ID of the NFT displayed in this grid */
  tokenId: number;

  /**
   * Metadata of the NFT (stringified JSON).
   * Includes fields like name, image, etc.
   */
  metadata: string;

  /** Wallet address that painted this grid */
  painter: string;

  /** Block number when this grid was painted */
  block: number;

  /** Transaction hash of the paint operation */
  txHash: string;

  /** ISO timestamp when the painting occurred */
  paintedAt: string;
};

export type GridType = {
  gridId: number;
  isOwned: boolean;
  nftName: string;
  nftImage: string;
  nftImageFromMOS: string;
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
 * Represents stats returned by the indexer.
 * These are stored in memory and updated with each polling cycle.
 */
export type StatsType = {
  /** Total number of paint events since start */
  totalPaints: number;

  /** Number of unique wallets that painted */
  totalUniqueUsers: number;
};

/**
 * Represents a single NFT owned by a user, formatted for frontend use.
 */
export type NFT = {
  owner: string;
  nft: {
    address: string;
    name: string;
    tokenId: string;
    image: string;
  };
  inGrid: boolean;
};