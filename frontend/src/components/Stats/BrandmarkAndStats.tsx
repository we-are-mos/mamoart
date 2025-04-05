import { useWebSocket } from "../../context/useWebSocket";

/**
 * BrandmarkAndStats component
 *
 * Displays total paint statistics (count & unique users) and branding footer.
 * Anchored to the bottom-right corner of the screen.
 */
const BrandmarkAndStats = () => {
  const { stats } = useWebSocket();

  return (
    <div className="flex fixed bottom-4 right-10 z-50 gap-2">
      {/* Stats Box */}
      <div className="flex gap-2 text-xs bg-[#181818] border border-[#2a2a2a] text-[#aaa] px-4 py-3 rounded-lg shadow-md">
        <div className="flex gap-2">
          <div className="flex gap-1">
            <span className="text-[#666]">Total Paints: </span>
            <p>{stats?.totalPaints}</p>
          </div>
          <div className="flex gap-1">
            <span className="text-[#666]">Unique Painters: </span>
            <p>{stats?.totalUniqueUsers}</p>
          </div>
        </div>
      </div>

      {/* Powered by Link */}
      <div className="flex gap-2 text-xs bg-[#181818] border border-[#2a2a2a] text-[#aaa] px-4 py-3 rounded-lg shadow-md">
        <span className="text-[#666]">Powered by</span>
        <a
          href="https://x.com/mammothos"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#8b5cf6] hover:underline font-medium"
        >
          MammothOS
        </a>
      </div>
    </div>
  );
};

export default BrandmarkAndStats;