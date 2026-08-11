import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Droplet, Wrench } from "lucide-react";

export default function Splash() {
  const nav = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => {
      const token = localStorage.getItem("aq_access_token");
      if (token) nav("/dashboard", { replace: true });
      else nav("/role", { replace: true });
    }, 1500);
    return () => clearTimeout(t);
  }, [nav]);

  return (
    <div className="app-shell !bg-primary flex flex-col items-center justify-center text-white relative overflow-hidden" data-testid="splash-screen">
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary-light/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-16 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

      <div className="relative flex flex-col items-center gap-6 animate-slide-up">
        <div className="w-28 h-28 flex items-center justify-center">
          <img src="/logo.png" alt="AquaServe Logo" className="w-full h-full object-contain" />
        </div>
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight">AquaServe</h1>
          <p className="text-white/80 mt-2 font-body">Servicing you can trust</p>
        </div>
      </div>
    </div>
  );
}
