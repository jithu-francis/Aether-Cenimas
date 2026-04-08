"use client";

import { useState, useRef, useEffect } from "react";

export default function ChatDrawer({
  isOpen,
  onToggle,
  messages,
  onSendMessage,
  userName,
  canMessage,
}) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !canMessage) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 z-50 transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full glass-panel-strong rounded-l-[32px] flex flex-col border-l border-white/[0.03] shadow-[-20px_0_60px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-white/[0.03] bg-white/[0.02]">
            <div className="flex flex-col">
              <h2 className="font-black text-white text-xl tracking-tighter">LIVE <span className="text-gradient">CHAT</span></h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Real-time discussion</p>
            </div>
            <button
              onClick={onToggle}
              className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-white"
              id="chat-close-btn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth">
            {!canMessage ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white/[0.01] rounded-[2rem] border border-dashed border-white/5">
                <div className="w-16 h-16 rounded-full bg-accent-blue/5 flex items-center justify-center mb-6 border border-accent-blue/10 animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent-blue/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25-2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-2">Chat Restricted</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                  Join a synchronization session to chat with others.
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-white/[0.02] flex items-center justify-center mb-4 border border-white/[0.05]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No messages yet</p>
                <p className="text-xs mt-2 text-slate-600 font-medium max-w-[200px]">Be the first to share your thoughts on the movie!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.name === userName ? "items-end" : "items-start"} animate-slide-up`}
                >
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${msg.name === userName ? "text-accent-pink" : "text-accent-blue/80"}`}>
                      {msg.name}
                    </span>
                    <span className="text-[9px] font-bold text-slate-600 uppercase">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed border ${
                    msg.name === userName
                      ? "bg-accent-blue/10 border-accent-blue/20 text-blue-50 rounded-tr-none"
                      : "bg-white/[0.03] border-white/5 text-slate-200 rounded-tl-none"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-8 border-t border-white/[0.03] bg-white/[0.01]">
            <form onSubmit={handleSend} className="relative group shadow-2xl" id="chat-form">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!canMessage}
                placeholder={canMessage ? "Say something..." : "Sync to chat..."}
                className={`glass-input pr-14 text-sm font-medium ${!canMessage ? 'opacity-30 cursor-not-allowed' : ''}`}
                id="chat-input"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!canMessage}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-accent-blue/20 text-accent-blue flex items-center justify-center hover:bg-accent-blue/30 transition-all border border-accent-blue/20 ${canMessage ? 'group-focus-within:scale-100 scale-90 opacity-40 group-focus-within:opacity-100' : 'opacity-10 scale-90'}`}
                id="chat-send-btn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
