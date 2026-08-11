import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Droplet, Mail, Lock } from "lucide-react";
import api, { apiError } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function AdminLogin() {
  const nav = useNavigate();
  const { applyTokens } = useAuth();
  const [email, setEmail] = useState("admin@aquaserve.com");
  const [password, setPassword] = useState("Admin@12345");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e?.preventDefault?.();
    setBusy(true);
    try {
      const { data } = await api.post("/auth/admin/login", { email, password });
      applyTokens(data);
      toast.success("Welcome back");
      nav("/admin/dashboard", { replace: true });
    } catch (e) { toast.error(apiError(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-[#F0EEE8] flex items-center justify-center p-4" data-testid="admin-login-screen">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-floating overflow-hidden">
        <div className="bg-primary p-8 text-white relative overflow-hidden">
          <div className="absolute -right-10 -bottom-16 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center">
              <img src="/logo.png" alt="AquaServe Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-display text-2xl font-bold">AquaServe</div>
              <div className="text-xs uppercase tracking-widest text-white/80">Admin Console</div>
            </div>
          </div>
          <div className="relative mt-6 font-display text-xl leading-snug max-w-[80%]">Manage every booking, provider and setting from one place.</div>
        </div>

        <form onSubmit={submit} className="p-8 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate uppercase tracking-wider">Email</label>
            <div className="relative mt-1.5">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
              <input
                type="email"
                className="input-field pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="admin-email-input"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate uppercase tracking-wider">Password</label>
            <div className="relative mt-1.5">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
              <input
                type="password"
                className="input-field pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="admin-password-input"
                required
              />
            </div>
          </div>
          <button type="submit" disabled={busy} className="btn-primary" data-testid="admin-login-btn">
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <div className="text-[11px] text-slate text-center">Demo credentials pre-filled. Change in production.</div>
        </form>
      </div>
    </div>
  );
}
