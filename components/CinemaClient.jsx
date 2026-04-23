"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { useSync } from "@/lib/useSync";
import { useChat } from "@/lib/useChat";
import { useViewers } from "@/lib/useViewers";
import { useReactions } from "@/lib/useReactions";
import SyncControls from "./SyncControls";
import ChatDrawer from "./ChatDrawer";
import FeatureWalkthrough from "./FeatureWalkthrough";
import ViewersList from "./ViewersList";
import FullscreenOverlay from "./FullscreenOverlay";
import ReactionSystem from "./ReactionSystem";

// Dynamic import for ArtPlayer (no SSR)
const VideoPlayer = dynamic(() => import("./VideoPlayer"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full bg-midnight-50/50 rounded-3xl flex items-center justify-center animate-pulse border border-white/5"
      style={{ aspectRatio: "16/9" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-accent-blue/10 border-t-accent-blue rounded-full animate-spin" />
        <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Initializing Aether...</span>
      </div>
    </div>
  ),
});

export default function CinemaClient({ userName }) {
  const router = useRouter();
  const playerRef = useRef(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Hooks
  const {
    isSynced,
    isStandalone,
    setIsStandalone,
    isRemoteAction,
    initSync,
    stopSync,
    sendPlay,
    sendPause,
    sendSeek,
  } = useSync(playerRef);
  const { messages, sendMessage, clearMessages } = useChat();
  const { viewers } = useViewers();
  const { reactions, sendReaction, clearReactions } = useReactions();

  // Walkthrough State
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);

  // Combined state for messaging availability
  const canMessage = isSynced && !isStandalone;

  // Auto-trigger walkthrough for New Users
  useEffect(() => {
    const hasSeen = localStorage.getItem("aether-has-seen-walkthrough");
    if (!hasSeen) {
      // Delay slightly for better transition
      const timer = setTimeout(() => setWalkthroughOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseWalkthrough = () => {
    localStorage.setItem("aether-has-seen-walkthrough", "true");
    setWalkthroughOpen(false);
  };

  // Connect socket on mount
  useEffect(() => {
    connectSocket(userName);
    return () => disconnectSocket();
  }, [userName]);

  // Handle message clearing on sync STOP
  const prevSynced = useRef(false);
  useEffect(() => {
    if (isSynced && !prevSynced.current) {
      clearMessages();
      clearReactions();
    }
    // NEW: Clear messages for everyone when sync stops globally
    if (!isSynced && prevSynced.current) {
      clearMessages();
      clearReactions();
    }
    prevSynced.current = isSynced;
  }, [isSynced, clearMessages, clearReactions]);

  // Player callbacks
  const handlePlay = useCallback(
    (time) => {
      if (!isRemoteAction.current) {
        sendPlay(time);
      }
    },
    [sendPlay, isRemoteAction]
  );

  const handlePause = useCallback(
    (time) => {
      if (!isRemoteAction.current) {
        sendPause(time);
      }
    },
    [sendPause, isRemoteAction]
  );

  const handleSeek = useCallback(
    (time) => {
      if (!isRemoteAction.current) {
        sendSeek(time);
      }
    },
    [sendSeek, isRemoteAction]
  );

  const handleFullscreenChange = useCallback((state) => {
    setIsFullscreen(state);
  }, []);

  const handleInitSync = useCallback(() => {
    const time = playerRef.current?.currentTime || 0;
    const isPlaying = playerRef.current ? !playerRef.current.paused : false;
    initSync(time, isPlaying);
  }, [initSync]);

  const handleStopSync = useCallback(() => {
    stopSync();
  }, [stopSync]);

  // Logout
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <div className="cinema-bg min-h-screen selection:bg-accent-blue/30 selection:text-white">
      <div className="cinema-bg-overlay" />
      
      {/* ── Premium Top Bar ─────────────────────────── */}
      <header className="relative z-30 flex items-center justify-between px-3 py-3 sm:px-6 sm:py-5 border-b border-white/[0.03]">
        <div className="flex items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-accent-blue via-accent-purple to-accent-pink p-[1px] shadow-lg shadow-accent-blue/20">
            <div className="w-full h-full rounded-[10px] sm:rounded-[15px] bg-[#020617] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-black text-white tracking-tighter">
              AETHER <span className="text-gradient">STREAM</span>
            </h1>
            <p className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] sm:tracking-[0.2em]">Private Cinema v2.0</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* User badge */}
          <div className="hidden sm:flex items-center gap-3 glass-panel px-4 py-2 rounded-2xl border-white/5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white text-xs font-black shadow-inner">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-bold text-white tracking-wide">{userName}</span>
          </div>

          {/* Chat toggle */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-500 relative border ${
              chatOpen
                ? "bg-accent-blue/10 text-accent-blue border-accent-blue/30 glow-blue"
                : "bg-white/[0.03] border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] sm:h-5 sm:min-w-[20px] px-1 sm:px-1.5 bg-accent-pink rounded-full text-[8px] sm:text-[10px] flex items-center justify-center text-white font-black border-2 border-[#020617] animate-bounce">
                {messages.length > 9 ? "9+" : messages.length}
              </span>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-300"
            title="Leave Cinema"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Main Content ────────────────────────────── */}
      <main className="relative z-10 max-w-[1400px] mx-auto px-3 py-4 sm:px-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
          {/* Left: Player + Info */}
          <div className="flex-1 space-y-4 sm:space-y-8 min-w-0">
            {/* Video Player */}
            <div className="relative group p-[1px] sm:p-[2px] rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/10 to-transparent">
              <div className="rounded-[14px] sm:rounded-[22px] overflow-hidden bg-black/40 backdrop-blur-3xl shadow-2xl">
                <VideoPlayer
                  playerRef={playerRef}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onSeek={handleSeek}
                  onFullscreenChange={handleFullscreenChange}
                >
                  <FullscreenOverlay
                    isFullscreen={isFullscreen}
                    isSynced={isSynced}
                    isStandalone={isStandalone}
                    canMessage={canMessage}
                    onInitSync={handleInitSync}
                    onStopSync={handleStopSync}
                    messages={messages}
                    onSendMessage={sendMessage}
                    viewers={viewers}
                    userName={userName}
                  />
                  {/* Reaction Overlay also for non-fullscreen but subtle */}
                  {!isFullscreen && (
                    <ReactionSystem 
                      reactions={reactions} 
                      onSendReaction={sendReaction}
                      showBar={false} // Bar shown elsewhere
                    />
                  )}
                </VideoPlayer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-8 items-start">
              {/* Controls and Movie Details */}
              <div className="md:col-span-8 space-y-4 sm:space-y-8">
                {/* Controls Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-6 glass-panel p-4 sm:p-6 border-white/[0.05]">
                  <SyncControls
                    isSynced={isSynced}
                    isStandalone={isStandalone}
                    setIsStandalone={setIsStandalone}
                    viewerCount={viewers.length}
                    onInitSync={handleInitSync}
                    onStopSync={handleStopSync}
                    onShowHelp={() => setWalkthroughOpen(true)}
                  />

                  <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap justify-center sm:justify-end">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSynced ? 'bg-accent-blue animate-pulse' : 'bg-slate-700'}`} />
                    {isSynced ? "Real-time sync active" : "Sync inactive"}
                  </div>
                </div>

                {/* Mobile Viewers List — Visible only on mobile/tablet */}
                <div className="block md:hidden">
                  <ViewersList viewers={viewers} currentUser={userName} />
                </div>

                {/* Movie Info Card */}
                <div className="glass-panel p-5 sm:p-8 border-white/[0.05] overflow-hidden">
                  <div className="flex flex-col sm:flex-row gap-6 sm:gap-10">
                    {/* Poster with dynamic scaling */}
                    <div className="w-full sm:w-48 lg:w-64 flex-shrink-0 group/poster relative shadow-2xl">
                      <div className="aspect-[2/3] w-full bg-white/5 rounded-2xl overflow-hidden border border-white/10 p-1">
                        <img
                          src={process.env.MOVIE_POSTER || "/poster.webp"}
                          alt="Movie Poster"
                          className="w-full h-full object-cover rounded-xl transition-transform duration-1000 group-hover/poster:scale-110"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/poster.webp";
                          }}
                        />
                        {/* Now Showing Badge */}
                        <div className="absolute top-4 left-4 glass-panel px-2.5 py-1.5 border-white/10 flex items-center gap-2 backdrop-blur-xl shadow-lg">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                          <span className="text-[9px] font-black text-white tracking-[0.15em] uppercase">Now Showing</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="mb-4">
                        <h2 className="text-2xl sm:text-4xl font-black text-white mb-3 tracking-tighter leading-none text-gradient block sm:inline-block">
                          {process.env.MOVIE_TITLE || "I Am Kathalan"}
                        </h2>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 tracking-wider">2024</span>
                          <span className="px-2.5 py-1 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-[10px] font-black text-accent-blue tracking-wider">MALAYALAM</span>
                          <span className="px-2.5 py-1 rounded-lg bg-accent-purple/10 border border-accent-purple/20 text-[10px] font-black text-accent-purple tracking-wider">CYBER THRILLER</span>
                        </div>
                      </div>

                      <p className="text-sm sm:text-base font-medium text-slate-400 leading-relaxed max-w-2xl mb-6 italic border-l-2 border-white/5 pl-4">
                        {process.env.MOVIE_DESCRIPTION || "A gripping cyber thriller following Vishnu, an engineering graduate who uses his hacking skills for revenge against his ex-girlfriend's powerful father."}
                      </p>

                      <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-white/20">DIR</span>
                          <span className="text-slate-300">Girish A.D.</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                        <div className="flex items-center gap-2">
                          <span className="text-white/20">CAST</span>
                          <span className="text-slate-300">Naslen, Lijomol Jose</span>
                        </div>
                      </div>

                      <div className="pt-6">
                        <a 
                          href="/api/download"
                          className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-accent-blue/50 hover:bg-accent-blue/10 text-white font-bold text-sm tracking-wide shadow-lg hover:shadow-accent-blue/20 hover:-translate-y-0.5 active:scale-95 transition-all outline-none group"
                        >
                          <div className="p-1.5 rounded-lg bg-accent-blue/20 text-accent-blue group-hover:bg-accent-blue group-hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </div>
                          <div className="flex flex-col items-start pr-2">
                            <span className="text-[10px] text-slate-400 group-hover:text-accent-blue/80 uppercase tracking-widest transition-colors mb-0.5">Watch Offline</span>
                            <span className="text-sm leading-none">Download Movie</span>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar: Reactions & Viewers List */}
              <div className="md:col-span-4 space-y-4 sm:space-y-6">
                {/* Desktop/Tablet Reaction Bar */}
                <div className="glass-panel p-4 sm:p-6 border-white/[0.05]">
                  <h3 className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 sm:mb-6">Send Reaction</h3>
                  <div className="grid grid-cols-4 gap-2 sm:gap-3">
                    {["❤️", "😂", "😮", "🔥", "🚀", "👏", "💯", "😢"].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => sendReaction(emoji)}
                        className="reaction-btn text-lg sm:text-xl aspect-square flex items-center justify-center p-0"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Desktop Viewers List — Hidden on mobile, visible only on md+ screens */}
                <div className="hidden md:block">
                  <ViewersList viewers={viewers} currentUser={userName} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Chat Drawer ─────────────────────────────── */}
      <ChatDrawer
        isOpen={chatOpen}
        onToggle={() => setChatOpen(!chatOpen)}
        messages={messages}
        onSendMessage={sendMessage}
        userName={userName}
        canMessage={canMessage}
      />

      <FeatureWalkthrough
        isOpen={walkthroughOpen}
        onClose={handleCloseWalkthrough}
      />
    </div>
  );
}
