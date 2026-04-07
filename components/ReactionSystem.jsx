"use client";

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
            <div className="relative flex flex-col items-center">
              {/* Sender name tag */}
              <div className="mb-1.5 px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 shadow-xl">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] bg-clip-text text-transparent bg-gradient-to-r from-accent-blue via-accent-purple to-accent-cyan whitespace-nowrap">
                  {r.from}
                </span>
              </div>

              {/* The Emoji */}
              <div className="text-4xl sm:text-5xl drop-shadow-[0_0_12px_rgba(255,255,255,0.25)] filter brightness-110 saturate-150">
                {r.emoji}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Reaction Bar (non-fullscreen desktop/mobile) ─── */}
      {showBar && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-auto">
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onSendReaction(emoji)}
                className="reaction-btn text-xl sm:text-2xl"
                title={`Send ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
