import { hashURL } from "../utils/hash";

// ─────────────────────────────────────────────
// 🧠 In-memory image mapping and cache
// ─────────────────────────────────────────────

/**
 * Maps each grid ID to its associated original image URL.
 * Used for resolving the image source and generating consistent cache keys.
 *
 * Example: gridId = 123 → "https://ipfs.io/ipfs/..."
 */
const imageMap = new Map<number, string>();

/**
 * Caches compressed WebP buffers in-memory using a hashed key.
 * Key format: `${gridId}-${hashURL(originalURL)}`
 * Prevents redundant image compression and accelerates image delivery.
 */
const compressedCache = new Map<string, Buffer>();

/**
 * Retrieves the original image URL for a given grid ID.
 * Assumes the imageMap is already populated.
 *
 * @param gridId - The ID of the grid tile
 * @returns Original image URL (e.g., IPFS, Arweave, Highlight)
 */
export function getImageMap(gridId: number): string {
  return imageMap.get(gridId) as string;
}

/**
 * Sets or updates the original image URL for a grid tile.
 * Called during polling or update events.
 *
 * @param gridId - The ID of the grid tile
 * @param originalURL - The raw image URL
 */
export function setImageMap(gridId: number, originalURL: string) {
  imageMap.set(gridId, originalURL);
}

/**
 * Retrieves the cached compressed WebP image for a given grid ID.
 * The cache key is dynamically calculated based on the current original URL hash.
 *
 * @param gridId - The ID of the grid tile
 * @returns Compressed WebP buffer if exists, otherwise undefined
 */
export function getCompressedCache(gridId: number): Buffer | undefined {
  const key = `${gridId}-${hashURL(getImageMap(gridId))}`;
  return compressedCache.get(key);
}

/**
 * Stores a compressed WebP buffer in the cache using a hashed key.
 *
 * @param gridId - The ID of the grid tile
 * @param buffer - Compressed WebP buffer
 */
export function setCompressedCache(gridId: number, buffer: Buffer) {
  const key = `${gridId}-${hashURL(getImageMap(gridId))}`;
  compressedCache.set(key, buffer);
}

/**
 * Checks whether a valid compressed WebP version of the image exists in the cache.
 *
 * @param gridId - The ID of the grid tile
 * @returns true if the image is cached, false otherwise
 */
export function hasCompressedCache(gridId: number): boolean {
  const key = `${gridId}-${hashURL(getImageMap(gridId))}`;
  return compressedCache.has(key);
}

/**
 * Removes a compressed image from the cache.
 * Useful when the image source changes or becomes invalid.
 *
 * @param gridId - The ID of the grid tile
 */
export function deleteCompressedCache(gridId: number) {
  const key = `${gridId}-${hashURL(getImageMap(gridId))}`;
  compressedCache.delete(key);
}