import { useEffect, useRef, useState } from "react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import PaintModal from "./PaintModal";
import { useAccount } from "wagmi";
import { GridType } from "../../context/WebSocketContext";

type InfoModalProps = {
  gridData: GridType
}

type NFT = {
  owner: string,
  nft: {
    address: string,
    name: string,
    tokenId: string,
    image: string
  },
  inGrid: boolean
}

const InfoModal = ({gridData}: InfoModalProps) => {
  const [showPaintModal, setShowPaintModal] = useState(false);
  const [wallet, setWallet] = useState<`0x${string}` | null>(null);
  const NFTList = useRef<NFT[] | null>(null)

  const { address, isConnected } = useAccount();

  useEffect(() => {
    const runLogin = async () => {
      if ( !isConnected || !address || wallet ) return;
      setWallet(address);
    };

    runLogin();
  }, [isConnected, address, wallet]);


  const handlePaintModal = async () => {
    if (!wallet) return;
    const response = await fetch(`${import.meta.env.VITE_BACKEND_REST}/getNFTs/${wallet}`);
    const data = await response.json();
    NFTList.current = data;

    setShowPaintModal(true);
  }

  const handleResetPaintModal = () => {
    setShowPaintModal(false);
    handlePaintModal();
  }

  return (
    <>
    <div className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-5 w-[320px] fixed z-50 top-10 left-10 shadow-[0_4px_30px_rgba(0,0,0,0.6)] space-y-4 text-sm">
      {/* Grid Info */}
      <div className="flex justify-between items-center">
        <p className="text-[#e5e5e5] font-semibold font-mono">Grid {gridData.gridId}</p>

        {!isConnected ? (
          <ConnectButton 
            accountStatus="address" 
            showBalance={{ smallScreen: false, largeScreen: false }} 
          />
        ) : gridData.isOwned ? (
          <button
            onClick={() => handlePaintModal()}
            className="bg-[#8b5cf6] hover:bg-[#7c4ce0] transition px-3 py-1 rounded-md text-sm text-white font-medium cursor-pointer"
          >
            Paint on it
          </button>
        ) : (
          <button
            onClick={() => handlePaintModal()}
            className="bg-[#10b981] hover:bg-[#0ea672] transition px-3 py-1 rounded-md text-sm text-white font-medium cursor-pointer"
          >
            Mint & Paint
          </button>
        )}
      </div>

      {/* Already Owned By Someone ? */}
      {gridData.isOwned ? (
        <>
          {/* NFT Info */}
          <div>
            <p className="text-[#888]">NFT:</p>
            <p className="text-[#f1f1f1] font-mono">{gridData.nftName}</p>
          </div>

          {/* Owner Info */}
          <div>
            <p className="text-[#888]">Owned by:</p>
            <p className="text-[#f1f1f1] font-mono">
              {gridData.painter?.slice(0,6)+"..."+gridData.painter?.slice(-4)}{' '}
              {gridData.painter?.toLowerCase() === wallet?.toLowerCase() && <span className="text-[#6ee7b7]">(You)</span>}
            </p>
          </div>

          {/* External Link */}
          {gridData.nftLink && (
            <a
              href={gridData.nftLink}
              target="_blank"
              className="text-[#8b5cf6] hover:underline text-sm"
            >
              View on Explorer →
            </a>
          )}
        </>
      ) : (
        <>
          {/* Status Info */}
          <div>
            <p className="text-[#888]">Status:</p>
            <p className="text-[#f1f1f1] font-mono">Unclaimed</p>
          </div>

          {/* Hint Text */}
          <p className="text-[#999] text-xs leading-relaxed">
            This grid hasn't been claimed yet. Mint it to become the owner and start painting on-chain.
          </p>
        </>
      )}
    </div>
    {showPaintModal && wallet && (
        <PaintModal
          user={wallet}
          gridId={gridData.gridId}
          nftList={NFTList.current as NFT []}
          onClose={() => setShowPaintModal(false)}
          onReset={() => handleResetPaintModal()}
        />
      )}
    </>
  )
}

export default InfoModal