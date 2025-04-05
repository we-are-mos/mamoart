/// <reference types="vite/client" />
import type { OfflineSigner } from '@cosmjs/proto-signing';

declare global {
  interface Keplr {
    enable: (chainId: string) => Promise<void>;
    signArbitrary: (
      chainId: string,
      signer: string,
      data: string
    ) => Promise<{ signature: string; pub_key: { type: string; value: string } }>;
  }

  interface Window {
    keplr?: Keplr;
    getOfflineSigner?: (chainId: string) => OfflineSigner;
  }
}