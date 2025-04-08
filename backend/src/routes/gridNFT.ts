import express from "express";
import sharp from "sharp";
import { getCompressedCache, getImageMap, hasCompressedCache, setCompressedCache } from "../state/nftImageState";
import { hashURL } from "../utils/hash";

const inflightRequests = new Map<number, Promise<Buffer>>();
const router = express.Router();

/**
 * GET /gridNFT/:hashedGridId
 * 
 * Returns the compressed WebP image associated with the specified grid ID.
 * Automatically handles IPFS/Arweave/Highlight image fetching and compression.
 * 
 * Caches both compressed images and in-flight requests to reduce load.
 */
router.get("/:hashedGridId", async (req, res) => {
  const rawGridId = parseInt(req.params.hashedGridId);
  const gridId = Number(rawGridId);
  const versionParam = req.query.v as string | undefined;

  // ───── 1. Lookup image mapping for grid ─────
  const imageUrl = getImageMap(gridId);
  if (!imageUrl) {
    res.status(404).send("Image not found in mapping");
    return;
  }

  // ───── 2. Validate hash if provided ─────
  const expectedHash = hashURL(imageUrl);
  if (versionParam && versionParam !== expectedHash) {
    res.status(400).send("Invalid image version");
    return;
  }

  // ───── 3. Return cached image if available ─────
  if (hasCompressedCache(gridId)) {
    res.setHeader("Content-Type", "image/webp");
    res.send(getCompressedCache(gridId));
    return;
  }

  // ───── 4. Deduplicate concurrent compressions ─────
  if (inflightRequests.has(gridId)) {
    const result = await inflightRequests.get(gridId)!;
    res.setHeader("Content-Type", "image/webp");
    res.send(result);
    return;
  }

  // ───── 5. Begin fetch + compression process ─────
  const promise = (async () => {
    try {
      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
          "Referer": "https://art.mammothos.xyz",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status} - ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      const webp = await sharp(buffer)
        .resize(300, 300, { fit: "cover" })
        .webp({ quality: 100 })
        .toBuffer();

      setCompressedCache(gridId, webp); // 🧠 Store compressed buffer in memory

      return webp;
    } catch (err) {
      console.error(`[${gridId}] Compression failed:`, err);
      throw err;
    } finally {
      inflightRequests.delete(gridId); // ✅ Clean up in all cases
    }
  })();

  // 🕒 Store the in-progress promise to avoid duplicate work
  inflightRequests.set(gridId, promise);

  try {
    const finalBuffer = await promise;
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Content-Type", "image/webp");
    res.send(finalBuffer);
  } catch (err) {
    res.status(500).send("Internal error");
  }
});

export default router;