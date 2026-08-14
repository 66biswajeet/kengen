import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, Wrench, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function RoleSelect() {
  const nav = useNavigate();
  const { setRole } = useAuth();

  const pick = (r) => {
    setRole(r);
    nav("/login");
  };

  return (
    <div
      className="app-shell relative min-h-screen flex flex-col justify-between"
      style={{ background: "#F8FAFC" }}
      data-testid="role-select-screen"
    >
      <div className="px-6 pt-12 pb-8 flex-1 flex flex-col justify-center">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-white shadow-sm border border-slate-100 p-1.5 mb-1">
            <img src="/logo.png" alt="AquaServe Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-primary font-bold">
              WELCOME TO
            </div>
            <div className="font-display text-xl font-bold text-charcoal tracking-tight mt-0.5">
              AquaServe
            </div>
          </div>
          <p className="text-slate/80 text-xs mt-2 max-w-[240px] leading-relaxed">
            Choose your role. <br />
            You can change this later by logging out.
          </p>
        </div>

        {/* Role Cards */}
        <div className="flex flex-col gap-3.5 max-w-sm mx-auto w-full">
          {/* Client Card */}
          <button
            onClick={() => pick("service_needer")}
            className="bg-white rounded-2xl p-4 flex items-center gap-4 text-left border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/30 active:scale-[0.98] transition-all group"
            data-testid="role-client-card"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
              <Home size={18} strokeWidth={2} className="text-primary group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-semibold text-charcoal text-sm">
                I need a service
              </div>
              <div className="text-slate text-[11px] mt-0.5 leading-snug">
                Book installation, repair, filter change & AMC
              </div>
            </div>
            <ArrowRight size={15} className="text-slate/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          {/* Provider Card */}
          <button
            onClick={() => pick("provider")}
            className="bg-white rounded-2xl p-4 flex items-center gap-4 text-left border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-500/30 active:scale-[0.98] transition-all group"
            data-testid="role-provider-card"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Wrench size={18} strokeWidth={2} className="text-amber-700 group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-semibold text-charcoal text-sm">
                I provide service
              </div>
              <div className="text-slate text-[11px] mt-0.5 leading-snug">
                Get jobs, earn income and grow your business
              </div>
            </div>
            <ArrowRight size={15} className="text-slate/40 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-8 text-[10px] text-slate/60 text-center px-6">
        By continuing you agree to our <span className="underline cursor-pointer">Terms</span> & <span className="underline cursor-pointer">Privacy Policy</span>.
      </div>
    </div>
  );
}
