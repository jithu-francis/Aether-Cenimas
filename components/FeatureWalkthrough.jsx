"use client";

import { useState, useEffect } from "react";

const STEPS = [
  {
    title: "Welcome to Aether Stream",
    description: "Your private screening room is ready. Let's show you how to make the most of your viewing experience.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Synchronized Playback",
    description: "Click 'Start Sync' to link your player with others in the room. Pause, play, and seek will happen for everyone simultaneously.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
  },
  {
    title: "Standalone Mode",
    description: "In a synced room, use 'Watch Alone' to pause or seek privately. Click 'Rejoin Sync' to instantly snap back to the group's time.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-accent-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    title: "Live Interactions",
    description: "Chat and reactions are active only during synchronization. If the sync stops, the conversation resets for a clean slate.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    title: "Fluid Controls",
    description: "On mobile? Double-tap the video to toggle fullscreen. In landscape mode, use the reaction bar to express yourself instantly.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function FeatureWalkthrough({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  // Reset to first step when opened
  useEffect(() => {
    if (isOpen) setCurrentStep(0);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/90 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-md glass-panel-strong p-8 sm:p-10 border-white/10 relative overflow-hidden animate-slide-up">
        {/* Progress Background Overlay */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" 
          style={{ 
            clipPath: `inset(0 ${100 - ((currentStep + 1) / STEPS.length) * 100}% 0 0)` 
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-[2rem] bg-white/[0.03] border border-white/5 flex items-center justify-center mb-8 shadow-2xl">
            {step.icon}
          </div>

          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">
            Step {currentStep + 1} of {STEPS.length}
          </p>
          
          <h2 className="text-2xl font-black text-white mb-4 tracking-tight">
            {step.title}
          </h2>
          
          <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10 max-w-[280px]">
            {step.description}
          </p>

          <div className="flex flex-col w-full gap-4">
            <button
              onClick={handleNext}
              className="btn-primary w-full py-4 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3"
            >
              {currentStep === STEPS.length - 1 ? "Start Watching" : "Next Feature"}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            
            <button
              onClick={onClose}
              className="text-[10px] font-black text-slate-600 hover:text-slate-400 uppercase tracking-widest transition-colors py-2"
            >
              Skip Introduction
            </button>
          </div>

          {/* Dots */}
          <div className="flex items-center gap-2 mt-8">
            {STEPS.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1 rounded-full transition-all duration-500 ${
                  idx === currentStep ? "w-8 bg-accent-blue" : "w-2 bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
