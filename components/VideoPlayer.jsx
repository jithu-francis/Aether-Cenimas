"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  const toggleFsRef = useRef(null);

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
      fullscreen: false,     // Disable built-in
      fullscreenWeb: false,  // Disable built-in
      subtitleOffset: false,
      miniProgressBar: true,
      autoHide: 6000,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      airplay: false, // Removed as per user request (extra control on iPhone)
      theme: "#3b82f6",
      hotkey: true,
      lock: false, // Disable built-in lock to avoid mobile gesture conflicts
      fastForward: true,
      moreVideoAttr: {
        crossOrigin: "anonymous",
        preload: "auto",
      },
      click: false, // Disable default play/pause on click
      dblclick: false, // Explicitly disable built-in double-click to fullscreen
      controls: [
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
        {
          name: "forward",
          position: "left",
          index: 2,
          html: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 17l5-5-5-5"/><text x="3" y="16" font-size="8" fill="currentColor" stroke="none" font-weight="bold">10</text></svg>`,
          tooltip: "Forward 10s",
          click: function () {
            art.currentTime = Math.min(art.duration, art.currentTime + 10);
          },
        },
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

    function toggleFullscreen() {
      const wrapper = wrapperRef.current;
      const video = art.video;
      if (!wrapper || !video) return;

      // Check if we are already in some form of fullscreen
      const isNativeFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      const isWebFs = wrapper.classList.contains("art-fullscreen-web");

      if (isNativeFs || isWebFs) {
        // Exit logic
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        wrapper.classList.remove("art-fullscreen-web");
        document.body.style.overflow = "";
      } else {
        // Enter logic
        const promise = wrapper.requestFullscreen?.() || wrapper.webkitRequestFullscreen?.();
        
        promise?.catch(() => {
          // If native fullscreen fails (common on iPhone), fallback to Web Fullscreen
          // which keeps our custom HTML overlays (reactions, chat, sync) visible.
          wrapper.classList.add("art-fullscreen-web");
          document.body.style.overflow = "hidden";
        });
      }
    }

    toggleFsRef.current = toggleFullscreen;

    // --- Refined Gesture Handling (Optimized for iPhone/Android) ---
    let lastTapTime = 0;
    let tapTimeout = null;

    let isTouch = false;

    const handleTap = (e) => {
      // Ignore taps on specific UI elements like buttons and drawers
      if (e.target.closest('.art-controls') || e.target.closest('.art-setting') || e.target.closest('#chat-drawer')) return;
      
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;
      
      // Prevent dual-firing touchstart + click events
      if (e.type === 'touchstart') {
        isTouch = true;
      } else if (e.type === 'click' && isTouch) {
        // If we just handled a touchstart, ignore the phantom click
        setTimeout(() => { isTouch = false; }, 500);
        return;
      }

      if (now - lastTapTime < DOUBLE_TAP_DELAY && lastTapTime !== 0) {
        // Double Tap confirmed: Toggle Fullscreen
        if (tapTimeout) {
          clearTimeout(tapTimeout);
          tapTimeout = null;
        }
        lastTapTime = 0; 
        toggleFsRef.current();
      } else {
        // Single Tap potential
        lastTapTime = now;
        tapTimeout = setTimeout(() => {
          if (tapTimeout) {
            tapTimeout = null;
            // Single tap logic: Toggle ONLY controls visibility
            if (artInstance.current) {
              const art = artInstance.current;
              art.controls.show = !art.controls.show;
              if (art.controls.show) {
                // Manually trigger control visibility logic to reset Artplayer's internal timer
                art.emit('control', true);
              }
            }
          }
        }, DOUBLE_TAP_DELAY + 20); 
      }
    };

    // Use a single point of entry for gestures to avoid dual-firing (touchstart + click)
    const container = containerRef.current;
    
    // For mobile, touchstart is more responsive
    container.addEventListener('touchstart', (e) => {
      handleTap(e);
    }, { passive: true });
    
    // For desktop, click is standard. We add a check inside handleTap to ignore 
    // clicks that happen immediately after touchstarts.
    art.on('click', (e) => {
      handleTap(e);
    });

    function handleFsChange() {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      if (onFullscreenChange) onFullscreenChange(isFs);
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
    document.addEventListener("webkitfullscreenchange", handleFsChange);

    art.on("ready", () => {
      setIsReady(true);
      if (playerRef) playerRef.current = art.video;
    });

    art.on("play", () => {
      if (onPlay && art.video) onPlay(art.video.currentTime);
    });

    art.on("pause", () => {
      if (onPause && art.video) onPause(art.video.currentTime);
    });

    art.on("seek", (time) => {
      if (!onSeek) return;
      clearTimeout(seekDebounce.current);
      seekDebounce.current = setTimeout(() => {
        if (Math.abs(time - lastSeekTime.current) > 0.5) {
          lastSeekTime.current = time;
          onSeek(time);
        }
      }, 300);
    });

    function handleKeyDown(e) {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        art.currentTime = Math.min(art.duration, art.currentTime + 10);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        art.currentTime = Math.max(0, art.currentTime - 10);
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFullscreen();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(seekDebounce.current);
      if (containerRef.current) {
        // No specific touch listener needed here anymore, art.on('click') handles it better now
      }
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
      document.removeEventListener("keydown", handleKeyDown);
      if (art && art.destroy) art.destroy(false);
    };
  }, [onPlay, onPause, onSeek, playerRef, onFullscreenChange]);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full bg-black rounded-xl overflow-hidden shadow-2xl"
      style={{ aspectRatio: "16/9", touchAction: "manipulation" }}
      id="player-wrapper"
    >
      {!isReady && (
        <div className="absolute inset-0 bg-midnight-50 rounded-xl flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
            <span className="text-slate-400 text-sm">Loading player...</span>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" id="artplayer-container" />
      {children}
    </div>
  );
}
