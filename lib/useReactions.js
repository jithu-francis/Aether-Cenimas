"use client";

import { useState, useEffect, useCallback } from "react";
import { getSocket } from "./socket";

export function useReactions() {
  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    const socket = getSocket();

    const handleReaction = (reaction) => {
      // Add new reaction with a unique ID and random properties
      const newReaction = {
        ...reaction,
        x: Math.random() * 80 + 10, // 10% to 90% width
        xOffset: (Math.random() - 0.5) * 100, // -50px to 50px drift
        rotation: Math.random() * 60 - 30, // -30deg to 30deg
      };

      setReactions((prev) => [...prev, newReaction]);

      // Remove after animation (3s)
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 3500);
    };

    socket.on("reaction:receive", handleReaction);

    return () => {
      socket.off("reaction:receive", handleReaction);
    };
  }, []);

  const sendReaction = useCallback((emoji) => {
    const socket = getSocket();
    socket.emit("reaction:send", { emoji });
  }, []);

  const clearReactions = useCallback(() => {
    setReactions([]);
  }, []);

  return { reactions, sendReaction, clearReactions };
}
