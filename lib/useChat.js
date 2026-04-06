"use client";

import { useState, useEffect, useCallback } from "react";
import { getSocket } from "./socket";

export function useChat() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const socket = getSocket();

    socket.on("chat:message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("chat:message");
    };
  }, []);

  const sendMessage = useCallback((text) => {
    if (!text.trim()) return;
    const socket = getSocket();
    socket.emit("chat:message", { text: text.trim() });
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, sendMessage, clearMessages };
}
