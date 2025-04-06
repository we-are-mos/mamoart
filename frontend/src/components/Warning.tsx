import { useWebSocket } from "../context/useWebSocket";

/**
 * Warning component
 * Shown when WebSocket connection is lost
 */
const Warning = () => {
  const { socket } = useWebSocket();
  
  if (!socket) return (
    <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 bg-red-900 text-white px-6 py-4 rounded-xl shadow-lg text-sm font-medium animate-bounce">
      ⚠️ Lost connection to the server. Please refresh the page.
    </div>
  );
};

export default Warning;