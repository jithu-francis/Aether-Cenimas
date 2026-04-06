"use client";

import { useEffect, useRef, useState } from "react";
import Artplayer from "artplayer";

export default function VideoPlayer({
  onPlay,
  onPause,
  onSeek,
  playerRef,
  onFullscreenChange,
  children, // FullscreenOverlay will be passed as children
}) {
  const wrapperRef = useRef(null);
  const containerRef = useRef(null);
  const artInstance = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const lastSeekTime = useRef(0);
  const seekDebounce = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const art = new Artplayer({
      container: containerRef.current,
      url: "/api/stream",
      type: "mp4",
      volume: 0.7,
      autoplay: false,
      pip: true,
      autoSize: false,
      autoMini: true,
      screenshot: false,
      setting: true,
      loop: false,
      flip: false,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: false,     // Disable built-in — we handle it ourselves
      fullscreenWeb: false,  // Disable built-in
      subtitleOffset: false,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      airplay: true,
      theme: "#3b82f6",
      hotkey: true,
      lock: true,
      fastForward: true,
      moreVideoAttr: {
        crossOrigin: "anonymous",
        preload: "auto",
      },
      controls: [
        // ── Backward 10s ────────────────────────
        {
          name: "backward",
          position: "left",
          index: 1,
          html: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 17l-5-5 5-5"/><text x="13" y="16" font-size="8" fill="currentColor" stroke="none" font-weight="bold">10</text></svg>`,
          tooltip: "Backward 10s",
          click: function () {
            art.currentTime = Math.max(0, art.currentTime - 10);
          },
        },
        // ── Forward 10s ─────────────────────────
        {
          name: "forward",
          position: "left",
          index: 2,
          html: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 17l5-5-5-5"/><text x="3" y="16" font-size="8" fill="currentColor" stroke="none" font-weight="bold">10</text></svg>`,
          tooltip: "Forward 10s",
          click: function () {
            art.currentTime = Math.min(
              art.duration,
              art.currentTime + 10
            );
          },
        },
        // ── Custom Fullscreen (targets wrapper) ─
        {
          name: "fullscreen",
          position: "right",
          index: 100,
          html: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>`,
          tooltip: "Fullscreen",
          click: function () {
            toggleFullscreen();
          },
        },
      ],
    });

    artInstance.current = art;

    // ── Fullscreen handler (on wrapper div) ──────
    function toggleFullscreen() {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        wrapper.requestFullscreen().catch(() => {
          // Fallback: use web fullscreen (CSS-based)
          wrapper.classList.toggle("art-fullscreen-web");
        });
      }
    }

    // Listen for native fullscreen changes
    function handleFsChange() {
      const isFs = !!document.fullscreenElement;
      if (onFullscreenChange) {
        onFullscreenChange(isFs);
      }
      // Update wrapper styling
      if (wrapperRef.current) {
        if (isFs) {
          wrapperRef.current.style.width = "100vw";
          wrapperRef.current.style.height = "100vh";
        } else {
          wrapperRef.current.style.width = "";
          wrapperRef.current.style.height = "";
        }
      }
    }

    document.addEventListener("fullscreenchange", handleFsChange);

    // Expose video element for sync
    art.on("ready", () => {
      setIsReady(true);
      if (playerRef) {
        playerRef.current = art.video;
      }
    });

    // ── Play event ──────────────────────────────
    art.on("play", () => {
      if (onPlay && art.video) {
        onPlay(art.video.currentTime);
      }
    });

    // ── Pause event ─────────────────────────────
    art.on("pause", () => {
      if (onPause && art.video) {
        onPause(art.video.currentTime);
      }
    });

    // ── Seek event (debounced) ──────────────────
    art.on("seek", (time) => {
      if (!onSeek) return;
      clearTimeout(seekDebounce.current);
      seekDebounce.current = setTimeout(() => {
        if (Math.abs(time - lastSeekTime.current) > 1) {
          lastSeekTime.current = time;
          onSeek(time);
        }
      }, 300);
    });

    // ── Keyboard shortcuts for forward/backward ─
    function handleKeyDown(e) {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      )
        return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        art.currentTime = Math.min(art.duration, art.currentTime + 10);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        art.currentTime = Math.max(0, art.currentTime - 10);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(seekDebounce.current);
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("keydown", handleKeyDown);
      if (art && art.destroy) {
        art.destroy(false);
      }
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full bg-black rounded-xl overflow-hidden"
      style={{ aspectRatio: "16/9" }}
      id="player-wrapper"
    >
      {/* Loading skeleton */}
      {!isReady && (
        <div className="absolute inset-0 bg-midnight-50 rounded-xl flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
            <span className="text-slate-400 text-sm">Loading player...</span>
          </div>
        </div>
      )}

      {/* ArtPlayer container */}
      <div
        ref={containerRef}
        className="w-full h-full"
        id="artplayer-container"
      />

      {/* Fullscreen overlay (inside wrapper, so it's visible in fullscreen) */}
      {children}
    </div>
  );
}
