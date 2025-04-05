import { ConnectButton } from "@rainbow-me/rainbowkit";

/**
 * Wallet component
 * Renders a sticky wallet connection button using RainbowKit
 * Appears bottom-left with consistent dark styling
 */
const Wallet = () => {
  return (
    <div className="fixed bottom-4 left-10 z-50 text-xs bg-[#181818] border border-[#2a2a2a] text-[#aaa] px-4 py-3 rounded-lg shadow-md">
      <ConnectButton />
    </div>
  );
};

export default Wallet;