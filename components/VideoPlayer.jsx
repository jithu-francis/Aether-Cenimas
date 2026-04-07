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
      click: false, // Disable default play/pause on click
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

      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } else {
        const promise = wrapper.requestFullscreen?.() || wrapper.webkitRequestFullscreen?.();
        promise?.catch(() => {
          if (video.webkitEnterFullscreen) {
            video.webkitEnterFullscreen();
          } else {
            wrapper.classList.toggle("art-fullscreen-web");
          }
        });
      }
    }

    toggleFsRef.current = toggleFullscreen;

    let clickTimer = null;
    art.on('click', (e) => {
      // Ignore clicks on controls area
      if (e.target.closest('.art-controls') || e.target.closest('.art-setting')) return;
      
      if (clickTimer) {
        // Double click/tap detected
        clearTimeout(clickTimer);
        clickTimer = null;
        toggleFullscreen();
      } else {
        clickTimer = setTimeout(() => {
          clickTimer = null;
          // Single click: Toggle playback
          if (art.playing) art.pause();
          else art.play();
        }, 250); // Faster response
      }
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
