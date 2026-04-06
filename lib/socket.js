"use client";

import { io } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8010";

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(WS_URL, {
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
