import { io } from "socket.io-client";

// Socket.IO lives on the same server as the API, without the /api suffix
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

export const createSocket = () =>
  io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    reconnection: true,
  });
