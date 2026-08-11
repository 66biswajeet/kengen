import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, Wrench, ArrowRight, Droplet } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function RoleSelect() {
  const nav = useNavigate();
  const { setRole } = useAuth();

  const pick = (r) => {
    setRole(r);
    nav("/login");
  };

  return (
    <div className="app-shell relative" data-testid="role-select-screen">
      <div className="px-6 pt-16 pb-8">
        <div className="flex flex-col items-center text-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center">
            <img src="/logo.png" alt="AquaServe Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Welcome to</div>
            <div className="font-display text-2xl font-bold text-charcoal">AquaServe</div>
          </div>
        </div>

        {/* <h3 className="font-display text-2xl font-semibold text-charcoal leading-tight">
          How would you like to continue?
        </h3> */}
        <p className="text-slate mt-2 mb-8">Choose your role.<br /> You can  change this later by logging out.</p>

        <div className="flex flex-col gap-8">
          <button
            onClick={() => pick("service_needer")}
            className="card p-6 flex items-center gap-5 text-left transition-all hover:border-primary/40 hover:shadow-floating group active:scale-[0.99]"
            data-testid="role-client-card"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
              <Home size={24} strokeWidth={2} className="text-primary group-hover:text-white" />
            </div>
            <div className="flex-1">
              <div className="font-display font-semibold text-charcoal text-lg">I need a service</div>
              <div className="text-slate text-sm mt-0.5">Book installation, repair, filter change & AMC</div>
            </div>
            <ArrowRight size={20} className="text-slate group-hover:text-primary" />
          </button>

          <button
            onClick={() => pick("provider")}
            className="card p-6 flex items-center gap-5 text-left transition-all hover:border-accent/40 hover:shadow-floating group active:scale-[0.99]"
            data-testid="role-provider-card"
          >
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-white transition-colors">
              <Wrench size={24} strokeWidth={2} className="text-accent-dark group-hover:text-white" />
            </div>
            <div className="flex-1">
              <div className="font-display font-semibold text-charcoal text-lg">I provide service</div>
              <div className="text-slate text-sm mt-0.5">Get jobs, earn income and grow your business</div>
            </div>
            <ArrowRight size={20} className="text-slate group-hover:text-accent-dark" />
          </button>
        </div>

        <div className="mt-40 text-xs text-slate text-center">
          By continuing you agree to our Terms & Privacy Policy.
        </div>
      </div>
    </div >
  );
}
