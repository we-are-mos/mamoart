/**
 * Normalizes an IPFS URL to a public HTTP gateway.
 *
 * If the provided URL starts with "ipfs://", it will be replaced with
 * "https://ipfs.io/ipfs/" so that it can be used directly in a browser.
 *
 * This is used when rendering NFT images that are stored on IPFS.
 *
 * @param url - The original URL, possibly starting with "ipfs://"
 * @returns A normalized URL that can be safely used in <img> tags or HTTP requests.
 */
export function normalizeUrl(url: string): string {
  try {
    return url?.startsWith("ipfs://")
      ? url.replace("ipfs://", "https://ipfs.io/ipfs/")
      : url;
  } catch (err: any) {
    console.error("❌ [normalizeUrl] Failed:", err?.message || "Unknown error");
    return url;
  }
}