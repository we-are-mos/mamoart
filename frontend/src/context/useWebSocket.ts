import { useContext } from "react";
import { WebSocketContext } from "./WebSocketContext";

/**
 * Custom React hook to access the WebSocket context.
 * 
 * Allows components to easily consume:
 * - WebSocket instance
 * - Live grid data
 * - Recent paints
 * - Paint statistics
 */
export const useWebSocket = () => useContext(WebSocketContext);