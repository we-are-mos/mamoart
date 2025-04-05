// ─────────────────────────────────────────────
// 🔗 In-memory link between user and Keplr wallet
// ─────────────────────────────────────────────

/**
 * Maps connected user identifiers (e.g. wallet addresses) to their linked Keplr wallet addresses.
 * This is used to associate a Forma wallet with a Cosmos-based Keplr wallet.
 */
const keplrConnections = new Map<string, string>();

/**
 * Links a Keplr wallet address to a specific user.
 * Called when a user connects or verifies their Keplr wallet via the UI.
 *
 * @param user - The Forma wallet or session identifier
 * @param keplrAddress - The linked Cosmos wallet address
 */
export function linkKeplrWallet(user: string, keplrAddress: string) {
  keplrConnections.set(user, keplrAddress);
}

/**
 * Retrieves the linked Keplr wallet address for a user.
 * Used when rendering or verifying Keplr-based ownership in the backend.
 *
 * @param user - The Forma wallet or session identifier
 * @returns The Keplr address, or undefined if not linked
 */
export function getLinkedKeplr(user: string): string | undefined {
  return keplrConnections.get(user);
}

/**
 * Exposes the raw internal map, for advanced access (read-only).
 */
export { keplrConnections };