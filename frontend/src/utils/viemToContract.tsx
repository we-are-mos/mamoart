import { createPublicClient, http } from "viem";
import { forma } from "viem/chains";

/**
 * 📍 MamoArt Smart Contract Address on Forma Chain
 */
const MAMO_ADDRESS = "0xE8c4B5f422B5B227A76Be53a1b82a8Df2263Fa8E";

/**
 * 📜 Partial ABI for MamoArt Contract (paint + nonce + custom errors)
 */
export const MAMO_ABI = [
  {
    type: "function",
    name: "paint",
    stateMutability: "payable",
    inputs: [
      { name: "gridId", type: "uint256", internalType: "uint256" },
      { name: "nftAddress", type: "address", internalType: "address" },
      { name: "tokenId", type: "uint256", internalType: "uint256" },
      { name: "requiredAmount", type: "uint256", internalType: "uint256" },
      { name: "signature", type: "bytes", internalType: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "nonces",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "error",
    name: "InvalidSignature",
    inputs: [],
  },
];

/**
 * 🔌 Public read-only client for Forma RPC interaction
 */
const publicClient = createPublicClient({
  chain: forma,
  transport: http(),
});

/**
 * 🔍 Estimates gas cost for the `paint()` function on the MamoArt contract
 */
export const estimatePaintGas = async (
  gridId: number,
  nftAddress: `0x${string}`,
  tokenId: number,
  signature: `0x${string}`,
  realRequiredAmount: bigint
) => {
  try {
    const gas = await publicClient.estimateContractGas({
      address: MAMO_ADDRESS,
      abi: MAMO_ABI,
      functionName: "paint",
      args: [gridId, nftAddress, tokenId, realRequiredAmount, signature],
      value: realRequiredAmount,
    });

    const gasPrice = await publicClient.getGasPrice();
    const estimatedCost = gas * gasPrice;

    return {
      gasCostInTia: Number(estimatedCost) / 1e18,
      protocolFeeInTia: Number(realRequiredAmount) / 1e18,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ Failed to estimate paint gas:", message);
    return { gasCostInTia: 0, protocolFeeInTia: Number(realRequiredAmount) / 1e18 };
  }
};

/**
 * ✍️ Requests backend to generate an admin signature for painting
 */
export const getAdminSignature = async (
  user: `0x${string}`,
  ownershipSignature: `0x${string}`,
  gridId: number,
  nftAddress: `0x${string}`,
  realNFTAddres: string,
  tokenId: number
) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_REST}/createTX/signature`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user,
        ownershipSignature,
        gridId,
        nftAddress,
        realNFTAddres,
        tokenId,
      }),
    });

    return await response.json();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ Admin signature fetch failed:", message);
    return { error: "Signature generation failed" };
  }
};