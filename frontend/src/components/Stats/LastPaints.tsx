import { AnimatePresence, motion } from "framer-motion";
import { useWebSocket } from "../../context/useWebSocket";

const LastPaints = () => {
  const { lastPaints } = useWebSocket();

  return (
    <div className="absolute top-6 right-6 w-[250px] bg-[#121212] border border-[#2a2a2a] rounded-lg shadow-xl p-3 text-white text-xs space-y-2">
      <h3 className="text-sm font-semibold text-white font-mono">Last 5 Paints</h3>
      <ul className="space-y-1 max-h-[280px] overflow-hidden">
        <AnimatePresence initial={false}>
          {lastPaints.map((paint) => (
            <motion.li
              key={paint.gridId + paint.paintedAt}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col border border-[#1e1e1e] rounded-md p-2"
            >
              <div className="flex text-[#ccc] font-mono items-center">
                <img
                  src={paint.nftImage}
                  alt={paint.nftName}
                  className="w-4 h-4 rounded-sm"
                />
                <span className="ml-2 truncate">Grid #{paint.gridId}</span>
                <span className="text-[#8b5cf6] ml-auto">
                  {paint.painter.slice(0, 6)}...{paint.painter.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between mt-1 text-[#777] font-mono">
                <span className="truncate">{paint.nftName}</span>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
};

export default LastPaints;