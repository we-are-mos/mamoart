import express, { type Request, type Response } from "express";
import { getMetadata } from "../utils/getMetadata.ts";
import { normalizeUrl } from "../utils/normalizeUrl.ts";
import { getMetadataKey, metadataCache } from "../state/gridState.ts";
import { getLinkedKeplr } from "../state/keplrConnections.ts";
import type { NFT } from "../utils/types.ts";

const router = express.Router();

/**
 * GET /getNFTs/:user
 *
 * Fetches all NFTs owned by a user (Forma wallet),
 * including their linked Keplr wallet (if available).
 *
 * Returns metadata-enhanced NFT objects, with flags indicating if the NFT is already placed on the grid.
 */
router.get("/:user", async (req: Request, res: Response) => {
  const { user } = req.params;

  try {
    // ───── 1. Check for linked Keplr wallet ─────
    const keplrWallet = getLinkedKeplr(user);
    let ownedNFTKeplr: NFT[] = [];

    if (keplrWallet) {
      const resKeplr = await fetch(`${process.env.INDEXER_URL}/api/owned-by/${keplrWallet}`, {
        headers: { 'x-source': 'keplr' },
      });

      ownedNFTKeplr = await resKeplr.json() as NFT[];
    }

    // ───── 2. Fetch NFTs from Forma wallet ─────
    const resForma = await fetch(`${process.env.INDEXER_URL}/api/owned-by/${user}`, {
      headers: { 'x-source': 'forma' },
    });
    const ownedNFTForma = await resForma.json() as NFT[];

    const rawNFTList = [...ownedNFTKeplr, ...ownedNFTForma];
    const nftList = [];

    // ───── 3. Enrich each NFT with metadata and grid info ─────
    for (const nft of rawNFTList as any) {
      const key = getMetadataKey(nft.contract, nft.tokenId);

      let metadata;

      if (metadataCache.has(key)) {
        metadata = metadataCache.get(key);
      } else {
        const metadataRaw = await getMetadata(nft.contract, nft.tokenId);
        metadata = typeof metadataRaw === "string" ? JSON.parse(metadataRaw) : metadataRaw;
        metadataCache.set(key, metadata);
      }

      const NFTOnGridResponse = await fetch(
        `${process.env.INDEXER_URL}/api/grids/with-nft/${nft.contract}/${nft.tokenId}`
      );
      const NFTOnGrid = await NFTOnGridResponse.json();

      nftList.push({
        owner: user,
        nft: {
          address: nft.contract,
          name: metadata.name,
          tokenId: nft.tokenId,
          image: normalizeUrl(metadata.image),
        },
        inGrid: NFTOnGrid
      });
    }

    res.json(nftList);
  } catch (err: any) {
    const shortMsg = err?.message?.slice(0, 300)?.replace(/\n/g, " ") || "Unknown error";
    console.error("❌ [getNFTs/:user] Failed to fetch NFTs:", shortMsg);
    res.status(500).json({ error: "Failed to fetch NFT data." });
  }
});

export default router;