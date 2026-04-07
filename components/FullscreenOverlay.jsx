"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ReactionSystem from "./ReactionSystem";
import { useReactions } from "@/lib/useReactions";

// Floating message for quick catch-up — small and non-intrusive
function FloatingMessage({ message, onExpire }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onExpire, 500);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onExpire]);

  return (
    <div
      className={`transition-all duration-500 max-w-[260px] ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 scale-90"
      }`}
    >
      <div className="floating-bubble inline-flex items-center gap-2">
        <span className="font-bold text-accent-blue/90">{message.name}</span>
        <span className="text-white/80">{message.text}</span>
      </div>
    </div>
  );
}

export default function FullscreenOverlay({
  isFullscreen,
  isSynced,
  onInitSync,
  onStopSync,
  messages,
  onSendMessage,
  viewers,
  userName,
}) {
  const [showControls, setShowControls] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [displayMessages, setDisplayMessages] = useState([]);
  const hideTimeout = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const { reactions, sendReaction } = useReactions();

  // Auto-hide controls after 5s of inactivity
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => {
      if (!isChatPanelOpen) setShowControls(false);
    }, 5000);
  }, [isChatPanelOpen]);

  useEffect(() => {
    if (!isFullscreen) return;
    resetHideTimer();
    return () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, [isFullscreen, resetHideTimer]);

  // Show new messages as floating bubbles
  useEffect(() => {
    if (messages.length > 0) {
      const latest = messages[messages.length - 1];
      setDisplayMessages((prev) => {
        if (prev.find((m) => m.id === latest.id)) return prev;
        return [...prev.slice(-2), latest];
      });
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [messages]);

  const removeMessage = useCallback((id) => {
    setDisplayMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const handleSend = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput);
    setChatInput("");
  };

  if (!isFullscreen) return null;

  return (
    <div
      className="absolute inset-0 z-[100] pointer-events-none"
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      {/* ── Background dim ─────────────────────────── */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${showControls ? 'bg-gradient-to-b from-black/50 via-transparent to-black/30 opacity-100' : 'opacity-0'}`} />

      {/* ── Reaction System (floating emojis always visible) ── */}
      <ReactionSystem 
        reactions={reactions} 
        onSendReaction={sendReaction}
        showBar={false}
      />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── TOP BAR ─────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════ */}
      <div
        className={`absolute top-0 left-0 right-0 transition-all duration-700 pointer-events-auto ${
          showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          {/* Left: Movie title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight truncate">AETHER STREAM</h3>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Cinema Mode</p>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Viewer count */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl fs-control-pill">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] sm:text-xs font-bold text-white/70 tabular-nums">
                {viewers.length}
              </span>
            </div>

            {/* Sync toggle */}
            <button
              onClick={isSynced ? onStopSync : onInitSync}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 fs-control-pill ${
                isSynced 
                  ? "text-red-400 border-red-500/30 hover:bg-red-500/20" 
                  : "text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSynced ? 'bg-red-400 animate-pulse' : 'bg-white/30'}`} />
              <span className="hidden sm:inline">{isSynced ? "Stop Sync" : "Sync"}</span>
              <span className="sm:hidden">{isSynced ? "Stop" : "Sync"}</span>
            </button>

            {/* Chat toggle */}
            <button
              onClick={() => setIsChatPanelOpen(!isChatPanelOpen)}
              className={`p-2 sm:p-2.5 rounded-xl fs-control-pill transition-all duration-300 ${
                isChatPanelOpen ? "text-accent-blue bg-accent-blue/15 border-accent-blue/30" : "text-white/40 hover:text-white hover:bg-white/10"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── BOTTOM REACTION BAR (Premium Floating) ──── */}
      {/* ═══════════════════════════════════════════════ */}
      <div
        className={`absolute bottom-[72px] sm:bottom-20 left-1/2 -translate-x-1/2 transition-all duration-700 pointer-events-auto ${
          showControls && !isChatPanelOpen
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-90 pointer-events-none"
        }`}
      >
        <div className="fs-reaction-bar">
          {["❤️", "😂", "😮", "🔥", "🚀", "👏", "💯", "😢"].map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              className="fs-reaction-btn"
              title={`React ${emoji}`}
            >
              <span className="text-lg sm:text-xl">{emoji}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Floating catch-up messages (Bottom-left) ── */}
      {!isChatPanelOpen && (
        <div className="absolute bottom-28 sm:bottom-32 left-4 sm:left-6 space-y-2 pointer-events-none">
          {displayMessages.map((msg) => (
            <FloatingMessage
              key={msg.id}
              message={msg}
              onExpire={() => removeMessage(msg.id)}
            />
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── SLIDE-OUT CHAT PANEL ────────────────────── */}
      {/* ═══════════════════════════════════════════════ */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-72 sm:w-80 transition-transform duration-500 pointer-events-auto z-[200] ${
          isChatPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full fs-chat-panel">
          {/* Chat header */}
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-accent-blue">Live Chat</h3>
            </div>
            <button onClick={() => setIsChatPanelOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/20 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Chat messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 space-y-3 scroll-smooth">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest">No messages</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="animate-slide-up">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${msg.name === userName ? 'text-accent-pink' : 'text-accent-blue/80'}`}>
                      {msg.name}
                    </span>
                    <span className="text-[9px] text-white/15">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-medium">{msg.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Chat input + Quick reactions */}
          <div className="px-4 sm:px-5 py-3 border-t border-white/[0.06]">
            {/* Quick reactions */}
            <div className="flex justify-between mb-3">
              {["❤️", "😂", "🔥", "💯"].map(emoji => (
                <button key={emoji} onClick={() => sendReaction(emoji)} className="text-lg hover:scale-125 active:scale-95 transition-transform p-1">
                  {emoji}
                </button>
              ))}
            </div>
            
            <form onSubmit={handleSend} className="relative group">
              <input
                ref={inputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Message..."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent-blue/40 focus:bg-white/[0.06] transition-all pr-10"
                autoComplete="off"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-accent-blue opacity-40 group-focus-within:opacity-100 transition-opacity p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
