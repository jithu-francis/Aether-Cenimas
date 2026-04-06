"use client";

// Avatar color generator based on name
function getAvatarColor(name) {
  const colors = [
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-pink-500",
    "from-green-500 to-emerald-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-red-500",
    "from-indigo-500 to-violet-500",
    "from-teal-500 to-cyan-500",
    "from-fuchsia-500 to-purple-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function ViewersList({ viewers, currentUser }) {
  if (!viewers || viewers.length === 0) return null;

  return (
    <div className="glass-panel p-4" id="viewers-panel">
      <div className="flex items-center gap-2 mb-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-accent-cyan"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Watching Now
        </h3>
        <span className="ml-auto text-xs font-bold text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded-full">
          {viewers.length}
        </span>
      </div>

      <div className="space-y-2">
        {viewers.map((viewer) => (
          <div
            key={viewer.id}
            className="flex items-center gap-2.5 group"
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarColor(
                viewer.name
              )} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
            >
              {viewer.name.charAt(0).toUpperCase()}
            </div>

            {/* Name */}
            <span
              className={`text-sm truncate ${
                viewer.name === currentUser
                  ? "text-accent-blue font-semibold"
                  : "text-slate-300"
              }`}
            >
              {viewer.name}
              {viewer.name === currentUser && (
                <span className="text-[10px] text-slate-500 ml-1">(you)</span>
              )}
            </span>

            {/* Online dot */}
            <div className="ml-auto w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
