"use client";

import { io } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8010";

const getWsUrl = () => {
  if (typeof window === "undefined") return WS_URL;
  
  // If we're on a Network IP (not localhost), use that IP for the socket as well
  const { hostname, protocol } = window.location;
  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    // Determine the socket port (defaulting to 8010 if it's not the main site port)
    // In your setup, the socket is on 8010
    return `${protocol}//${hostname}:8010`;
  }
  
  return WS_URL;
};

let socket = null;

export function getSocket() {
  if (!socket) {
    const dynamicUrl = getWsUrl();
    socket = io(dynamicUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ["websocket", "polling"],
      secure: WS_URL.startsWith("https"),
      rejectUnauthorized: false, // For some proxy setups
      path: "/socket.io", // Ensure path is explicit
      withCredentials: true,
    });
  }
  return socket;
}

export function connectSocket(name) {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.once("connect", () => {
      s.emit("viewer:join", { name });
    });
  } else {
    s.emit("viewer:join", { name });
  }
  return s;
}

export function disconnectSocket() {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}
