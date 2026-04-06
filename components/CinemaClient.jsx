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

  // Connect socket on mount
  useEffect(() => {
    connectSocket(userName);
    return () => disconnectSocket();
  }, [userName]);

  // Clear data when sync stops (ephemeral requirement)
  useEffect(() => {
    if (!isSynced) {
      clearMessages();
      clearReactions();
    }
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
      <header className="relative z-30 flex items-center justify-between px-6 py-6 border-b border-white/[0.03]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-blue via-accent-purple to-accent-pink p-[1px] shadow-lg shadow-accent-blue/20">
            <div className="w-full h-full rounded-[15px] bg-[#020617] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter">
              AETHER <span className="text-gradient">STREAM</span>
            </h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Private Cinema v2.0</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
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
            className={`p-3 rounded-2xl transition-all duration-500 relative border ${
              chatOpen
                ? "bg-accent-blue/10 text-accent-blue border-accent-blue/30 glow-blue"
                : "bg-white/[0.03] border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {messages.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1.5 bg-accent-pink rounded-full text-[10px] flex items-center justify-center text-white font-black border-2 border-[#020617] animate-bounce">
                {messages.length > 9 ? "9+" : messages.length}
              </span>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-300"
            title="Leave Cinema"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Main Content ────────────────────────────── */}
      <main className="relative z-10 max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Player + Info */}
          <div className="flex-1 space-y-8 min-w-0">
            {/* Video Player */}
            <div className="relative group p-[2px] rounded-3xl bg-gradient-to-br from-white/10 to-transparent">
              <div className="rounded-[22px] overflow-hidden bg-black/40 backdrop-blur-3xl shadow-2xl">
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

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Controls and Movie Details */}
              <div className="md:col-span-8 space-y-8">
                {/* Controls Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 glass-panel p-6 border-white/[0.05]">
                  <SyncControls
                    isSynced={isSynced}
                    onInitSync={handleInitSync}
                    onStopSync={handleStopSync}
                  />

                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                    <div className={`w-2 h-2 rounded-full ${isSynced ? 'bg-accent-blue animate-pulse' : 'bg-slate-700'}`} />
                    {isSynced ? "Real-time sync active" : "Synchronization inactive"}
                  </div>
                </div>

                {/* Movie Info Card */}
                <div className="glass-panel p-8 border-white/[0.05]">
                  <div className="flex flex-col sm:flex-row gap-8">
                    <div className="w-full sm:w-40 h-60 sm:h-auto rounded-2xl overflow-hidden flex-shrink-0 bg-white/5 p-1">
                      <img
                        src={process.env.MOVIE_POSTER || "/poster.webp"}
                        alt="Movie Poster"
                        className="w-full h-full object-cover rounded-xl shadow-lg transition-opacity duration-700"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/poster.webp";
                        }}
                      />
                    </div>

                    <div className="flex-1">
                      <h2 className="text-3xl font-black text-white mb-4 tracking-tight leading-tight">
                        {process.env.MOVIE_TITLE || "I Am Kathalan"}
                      </h2>
                      <div className="flex items-center gap-3 mb-6 flex-wrap">
                        <span className="text-[10px] font-black bg-accent-blue/10 text-accent-blue px-3 py-1.5 rounded-lg border border-accent-blue/20 tracking-tighter">2024</span>
                        <span className="text-[10px] font-black bg-accent-purple/10 text-accent-purple px-3 py-1.5 rounded-lg border border-accent-purple/20 tracking-tighter">MALAYALAM</span>
                        <span className="text-[10px] font-black bg-accent-pink/10 text-accent-pink px-3 py-1.5 rounded-lg border border-accent-pink/20 tracking-tighter">CYBER THRILLER</span>
                      </div>
                      <p className="text-sm font-medium text-slate-400 leading-relaxed max-w-2xl">
                        {process.env.MOVIE_DESCRIPTION || "A gripping cyber thriller following Vishnu, an engineering graduate who uses his hacking skills for revenge against his ex-girlfriend's powerful father."}
                      </p>
                      <div className="mt-8 flex items-center gap-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <span>Director: Girish A.D.</span>
                        <span className="w-1 h-1 rounded-full bg-slate-800" />
                        <span>Naslen, Lijomol Jose</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar: Reactions & Viewers List */}
              <div className="md:col-span-4 space-y-6">
                {/* Desktop Reaction Bar */}
                <div className="glass-panel p-6 border-white/[0.05] hidden md:block">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Send Reaction</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {["❤️", "😂", "😮", "🔥", "🚀", "👏", "💯", "😢"].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => sendReaction(emoji)}
                        className="reaction-btn text-xl aspect-square flex items-center justify-center p-0"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <ViewersList viewers={viewers} currentUser={userName} />
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
      />
    </div>
  );
}
