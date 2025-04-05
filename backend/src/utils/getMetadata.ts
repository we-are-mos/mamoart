import { createPublicClient, http } from "viem";
import { forma } from "viem/chains";
import { GraphQLClient, gql } from "graphql-request";

// ─────────────────────────────────────────────
// 📘 Minimal ERC721 ABI (read-only)
// ─────────────────────────────────────────────

/**
 * Partial ABI to read tokenURI from any ERC721 contract.
 */
const erc721ABI = [
  {
    name: "tokenURI",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }]
  }
];

// ─────────────────────────────────────────────
// 🔄 IPFS/HTTP/Base64 Metadata Fetcher
// ─────────────────────────────────────────────

/**
 * Fetches and parses NFT metadata from a token URI.
 * Supports:
 * - base64-encoded inline metadata
 * - http(s) and ipfs:// URLs
 *
 * @param tokenURI - The tokenURI string returned by the contract.
 * @returns Parsed metadata object or null on failure.
 */
async function fetchAndParseMetadata(tokenURI: string): Promise<any | null> {
  try {
    if (tokenURI.startsWith("data:application/json;base64,")) {
      const base64 = tokenURI.split(",")[1];
      const jsonStr = Buffer.from(base64, "base64").toString("utf-8");
      return JSON.parse(jsonStr);
    }

    const res = await fetch(tokenURI);
    if (!res.ok) throw new Error("Failed to fetch metadata URL");

    return await res.json();
  } catch (err: any) {
    const shortMsg = err?.message?.slice(0, 300)?.replace(/\n/g, " ") || "Unknown error";
    console.warn(`⚠️ Failed to fetch/parse metadata from URI: ${tokenURI} → ${shortMsg}`);
    return null;
  }
}

// ─────────────────────────────────────────────
// 🔗 Metadata via Forma (EVM)
// ─────────────────────────────────────────────

/**
 * Fetches metadata from a Forma-compatible EVM contract.
 * It calls the tokenURI() function and parses the result.
 *
 * @param contract - ERC721 contract address
 * @param tokenId - Token ID of the NFT
 * @returns Metadata string (JSON) or "unknown" on failure
 */
async function getMetadataFromForma(contract: string, tokenId: string) {
  const client = createPublicClient({
    chain: forma,
    transport: http()
  });

  try {
    const tokenURI = await client.readContract({
      address: contract as `0x${string}`,
      abi: erc721ABI,
      functionName: "tokenURI",
      args: [tokenId]
    });

    const metadata = await fetchAndParseMetadata(tokenURI as string);
    return metadata ? JSON.stringify(metadata) : "unknown";
  } catch (err: any) {
    const shortMsg = err?.message?.slice(0, 300)?.replace(/\n/g, " ") || "Unknown error";
    console.warn(`⚠️ Metadata fetch failed for ${contract} #${tokenId}: ${shortMsg}`);
    return "unknown";
  }
}

// ─────────────────────────────────────────────
// 🌌 Metadata via Stargaze (Cosmos)
// ─────────────────────────────────────────────

/**
 * Queries the Stargaze GraphQL API for NFT metadata.
 *
 * @param contract - Stargaze collection address (stars...)
 * @param tokenId - Token ID of the NFT (1-based index)
 * @returns Metadata string (JSON) or "unknown" on failure
 */
async function getMetadataFromStargaze(contract: string, tokenId: string) {
  const endpoint = "https://graphql.mainnet.stargaze-apis.com/graphql";
  const client = new GraphQLClient(endpoint);

  const query = gql`
    query($offset: Int!) {
      tokens(
        collectionAddr: "${contract}"
        limit: 1
        offset: $offset
      ) {
        tokens {
          metadata
        }
      }
    }
  `;

  try {
    const data = await client.request<{ tokens: { tokens: { metadata: any }[] } }>(query, {
      offset: Number(tokenId) - 1
    });

    const metadata = data.tokens?.tokens?.[0]?.metadata || null;
    return metadata ? JSON.stringify(metadata) : "unknown";
  } catch (err: any) {
    const shortMsg = err?.message?.slice(0, 300)?.replace(/\n/g, " ") || "Unknown error";
    console.error(`❌ GraphQL error for ${contract} #${tokenId}: ${shortMsg}`);
    return "unknown";
  }
}

// ─────────────────────────────────────────────
// 🎯 Unified Metadata Fetcher
// ─────────────────────────────────────────────

/**
 * Public entry point to fetch metadata for a given NFT.
 * Automatically detects if the contract is Stargaze or EVM.
 *
 * @param contract - NFT contract address
 * @param tokenId - Token ID of the NFT
 * @returns Stringified metadata or "unknown"
 */
export async function getMetadata(contract: string, tokenId: string) {
  if (contract.startsWith("stars")) {
    return getMetadataFromStargaze(contract, tokenId);
  } else {
    return getMetadataFromForma(contract, tokenId);
  }
}