"use client";

export default function SyncControls({ 
  isSynced, 
  isStandalone, 
  setIsStandalone, 
  viewerCount, 
  onInitSync, 
  onStopSync,
  onShowHelp
}) {
  const canStartSync = viewerCount > 1;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
      <div className="flex flex-wrap items-center gap-3 flex-1 sm:flex-none">
        {/* Help Icon */}
        <button
          onClick={onShowHelp}
          className="p-2 sm:p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-slate-500 hover:text-white hover:bg-white/10 transition-all group shadow-sm flex-shrink-0"
          title="Show Help"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        {/* Main Toggle Button */}
        {isSynced ? (
          <button
            onClick={onStopSync}
            className="flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all duration-300 font-black text-[10px] sm:text-xs uppercase tracking-widest group flex-1 sm:flex-auto"
            id="sync-stop-btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:rotate-90 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Stop Sync
          </button>
        ) : (
          <div className="flex flex-col gap-2 flex-1 sm:flex-none">
            <button
              onClick={onInitSync}
              disabled={!canStartSync}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl transition-all duration-300 font-black text-[10px] sm:text-xs uppercase tracking-widest group flex-1 sm:flex-auto ${
                canStartSync 
                  ? "bg-accent-blue/10 text-accent-blue border border-accent-blue/20 hover:bg-accent-blue/20 glow-blue" 
                  : "bg-white/[0.03] text-slate-600 border border-white/5 cursor-not-allowed opacity-50"
              }`}
              id="sync-start-btn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:scale-125 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
              Start Sync
            </button>
            {!canStartSync && (
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest text-center sm:text-left">
                Only you are viewing
              </span>
            )}
          </div>
        )}

        {/* Standalone Toggle (only visible during sync) */}
        {isSynced && (
          <button
            onClick={() => setIsStandalone(!isStandalone)}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl transition-all duration-300 font-black text-[10px] sm:text-xs uppercase tracking-widest flex-1 sm:flex-auto border ${
              isStandalone 
                ? "bg-accent-purple/10 text-accent-purple border-accent-purple/20 hover:bg-accent-purple/20" 
                : "bg-white/[0.03] text-slate-400 border-white/5 hover:bg-white/10"
            }`}
          >
            {isStandalone ? "Rejoin Sync" : "Watch Alone"}
          </button>
        )}
      </div>

      {/* Sync Status Indicator */}
      <div className="flex items-center sm:flex-col gap-3 sm:gap-0 flex-shrink-0 border-t sm:border-t-0 sm:border-l border-white/5 pt-3 sm:pt-0 sm:pl-6">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
          <div className={isSynced && !isStandalone ? "sync-dot" : "sync-dot-inactive"} />
          <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${isSynced && !isStandalone ? 'text-accent-blue' : 'text-slate-500'}`}>
            {isSynced ? (isStandalone ? "STANDALONE" : "LIVE SYNC") : "OFFLINE"}
          </span>
        </div>
        <p className="text-[8px] sm:text-[9px] font-bold text-slate-600 uppercase tracking-tighter hidden sm:block">
          {isSynced ? (isStandalone ? "Watching privately" : "Playback linked") : "Local playback"}
        </p>
      </div>
    </div>
  );
}
