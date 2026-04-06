"use client";

export default function SyncControls({ isSynced, onInitSync, onStopSync }) {
  return (
    <div className="flex items-center gap-6">
      {/* Toggle button */}
      {isSynced ? (
        <button
          onClick={onStopSync}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all duration-300 font-black text-xs uppercase tracking-widest group"
          id="sync-stop-btn"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Stop Sync
        </button>
      ) : (
        <button
          onClick={onInitSync}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-accent-blue/10 text-accent-blue border border-accent-blue/20 hover:bg-accent-blue/20 transition-all duration-300 font-black text-xs uppercase tracking-widest glow-blue group"
          id="sync-start-btn"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:scale-125" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
          Start Sync
        </button>
      )}

      {/* Sync status indicator */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-0.5">
          <div className={isSynced ? "sync-dot" : "sync-dot-inactive"} />
          <span className={`text-[10px] font-black uppercase tracking-widest ${isSynced ? 'text-accent-blue' : 'text-slate-500'}`}>
            {isSynced ? "LIVE SYNC" : "OFFLINE"}
          </span>
        </div>
        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">
          {isSynced ? "Playback linked for all" : "Local playback only"}
        </p>
      </div>
    </div>
  );
}
