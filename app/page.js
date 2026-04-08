import LoginForm from "@/components/LoginForm";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  // Check if user is already logged in
  const token = cookies().get(COOKIE_NAME)?.value;
  const payload = await verifyToken(token);
  
  if (payload) {
    redirect("/cinema");
  }

  return (

    <main className="cinema-bg min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="cinema-bg-overlay" />
      
      {/* ── Ambient Background Effects ──────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-accent-blue/[0.03] blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-accent-purple/[0.03] blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* ── Background Poster (Faded) ───────────────── */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.03] scale-110 blur-sm"
        style={{ backgroundImage: `url(${process.env.MOVIE_POSTER || "/poster.webp"})` }}
      />

      {/* ── Login Container ─────────────────────────── */}
      <div className="relative z-10 w-full max-w-[440px] animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-accent-blue via-accent-purple to-accent-pink p-[1.5px] shadow-2xl shadow-accent-blue/20 rotate-3">
              <div className="w-full h-full rounded-[1.9rem] bg-[#020617] flex items-center justify-center -rotate-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl font-black text-white mb-3 tracking-tighter">
            AETHER <span className="text-gradient">STREAM</span>
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">
            Private Screening Room
          </p>
        </div>

        {/* ── Login Card ────────────────────────────── */}
        <div className="glass-panel-strong p-10 border-white/[0.05] relative overflow-hidden">
          {/* Subtle inner glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent-blue/10 blur-[60px] pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-xl font-black text-white mb-2 tracking-tight">Welcome Back</h2>
            <p className="text-slate-400 text-sm font-medium mb-8">Enter your credentials to join the session</p>
            <LoginForm />
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────── */}
        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.05]">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Server Online</span>
          </div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            Invitation Only • Encrypted Stream
          </p>
        </div>
      </div>
    </main>
  );
}
