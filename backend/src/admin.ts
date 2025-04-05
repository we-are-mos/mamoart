import {
  createWalletClient,
  createPublicClient,
  http,
  encodePacked,
  keccak256,
  toBytes,
  type Hex,
} from "viem";
import { privateKeyToAccount } from 'viem/accounts';
import { forma } from 'viem/chains';

// ─────────────────────────────────────────────
// 🔐 Contract Access Configuration
// ─────────────────────────────────────────────

/**
 * Admin private key used to sign paint actions.
 * This should never be exposed on the frontend.
 */
const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY as Hex;

/**
 * Deployed contract address for the Mamo painting logic.
 */
export const MAMO_ADDRESS = "0xE8c4B5f422B5B227A76Be53a1b82a8Df2263Fa8E";

/**
 * ABI fragment for only the used methods of the Mamo contract.
 * This includes:
 * - paint(): the core paint logic (payable)
 * - nonces(): returns the next nonce for a gridId
 */
export const MAMO_ABI = [
  {
    name: "paint",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "gridId", type: "uint256" },
      { name: "nftAddress", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "requiredAmount", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
  {
    name: "nonces",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
];

// ─────────────────────────────────────────────
// 🧠 Wallet Clients
// ─────────────────────────────────────────────

/**
 * Account created using the admin private key.
 * Used for signing operations via the wallet client.
 */
const account = privateKeyToAccount(PRIVATE_KEY);

/**
 * Client used to sign messages (admin-controlled).
 */
const walletClient = createWalletClient({
  account,
  chain: forma,
  transport: http(),
});

/**
 * Public client used for read-only contract calls.
 */
const publicClient = createPublicClient({
  chain: forma,
  transport: http(),
});

// ─────────────────────────────────────────────
// 📦 Nonce Fetching Logic
// ─────────────────────────────────────────────

/**
 * Fetches the latest nonce for a specific grid ID.
 * This nonce is required to create a unique signature
 * that can't be reused (prevents replay attacks).
 *
 * @param gridId - The ID of the grid tile to paint.
 * @returns The current nonce as a number.
 */
export async function getGridNonce(gridId: number): Promise<number> {
  try {
    const nonce = await publicClient.readContract({
      address: MAMO_ADDRESS,
      abi: MAMO_ABI,
      functionName: "nonces",
      args: [gridId],
    });

    return Number(nonce);
  } catch (err: any) {
    console.error("❌ [getGridNonce] Failed:", err?.message || "Unknown error");
    return 0;
  }
}

// ─────────────────────────────────────────────
// ✍️ Signature Generation for Painting
// ─────────────────────────────────────────────

/**
 * Generates an EIP-191 compliant signature for a paint action.
 * This signature includes:
 * - gridId
 * - nft contract address
 * - tokenId
 * - requiredAmount
 * - current grid nonce
 *
 * It ensures the paint can only be used once on-chain
 * and validates that it was signed by the backend (admin).
 *
 * @param gridId - The ID of the grid tile.
 * @param nftAddress - NFT contract address (stars or forma).
 * @param tokenId - NFT token ID.
 * @param requiredAmount - Required fee amount.
 * @returns A signed hex string or null if an error occurred.
 */
export async function generateSignature({
  gridId,
  nftAddress,
  tokenId,
  requiredAmount,
}: {
  gridId: number;
  nftAddress: `0x${string}`;
  tokenId: number;
  requiredAmount: bigint;
}): Promise<Hex | null> {
  try {
    const nonce = await getGridNonce(gridId);

    const packed = encodePacked(
      ["uint256", "address", "uint256", "uint256", "uint256"],
      [BigInt(gridId), nftAddress, BigInt(tokenId), requiredAmount, BigInt(nonce)]
    );

    const hash = keccak256(packed);

    const signature = await walletClient.signMessage({
      message: { raw: toBytes(hash) },
    });

    return signature;
  } catch (err: any) {
    console.error("❌ [generateSignature] Failed:", err?.message || "Unknown error");
    return null;
  }
}
