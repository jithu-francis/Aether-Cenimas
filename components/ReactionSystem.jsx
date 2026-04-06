"use client";

import { memo } from "react";

const EMOJIS = ["❤️", "😂", "😮", "😢", "🔥", "🚀", "👏", "💯"];

export default function ReactionSystem({ reactions, onSendReaction, showBar = true }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {/* ── Floating Reactions ─────────────────────── */}
      <div className="absolute inset-0">
        {reactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-0 animate-float-reaction"
            style={{
              left: `${r.x}%`,
              '--tw-translateX': `${r.xOffset}px`,
              '--tw-rotate': `${r.rotation}deg`
            }}
          >
            <div className="relative group flex flex-col items-center">
              {/* The Name Tag — Always visible but with a subtle entry */}
              <div 
                className="mb-2 px-3 py-1 rounded-full glass-panel-strong border-white/20 shadow-2xl animate-in fade-in zoom-in duration-500 fill-mode-forwards"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-accent-blue via-accent-purple to-accent-cyan whitespace-nowrap">
                  {r.from}
                </span>
              </div>

              {/* The Emoji — Large and Glowing */}
              <div className="text-5xl drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] filter brightness-110 saturate-150 transition-transform duration-300 hover:scale-125">
                {r.emoji}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Reaction Bar (Interactive) ─────────────── */}
      {showBar && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-2xl glass-panel-strong pointer-events-auto animate-slide-up">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSendReaction(emoji)}
              className="reaction-btn text-2xl"
              title={`Send ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
