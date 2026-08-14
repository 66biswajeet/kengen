import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { UserRound, Mail, MapPin, Upload, CheckCircle2, ArrowRight } from "lucide-react";
import api, { apiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = ["Installation", "Filter Change", "Repair", "AMC", "General Service"];

export default function Register() {
  const nav = useNavigate();
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [locality, setLocality] = useState("");
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleCat = (c) => setCats((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const save = async () => {
    if (!name.trim()) return toast.error("Please enter your name");
    setLoading(true);
    try {
      await api.patch("/users/me", { name, email: email || undefined });
      const updatedUser = await refresh();
      toast.success("Profile saved");
      if (updatedUser?.has_location || user?.has_location) {
        if (isProvider) nav("/provider/jobs");
        else nav("/home");
      } else {
        nav("/location");
      }
    } catch (e) { toast.error(apiError(e)); }
    finally { setLoading(false); }
  };

  const isProvider = user?.role === "provider";

  return (
    <div
      className="app-shell relative min-h-screen flex flex-col justify-between"
      style={{ background: "#F8FAFC" }}
      data-testid="register-screen"
    >
      <div className="px-6 pt-12 pb-8 flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        {/* User Icon Badge */}
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4 shrink-0">
          <UserRound size={18} className="text-primary" />
        </div>

        {/* Title & Description */}
        <h1 className="font-display text-lg font-bold text-charcoal tracking-tight">
          {isProvider ? "Complete your provider profile" : "Tell us about yourself"}
        </h1>
        <p className="text-slate/80 text-xs mt-1 mb-6 leading-relaxed">
          This helps us personalise your experience.
        </p>

        {/* Form Controls */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate/70 tracking-wider">Full name</label>
            <input
              data-testid="reg-name-input"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder:text-slate/50 font-medium focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 shadow-sm transition-all mt-1"
              placeholder="e.g. Ananya Verma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate/70 tracking-wider">Email (optional)</label>
            <div className="relative mt-1">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate/50" />
              <input
                data-testid="reg-email-input"
                type="email"
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-charcoal placeholder:text-slate/50 font-medium focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 shadow-sm transition-all"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {isProvider && (
            <>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate/70 tracking-wider">Service area / locality</label>
                <div className="relative mt-1">
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate/50" />
                  <input
                    data-testid="reg-locality-input"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-charcoal placeholder:text-slate/50 font-medium focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 shadow-sm transition-all"
                    placeholder="e.g. Koramangala, Bangalore"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate/70 tracking-wider">Service categories</label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCat(c)}
                      data-testid={`cat-${c.toLowerCase().replace(/\s/g, "-")}`}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                        cats.includes(c)
                          ? "bg-primary border-primary text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {cats.includes(c) && <CheckCircle2 size={13} />}
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-3.5 flex items-center gap-3 border border-dashed border-slate-200 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                  <Upload size={15} className="text-slate/70" />
                </div>
                <div className="text-xs flex-1 min-w-0">
                  <div className="font-semibold text-charcoal text-xs">Upload ID proof (optional)</div>
                  <div className="text-slate/70 text-[10px] truncate">Aadhaar / PAN / DL</div>
                </div>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">Skip</span>
              </div>
            </>
          )}
        </div>

        {/* Submit Button */}
        <div className="mt-6">
          <button
            onClick={save}
            disabled={loading}
            className="w-full bg-primary text-white font-semibold text-xs rounded-xl py-3 px-4 flex items-center justify-center gap-2 shadow-sm hover:bg-primary/95 disabled:opacity-50 active:scale-[0.98] transition-all"
            data-testid="reg-continue-btn"
          >
            {loading ? "Saving..." : (<>Continue <ArrowRight size={15} /></>)}
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
