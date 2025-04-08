import crypto from "crypto";

/**
 * Generates a short deterministic hash from a given URL.
 * 
 * Used to version compressed images in cache keys and URLs.
 * Only the first 10 characters of a SHA-1 hash are returned for brevity.
 *
 * @param url - The original image URL (IPFS, Arweave, etc.)
 * @returns A 10-character hash string
 */
export function hashURL(url: string): string {
  return crypto.createHash("sha1").update(url).digest("hex").slice(0, 10);
}