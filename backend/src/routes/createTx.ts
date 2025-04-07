import express, { type Request, type Response } from "express";
import { verifyMessage } from "viem";
import { generateSignature } from "../admin";
import { getLinkedKeplr } from "../state/keplrConnections";
import { getTiaPrice } from "../state/tiaState";

const router = express.Router();

/**
 * POST /createTx/signature
 *
 * Verifies NFT ownership and returns a signed payload
 * that allows the user to paint a grid tile on-chain.
 *
 * Requires:
 * - Signature proving NFT ownership
 * - NFT not already painted
 * - Ownership by the connected Forma or linked Keplr wallet
 */
router.post("/signature", async (req: Request, res: Response) => {
  try {
    // ─── Validate request body ─────
    if (!req.body || typeof req.body !== "object") {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const { user, ownershipSignature, gridId, nftAddress, realNFTAddres, tokenId } = req.body;
    
    // ─── Check if painting started ─────
    if (process.env.PAINTING_STATUS?.toLowerCase() === "stopped") {res.status(401).json({ success: false, message: "Invalid signature." }); return;}

    // ─── Verify the ownership message signature ─────
    const signer = await verifyMessage({
      address: user as `0x${string}`,
      message: `Verify ownership for ${nftAddress} #${tokenId}`,
      signature: ownershipSignature as `0x${string}`,
    });

    if (!signer) {
      res.status(401).json({ success: false, message: "Invalid signature." });
      return;
    }

    // ─── Check NFT ownership from indexer ─────
    const onwedRes = await fetch(`${process.env.INDEXER_URL}/api/owned/${realNFTAddres}/${tokenId}`);
    const ownedData = await onwedRes.json();

    // ─── Ensure NFT is not already painted ─────
    const NFTOnGridResponse = await fetch(
      `${process.env.INDEXER_URL}/api/grids/with-nft/${nftAddress}/${tokenId}`
    );
    const NFTOnGrid = await NFTOnGridResponse.json();

    const keplrWallet = getLinkedKeplr(user);

    let isAvailableToPaint = false;
    const isOwned =
      (ownedData as any).owner === user.toLowerCase() ||
      (ownedData as any).owner === keplrWallet?.toLowerCase();

    if (isOwned && !NFTOnGrid) {
      isAvailableToPaint = true;
    }

    if (!isAvailableToPaint) {
      res.status(401).json({ success: false, message: "NFT is not available!" });
      return;
    }

    // ─── Fetch real-time TIA price from CoinGecko ─────
    const tiaPrice = getTiaPrice() as any;

    // ─── Determine paint fee based on grid state ─────
    const gridRes = await fetch(`${process.env.INDEXER_URL}/api/grid/${gridId}`);
    const gridData = await gridRes.json();

    let realRequiredAmount: bigint;

    if ((gridData as any).painter.toLowerCase() !== "0x0000000000000000000000000000000000000000") {
      // Overwriting an existing tile is more expensive
      realRequiredAmount = BigInt(Math.ceil((0.15 * 1e18) / tiaPrice));
    } else {
      realRequiredAmount = BigInt(Math.ceil((0.10 * 1e18) / tiaPrice));
    }

    // ─── Generate admin signature to allow painting ─────
    const signature = await generateSignature({
      gridId: Number(gridId),
      nftAddress: nftAddress as `0x${string}`,
      tokenId: Number(tokenId),
      requiredAmount: realRequiredAmount,
    });

    res.json({
      signature,
      requiredAmount: realRequiredAmount.toString(),
    });
  } catch (err: any) {
    const shortMsg = err?.message?.slice(0, 300)?.replace(/\n/g, " ") || "Unknown error";
    console.error("❌ [POST /createTx/signature] Failed:", shortMsg);
    res.status(500).json({ error: "Failed to verify ownership or sign transaction." });
  }
});

export default router;