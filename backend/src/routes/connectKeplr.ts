import express, { type Request, type Response } from "express";
import { verifyADR36Amino } from "@keplr-wallet/cosmos";
import { fromBase64 } from "@cosmjs/encoding";
import { getLinkedKeplr, linkKeplrWallet } from "../state/keplrConnections";

const router = express.Router();

/**
 * POST /connectKeplr
 *
 * Verifies a Keplr wallet signature (ADR-36) and links it to a Forma wallet.
 * Prevents multiple wallets being linked to the same user.
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    if (!req.body || typeof req.body !== "object") {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const { keplrAddress, user, message, signature, pubKey } = req.body;

    // ─── Verify ADR-36 Amino Signature ─────
    const verified = verifyADR36Amino(
      "stars", // Chain ID
      keplrAddress,
      message,
      fromBase64(pubKey),
      fromBase64(signature)
    );

    if (!verified) {
      res.status(401).json({ success: false, message: "Invalid signature." });
      return;
    }

    // ─── Prevent overwriting existing connection ─────
    if (getLinkedKeplr(user)) {
      res.status(406).json({ success: false, message: "User already has wallet." });
      return;
    }

    // ─── Link the Keplr address to the user ─────
    linkKeplrWallet(user, keplrAddress);

    res.json({ hasConnected: true, address: keplrAddress });
  } catch (err: any) {
    const shortMsg = err?.message?.slice(0, 300)?.replace(/\n/g, " ") || "Unknown error";
    console.error("❌ [POST /connectKeplr] Failed:", shortMsg);
    res.status(500).json({ error: "Failed to connect Keplr wallet." });
  }
});

/**
 * GET /connectKeplr/checkIfConnected/:user
 *
 * Checks if the given user already has a linked Keplr wallet.
 */
router.get("/checkIfConnected/:user", async (req: Request, res: Response) => {
  try {
    if (!req.params || typeof req.params !== "object") {
      res.status(400).json({ error: "Invalid request parameters" });
      return;
    }

    const { user } = req.params;
    const keplrAddress = getLinkedKeplr(user);

    if (keplrAddress) {
      res.json({ hasConnected: true, address: keplrAddress });
    } else {
      res.json({ hasConnected: false });
    }
  } catch (err: any) {
    const shortMsg = err?.message?.slice(0, 300)?.replace(/\n/g, " ") || "Unknown error";
    console.error("❌ [GET /connectKeplr/checkIfConnected/:user] Failed:", shortMsg);
    res.status(500).json({ error: "Failed to check wallet connection." });
  }
});

export default router;