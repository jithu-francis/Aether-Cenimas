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
      className={`transition-all duration-500 max-w-[280px] ${
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
        return [...prev.slice(-2), latest]; // keep fewer in overlay to avoid clutter
      });
      // Auto-scroll chat panel if open
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
      className="absolute inset-0 z-[100] pointer-events-none group"
      onMouseMove={resetHideTimer}
    >
      {/* ── Floating Background Glow ─────────────────── */}
      <div className={`absolute inset-0 bg-black/20 transition-opacity duration-1000 ${showControls ? 'opacity-100' : 'opacity-0'}`} />

      {/* ── Reaction System ─────────────────────────── */}
      <ReactionSystem 
        reactions={reactions} 
        onSendReaction={sendReaction}
        showBar={showControls && !isChatPanelOpen}
      />

      {/* ── Top-right: Status & Controls ──────────────── */}
      <div
        className={`absolute top-6 right-6 flex items-center gap-3 transition-all duration-700 pointer-events-auto ${
          showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl glass-panel-strong border-glow">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-bold text-white/70 uppercase tracking-widest">
            {viewers.length} Viewers
          </span>
        </div>

        <button
          onClick={isSynced ? onStopSync : onInitSync}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider backdrop-blur-md border transition-all duration-300 ${
            isSynced 
              ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20" 
              : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white"
          }`}
        >
          <div className={isSynced ? "sync-dot" : "sync-dot-inactive"} style={{ width: 8, height: 8 }} />
          {isSynced ? "Synced" : "Sync Playback"}
        </button>

        <button
          onClick={() => setIsChatPanelOpen(!isChatPanelOpen)}
          className={`p-3 rounded-2xl glass-panel-strong transition-all duration-300 ${
            isChatPanelOpen ? "text-accent-blue bg-accent-blue/10 border-accent-blue/20" : "text-white/40 hover:text-white hover:bg-white/5"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>

      {/* ── Floating catch-up messages (Bottom-left) ── */}
      {!isChatPanelOpen && (
        <div className="absolute bottom-24 left-8 space-y-3 pointer-events-none transition-all duration-500">
          {displayMessages.map((msg) => (
            <FloatingMessage
              key={msg.id}
              message={msg}
              onExpire={() => removeMessage(msg.id)}
            />
          ))}
        </div>
      )}

      {/* ── Slide-out Chat Panel ───────────────────── */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-80 glass-panel-strong rounded-none border-l border-white/5 transition-transform duration-500 pointer-events-auto z-[200] ${
          isChatPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full bg-midnight/40 backdrop-blur-3xl saturate-200">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-accent-blue">Live Chat</h3>
            <button onClick={() => setIsChatPanelOpen(false)} className="text-white/20 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
            {messages.map((msg) => (
              <div key={msg.id} className="animate-slide-up">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[11px] font-black uppercase tracking-wider ${msg.name === userName ? 'text-accent-pink' : 'text-accent-blue/80'}`}>
                    {msg.name}
                  </span>
                  <span className="text-[9px] text-white/20">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-sm text-white/70 leading-relaxed font-medium">{msg.text}</p>
              </div>
            ))}
          </div>

          <div className="p-6 pt-0 mt-auto">
            {/* Quick Reactions in Chat Panel */}
            <div className="flex justify-between mb-4 mt-2">
              {["❤️", "😂", "🔥", "💯"].map(emoji => (
                <button key={emoji} onClick={() => sendReaction(emoji)} className="text-xl hover:scale-125 transition-transform">{emoji}</button>
              ))}
            </div>
            
            <form onSubmit={handleSend} className="relative group">
              <input
                ref={inputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Message..."
                className="w-full glass-input pr-12 text-sm"
                autoComplete="off"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-blue opacity-40 group-focus-within:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
