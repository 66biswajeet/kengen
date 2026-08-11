import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { UserRound, Mail, MapPin, Upload, CheckCircle2 } from "lucide-react";
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
    <div className="app-shell" data-testid="register-screen">
      <div className="px-6 pt-14 pb-24">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
          <UserRound size={22} className="text-accent-dark" />
        </div>
        <h1 className="font-display text-3xl font-semibold text-charcoal">
          {isProvider ? "Complete your provider profile" : "Tell us about yourself"}
        </h1>
        <p className="text-slate mt-2 mb-8">This helps us personalise your experience.</p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-slate uppercase tracking-wider">Full name</label>
            <input
              data-testid="reg-name-input"
              className="input-field mt-1.5"
              placeholder="e.g. Ananya Verma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate uppercase tracking-wider">Email (optional)</label>
            <div className="relative mt-1.5">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
              <input
                data-testid="reg-email-input"
                type="email"
                className="input-field pl-10"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {isProvider && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate uppercase tracking-wider">Service area / locality</label>
                <div className="relative mt-1.5">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
                  <input
                    data-testid="reg-locality-input"
                    className="input-field pl-10"
                    placeholder="e.g. Koramangala, Bangalore"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate uppercase tracking-wider">Service categories you handle</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => toggleCat(c)}
                      data-testid={`cat-${c.toLowerCase().replace(/\s/g, "-")}`}
                      className={`chip ${cats.includes(c) ? "!bg-primary !text-white" : ""}`}
                    >
                      {cats.includes(c) && <CheckCircle2 size={14} />}
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="card p-4 flex items-center gap-3 border-dashed border-2 border-gray-200 !shadow-none bg-mist">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border">
                  <Upload size={18} className="text-slate" />
                </div>
                <div className="text-sm flex-1">
                  <div className="font-semibold text-charcoal">Upload ID proof (optional)</div>
                  <div className="text-slate text-xs">Aadhaar / PAN / DL — for admin verification</div>
                </div>
                <span className="chip-amber">Skip for now</span>
              </div>
            </>
          )}
        </div>

        <div className="mt-8">
          <button onClick={save} disabled={loading} className="btn-primary" data-testid="reg-continue-btn">
            {loading ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
