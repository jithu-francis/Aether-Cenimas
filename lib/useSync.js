"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSocket } from "./socket";
import { toast } from "sonner";

export function useSync(playerRef) {
  const [isSynced, setIsSynced] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [syncInfo, setSyncInfo] = useState(null);
  const isRemoteAction = useRef(false);
  const isSyncedRef = useRef(false);
  const isStandaloneRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    isSyncedRef.current = isSynced;
    isStandaloneRef.current = isStandalone;
  }, [isSynced, isStandalone]);

  useEffect(() => {
    const socket = getSocket();

    // Receive sync state
    socket.on("sync:state", (state) => {
      setIsSynced(state.active);
      isSyncedRef.current = state.active;
      setSyncInfo(state);

      if (state.active && state.initiatedBy) {
        // Only apply master state if NOT in standalone mode
        if (playerRef.current && !isStandaloneRef.current) {
          const diff = Math.abs(playerRef.current.currentTime - state.masterTime);
          if (diff > 0.8) {
            isRemoteAction.current = true;
            playerRef.current.currentTime = state.masterTime;
            if (state.isPlaying) playerRef.current.play();
            else playerRef.current.pause();
            setTimeout(() => (isRemoteAction.current = false), 800);
          }
        }

        toast.success(`${state.initiatedBy} started sync mode`, {
          icon: "🔗",
          duration: 3000,
        });
      }

      if (!state.active && state.stoppedBy) {
        toast.info(`${state.stoppedBy} stopped sync mode`, {
          icon: "🔓",
          duration: 3000,
        });
      }
    });

    // Remote play
    socket.on("sync:play", ({ name, time }) => {
      if (playerRef.current && !isStandaloneRef.current) {
        isRemoteAction.current = true;
        const diff = Math.abs(playerRef.current.currentTime - time);
        if (diff > 0.5) playerRef.current.currentTime = time;
        playerRef.current.play();
        toast(`${name} resumed playback`, { icon: "▶️", duration: 2000 });
        setTimeout(() => (isRemoteAction.current = false), 800);
      }
    });

    // Remote pause
    socket.on("sync:pause", ({ name, time }) => {
      if (playerRef.current && !isStandaloneRef.current) {
        isRemoteAction.current = true;
        const diff = Math.abs(playerRef.current.currentTime - time);
        if (diff > 0.5) playerRef.current.currentTime = time;
        playerRef.current.pause();
        toast(`${name} paused the movie`, { icon: "⏸️", duration: 2000 });
        setTimeout(() => (isRemoteAction.current = false), 800);
      }
    });

    // Remote seek
    socket.on("sync:seek", ({ name, time }) => {
      if (playerRef.current && !isStandaloneRef.current) {
        isRemoteAction.current = true;
        playerRef.current.currentTime = time;
        toast(`${name} jumped to ${formatTime(time)}`, { icon: "⏩", duration: 2000 });
        setTimeout(() => (isRemoteAction.current = false), 800);
      }
    });

    // Request current sync state on mount
    socket.emit("sync:request-state");

    return () => {
      socket.off("sync:state");
      socket.off("sync:play");
      socket.off("sync:pause");
      socket.off("sync:seek");
    };
  }, [playerRef]);

  const initSync = useCallback(
    (time, isPlaying) => {
      const socket = getSocket();
      socket.emit("sync:initiate", { time, isPlaying });
    },
    []
  );

  const stopSync = useCallback(() => {
    const socket = getSocket();
    socket.emit("sync:stop");
  }, []);

  // Use isSyncedRef to avoid stale closure — the callback
  // is only recreated when isSynced changes, but between state
  // updates the ref always has the current value.
  const sendPlay = useCallback(
    (time) => {
      if (!isSyncedRef.current || isStandaloneRef.current || isRemoteAction.current) return;
      const socket = getSocket();
      socket.emit("sync:play", { time });
    },
    []
  );

  const sendPause = useCallback(
    (time) => {
      if (!isSyncedRef.current || isStandaloneRef.current || isRemoteAction.current) return;
      const socket = getSocket();
      socket.emit("sync:pause", { time });
    },
    []
  );

  const sendSeek = useCallback(
    (time) => {
      if (!isSyncedRef.current || isStandaloneRef.current || isRemoteAction.current) return;
      const socket = getSocket();
      socket.emit("sync:seek", { time });
    },
    []
  );

  return {
    isSynced,
    isStandalone,
    setIsStandalone,
    syncInfo,
    isRemoteAction,
    initSync,
    stopSync,
    sendPlay,
    sendPause,
    sendSeek,
  };
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
