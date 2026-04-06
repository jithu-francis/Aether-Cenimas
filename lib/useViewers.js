"use client";

import { useState, useEffect } from "react";
import { getSocket } from "./socket";

export function useViewers() {
  const [viewers, setViewers] = useState([]);

  useEffect(() => {
    const socket = getSocket();

    socket.on("viewers:list", (viewerList) => {
      setViewers(viewerList);
    });

    return () => {
      socket.off("viewers:list");
    };
  }, []);

  return { viewers };
}
