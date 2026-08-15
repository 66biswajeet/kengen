import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Droplets, Sparkles, ShieldCheck } from "lucide-react";

export default function Branding() {
  const nav = useNavigate();

  return (
    <div
      className="app-shell relative min-h-screen flex flex-col justify-between"
      style={{ background: "#F8FAFC" }}
      data-testid="branding-screen"
    >
      {/* Subtle top ambient accent */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-blue-50/80 to-transparent pointer-events-none" />

      <div className="px-6 pt-12 pb-8 flex-1 flex flex-col justify-center max-w-sm mx-auto w-full z-10">
        {/* Minimal Card Container */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-5 animate-slide-up">
          
          {/* India Tag / Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-primary font-bold text-[11px] tracking-wide">
            <span>🇮🇳</span>
            <span>FIRST TIME IN INDIA</span>
            <Sparkles size={11} className="text-primary" />
          </div>

          {/* Logo & Icon */}
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center p-2.5 border border-primary/10">
              <img src="/logo.png" alt="AquaServe Logo" className="w-full h-full object-contain" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center shadow">
              <Droplets size={10} />
            </div>
          </div>

          {/* Main Headline */}
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-primary">
              AquaServe
            </div>
            <h1 className="font-display text-lg font-extrabold text-charcoal leading-snug">
              India’s first ever <span className="text-primary">KENGEN</span> water purifier services, now in India
            </h1>
          </div>

          <p className="text-slate text-xs leading-relaxed max-w-[240px]">
            Certified technician support, genuine filter replacements & specialized Kengen ionizer care.
          </p>

          {/* Feature Highlights - Minimal Pills */}
          <div className="w-full pt-1 space-y-2 text-left">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div className="w-6 h-6 rounded-lg bg-blue-100/60 text-primary flex items-center justify-center shrink-0">
                <Droplets size={13} />
              </div>
              <span className="font-semibold text-charcoal text-[11px]">Kengen & Alkaline Experts</span>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div className="w-6 h-6 rounded-lg bg-blue-100/60 text-primary flex items-center justify-center shrink-0">
                <ShieldCheck size={13} />
              </div>
              <span className="font-semibold text-charcoal text-[11px]">Doorstep Certified Support</span>
            </div>
          </div>

          {/* Continue Action Button */}
          <button
            onClick={() => nav("/role")}
            className="w-full py-3 px-5 rounded-2xl bg-primary hover:bg-primary-dark text-white font-display font-semibold text-xs shadow-button flex items-center justify-center gap-2 active:scale-[0.98] transition-all mt-2 group"
            data-testid="branding-continue-btn"
          >
            <span>Continue</span>
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-8 text-[10px] text-slate/60 text-center px-6">
        Tap continue to select your profile role
      </div>
    </div>
  );
}
