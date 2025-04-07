import { useEffect, useRef, useState } from "react"
import { estimatePaintGas, getAdminSignature } from "../../utils/viemToContract"
import { useSignMessage, useWalletClient } from 'wagmi'

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

type PaintModalProps = {
  gridId: number
  nftList: NFT[]
  onClose: () => void
  onReset: () => void
  user: string
}

type paintData = {
  gridId: number
  nftAddress:`0x${string}`
  tokenId: number,
  realRequiredAmount: bigint,
  adminSignature: `0x${string}`
}

const PaintModal = ({
  gridId,
  nftList,
  onClose,
  onReset,
  user
}: PaintModalProps) => {
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null)
  const [status, setStatus] = useState<"selecting" | "pending" | "success" | "fail">("selecting")
  const selectedNFT = nftList.find((nft) => nft.nft.tokenId === selectedTokenId)
  const ongoingProcess = useRef<boolean>(false);
  const [isKeplrConnected, setIsKeplrConnected] = useState<{ hasConnected: boolean, address: string } | null>(null)
  const checkedForKeplr = useRef<boolean>(false);
  const [visualGas, setVisualGas] = useState<number | null>(null);
  const [visualGasInDollars, setVisualGasInDollars] = useState<number | null>(null);
  const [protocolFee, setProtocolFee] = useState<number | null>(null);
  const [protocolFeeInDollars, setProtocolFeeInDollars] = useState<number | null>(null);
  const tia = useRef<number | null>(null);
  const txLink = useRef<string>("");

  const paintData = useRef<paintData | null>(null);

  const { signMessageAsync } = useSignMessage();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    if (user && !isKeplrConnected?.hasConnected && !checkedForKeplr.current) {
      const getIsKeplrConnected = async () => {
        const isKeplrConnectedRes = await fetch(`${import.meta.env.VITE_BACKEND_REST}/connectKeplr/checkIfConnected/${user}`);
        const isKeplrConnectedData = await isKeplrConnectedRes.json();
    
        setIsKeplrConnected(isKeplrConnectedData)
        checkedForKeplr.current = true;
        return isKeplrConnected;
      }
      getIsKeplrConnected()
    }
  }, [isKeplrConnected, user])

  useEffect(() => {
    if (!selectedTokenId || !selectedNFT || ongoingProcess.current) return;

    ongoingProcess.current = true;
    
    const nftAddress = selectedNFT?.nft.address;
    const tokenId = Number(selectedTokenId);

    const evmAddress: `0x${string}` = nftAddress.startsWith("stars") ? "0xce1e5713ce1e5713ce1e5713ce1e5713ce1e5713" : nftAddress as `0x${string}`

    const message = `Verify ownership for ${evmAddress} #${selectedTokenId}`
    signMessageAsync({ message }).then((signature) => {
      getAdminSignature(user as `0x${string}`, signature, gridId, evmAddress, nftAddress, tokenId).then((adminResponse) => {
        estimatePaintGas(gridId, evmAddress, tokenId, adminResponse.signature, BigInt(adminResponse.requiredAmount)).then((gasses) => {
          getTiaPrice().then(() => {
            setVisualGas(parseFloat(gasses.gasCostInTia.toFixed(4)));
            setVisualGasInDollars(parseFloat((gasses.gasCostInTia * tia.current!).toFixed(3)));
            setProtocolFee(parseFloat(gasses.protocolFeeInTia.toFixed(4)));
            setProtocolFeeInDollars(parseFloat((gasses.protocolFeeInTia * tia.current!).toFixed(3)));

            paintData.current = {
              gridId: gridId,
              nftAddress: evmAddress,
              tokenId: tokenId,
              realRequiredAmount: adminResponse.requiredAmount,
              adminSignature: adminResponse.signature,
            }
          })
        });
      });
    }).catch((err) => {
      console.warn("Signature cancelled or failed:", err);
      onClose();
      ongoingProcess.current = false;
    });

  }, [selectedTokenId, gridId, selectedNFT, signMessageAsync, onClose, user])
  
  const DotLoader = () => (
    <div className="flex space-x-1 text-[#666]">
      <span className="w-1 h-1 bg-[#666] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
      <span className="w-1 h-1 bg-[#666] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
      <span className="w-1 h-1 bg-[#666] rounded-full animate-bounce"></span>
    </div>
  );

  const getTiaPrice = async () => {
    const priceRes = await fetch("https://api.coinlore.net/api/ticker/?id=136105");
    const priceData = await priceRes.json();
    tia.current = priceData[0]?.price_usd ?? 3;
  }

  const abi = [
    {
      type: "function",
      name: "paint",
      stateMutability: "payable",
      inputs: [
        {
          name: "gridId",
          type: "uint256",
          internalType: "uint256"
        },
        {
          name: "nftAddress",
          type: "address",
          internalType: "address"
        },
        {
          name: "tokenId",
          type: "uint256",
          internalType: "uint256"
        },
        {
          name: "requiredAmount",
          type: "uint256",
          internalType: "uint256"
        },
        {
          name: "signature",
          type: "bytes",
          internalType: "bytes"
        }
      ],
      outputs: [],
    },
    {
      type: "function",
      name: "nonces",
      stateMutability: "view",
      inputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256"
        }
      ],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256"
        }
      ]
    }
  ];

  const connectKeplr = async () => {
    try {
      if (window.keplr && window.getOfflineSigner) {
        await window.keplr.enable("stargaze-1");
        const offlineSigner = window.getOfflineSigner("stargaze-1");
        const accounts = await offlineSigner.getAccounts();
        const keplrAddress = accounts[0].address;
        
        const message = `Link your Keplr wallet to ${user}`;
        
        const signed = await window.keplr.signArbitrary!(
          "stargaze-1",
          keplrAddress,
          message
        );

        const signature = signed.signature;
        const pubKey = signed.pub_key.value;

        try {
          const keplrRes = await fetch(`${import.meta.env.VITE_BACKEND_REST}/connectKeplr`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              keplrAddress,
              user,
              message,
              signature,
              pubKey
            })
          });

          const keplrConnected = await keplrRes.json() as { hasConnected: boolean, address: string };

          if (keplrConnected?.hasConnected){
            onReset();
          }

        } catch (err) {
          console.log("Error on connecting Keplr:", err)
        }
      } else {
        console.error("Keplr wallet not found");
      }
    } catch (err) {
      console.error("Failed to connect Keplr:", err);
    }
  };

  const sendTransaction = async (): Promise<`0x${string}` | null> => {
    if (walletClient) {
      try {
        const tx = await walletClient.writeContract({
          abi,
          address: '0xE8c4B5f422B5B227A76Be53a1b82a8Df2263Fa8E',
          functionName: 'paint',
          args: [
            gridId,
            paintData.current?.nftAddress,
            paintData.current?.tokenId,
            paintData.current?.realRequiredAmount,
            paintData.current?.adminSignature
          ],
          value: paintData.current?.realRequiredAmount,
        });

        return tx;
      } catch {
        console.log("Error On Sending Tx");
        return null;
      }
    }
    console.log("Error: No Wallet Client");
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      {!selectedTokenId ? (
        <div className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-6 w-[600px] max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 text-sm text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold font-mono">Grid {gridId}</h2>
            <button
              onClick={onClose}
              className="text-[#888] hover:text-[#ccc] text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div>
            <p className="text-[#aaa] mb-3">Choose an NFT to paint with:</p>

            {/* Connect wallet area */}
            {!isKeplrConnected ? (<></>) : isKeplrConnected.hasConnected ? (
              <div
                className="flex items-center w-max justify-center gap-2 mb-4 bg-[#1e1e1e] border border-[#3a3a3a] text-white font-medium px-4 py-2 rounded-md transition text-sm"
              >
                <img src="/keplr.png" alt="Keplr" className="w-[48px] h-[16px]" />
                <span className="font-mono text-[11px] mt-[0.1rem]">{isKeplrConnected.address}</span>
              </div>
              ) : (
                <>
                <p className="text-[#f97316] font-mono text-xs mb-4">
                  ⚠️ Once you link a Cosmos wallet, it cannot be changed. Please make sure you're connecting the correct Keplr account.
                </p>
                <div
                    onClick={connectKeplr}
                    className="flex items-center w-max justify-center gap-2 mb-4 bg-[#1e1e1e] border border-[#3a3a3a] hover:border-[#8b5cf6] text-white font-medium px-4 py-2 rounded-md transition text-sm cursor-pointer"
                  >
                    <img src="/keplr.png" alt="Keplr" className="w-[48px] h-[16px]" />
                    <span className="font-mono text-[11px] mt-[0.1rem]">Connect Keplr Wallet</span>
                </div>
                </>
            )}

            {nftList.length === 0 ? (
              <p className="text-[#666] text-center text-sm italic">
                You don't have any NFTs eligible for painting. Currently you can only use <a className="underline" target="_blank" href="https://modularium.art/collection/mammoths">Mammoths</a> & <a className="underline" target="_blank" href="https://www.stargaze.zone/m/stars10n0m58ztlr9wvwkgjuek2m2k0dn5pgrhfw9eahg9p8e5qtvn964suc995j/tokens">
                Celestine Sloth Society</a> to paint.
              </p>
            ) : (
              <div className={`
                grid grid-cols-3 gap-4 
                overflow-y-auto 
                max-h-[450px] 
                pr-2
              `}>
                {nftList.map((nft, i) => (
                  <div
                    key={i}
                    onClick={() => !nft.inGrid && setSelectedTokenId(nft.nft.tokenId)}
                    className={nft.inGrid ? 'border border-[#2a2a2a] rounded-md p-2' : 'border border-[#2a2a2a] rounded-md p-2 hover:border-[#8b5cf6] cursor-pointer transition group'}
                  >
                    <div className="w-full aspect-square mb-2">
                      <img
                        src={nft.nft.image}
                        alt={nft.nft.name}
                        className={`w-full h-full object-cover rounded ${nft.inGrid && 'grayscale'}`}
                      />
                    </div>
                    <p className={`text-xs font-mono ${nft.inGrid ? 'text-[#757575]' : 'text-[#f1f1f1]'} group-hover:text-[#8b5cf6] text-center`}>
                      {nft.nft.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className={`bg-[#121212] border border-[#2a2a2a] rounded-xl p-6 w-[350px] shadow-2xl text-sm text-white transition-all duration-300 ease-in-out ${status === "fail" ? "animate-shake" : ""} ${
            status == "pending" || status == "success" || status == "fail" ? "h-[235px] overflow-hidden flex flex-col gap-6" : "h-[460px] space-y-6"
          }`}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold font-mono">{status === "pending" ? "Sending Transaction" : status === "success" ? "Transaction Confirmed" : status === "fail" ? "Transaction Failed" : selectedTokenId && "Preparing Transaction"}</h2>
            {status != "pending" && (
              <button
                onClick={onClose}
                className="text-[#888] hover:text-[#ccc] text-sm cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="space-y-3 text-[#ccc] text-sm leading-relaxed">
            {status !== "success" && status !== "fail" && (
              <>
                <p><span className="text-[#888]">Grid:</span> <span className="font-mono text-white">#{gridId}</span></p>
                <p><span className="text-[#888]">NFT:</span> <span className="font-mono text-white">{selectedNFT?.nft.name}</span></p>
              </>
            )}

            {status === "success" && (
              <div className="bg-[#1e1e1e] text-green-400 text-sm rounded-md px-4 py-2 text-center border border-[#2e2e2e]">
                <p>Successfully painted! Your NFT is now live on the grid {gridId}.</p>
                <a
                  href={txLink.current}
                  target="_blank"
                  className="text-[#8b5cf6] hover:underline text-sm"
                >
                  View on Explorer →
                </a>
              </div>
            )}

            {status === "fail" && (
              <div className="bg-[#1e1e1e] text-red-400 text-sm rounded-md px-4 py-2 text-center border border-[#2e2e2e]">
                Transaction failed. Please try again or check your wallet.
              </div>
            )}

            {status !== "pending" && status !== "success" && status !== "fail" && (
              <>
                <div className="flex items-center gap-1">
                  <span className="text-[#888]">Chain:</span>
                  <span className="text-[#8b5cf6]">Forma</span>
                  <div className="relative group inline-block w-4 h-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#666] cursor-pointer" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.25 9a.75.75 0 011.5 0v5a.75.75 0 01-1.5 0V9z" clipRule="evenodd" />
                    </svg>
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#1f1f1f] text-[#ccc] text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                      Transactions will be processed on the Forma network.
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#2a2a2a] my-2" />

                <p>
                  <span className="text-[#888]">Contract:</span>{" "}
                  <a
                    href="https://explorer.forma.art/address/0xE8c4B5f422B5B227A76Be53a1b82a8Df2263Fa8E"
                    target="_blank"
                    className="text-[#8b5cf6] hover:underline"
                  >
                    MOSMamoArt ↗
                  </a>
                </p>
                <p><span className="text-[#888]">Your Address:</span> <span className="font-mono text-white">{user.slice(0,6)+"..."+user.slice(-4)}</span></p>

                <div className="border-t border-[#2a2a2a] my-2" />

                <div className="flex gap-2 items-center">
                  <span className="text-[#888]">Est. Gas Fee:</span>{" "}
                  {visualGas ? (
                    <span className="text-[#ddd] font-mono">{visualGas} TIA <span className="text-[#888]">(${visualGasInDollars!})</span></span>
                  ) : (
                    <div className="ml-2"><DotLoader /></div>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-[#888]">Protocol Fee:</span>{" "}
                  {protocolFee ? (
                    <span className="text-[#ddd] font-mono">{protocolFee} TIA <span className="text-[#888]">(${protocolFeeInDollars!})</span></span>
                  ) : (
                    <div className="ml-2"><DotLoader /></div>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-[#888]">Est. Total Fee:</span>{" "}
                  {visualGas && protocolFee ? (
                    <span className="text-[#ddd] font-mono">{(visualGas + protocolFee).toFixed(4)} TIA <span className="text-[#888]">(${(visualGasInDollars! + protocolFeeInDollars!).toFixed(3)})</span></span>
                  ) : (
                    <div className="ml-2"><DotLoader /></div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="mt-auto mb-0">
            <button
              onClick={() => {
                if (!paintData.current) return;
                setStatus("pending");
                sendTransaction().then((tx) => {
                  if (tx) {
                    new Promise(r => setTimeout(r, 3500)).then(() => {
                      txLink.current = `https://explorer.forma.art/tx/${tx}`;
                      setStatus("success");
                    })
                  } else {
                    setStatus("fail");
                  }
                })
                //onPaint(selectedTokenId)
              }}
              className={`w-full py-2 rounded-md text-white font-semibold shadow-md transition flex items-center justify-center h-[41px] ${
                status === "pending"
                  ? "bg-[#444] cursor-not-allowed"
                  : status === "success" ? "bg-green-800" : !visualGas ? "bg-[#222]" :"bg-[#8b5cf6] hover:bg-[#7c4ce0] cursor-pointer"
              }`}
              disabled={status === "pending" || status === "success"}
            >
              { !visualGas ? (
                <div className="flex space-x-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
                </div>
              ) : status === "pending"
                ? "Waiting for Confirmation..."
                : status === "success"
                ? "Success"
                : status === "fail"
                ? "Try Again"
                : "Confirm Transaction"
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaintModal