import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import BottomNav from "../../components/BottomNav";
import { FileBadge, Star, MapPin, HelpCircle, LogOut, ChevronRight, User } from "lucide-react";

export default function ProviderAccount() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const doLogout = () => { logout(); localStorage.removeItem("aq_role"); nav("/role", { replace: true }); };
  const p = user?.provider_profile;

  return (
    <div className="app-shell pb-28" data-testid="provider-account-screen">
      <div className="glass-header"><h2 className="font-display text-xl font-semibold text-charcoal">Account</h2></div>
      <div className="px-5 pt-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {user?.profile_photo_url ? <img src={user.profile_photo_url} className="w-full h-full object-cover" alt="" /> : <User size={28} className="text-primary" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-semibold text-charcoal truncate">{user?.name}</div>
            <div className="text-xs text-slate">{user?.phone}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="chip !py-0.5 !text-[10px]">Provider</span>
              <span className="chip-amber !py-0.5 !text-[10px]"><Star size={10} /> {p?.average_rating || 0}</span>
            </div>
          </div>
        </div>

        <div className="card mt-5 divide-y divide-gray-50">
          <div className="w-full p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-surface flex items-center justify-center"><FileBadge size={18} className="text-primary" /></div>
            <span className="flex-1 font-semibold text-charcoal text-sm">KYC status</span>
            <span className={`chip !py-0.5 !text-[10px] ${p?.status === "approved" ? "!bg-success/10 !text-success" : "!bg-accent/10 !text-accent-dark"}`}>{p?.status || "pending"}</span>
          </div>
          <div className="w-full p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-surface flex items-center justify-center"><MapPin size={18} className="text-primary" /></div>
            <div className="flex-1"><span className="block font-semibold text-charcoal text-sm">Service area</span><span className="text-xs text-slate">{p?.service_area_locality || "—"} · {p?.service_radius_km}km radius</span></div>
          </div>
          <button onClick={() => nav("/help")} className="w-full p-4 flex items-center gap-3 hover:bg-primary-surface/30" data-testid="provider-help">
            <div className="w-10 h-10 rounded-xl bg-primary-surface flex items-center justify-center"><HelpCircle size={18} className="text-primary" /></div>
            <span className="flex-1 text-left font-semibold text-charcoal text-sm">Help & Support</span>
            <ChevronRight size={16} className="text-slate" />
          </button>
        </div>

        <button onClick={doLogout} className="card w-full mt-5 p-4 flex items-center gap-3 hover:bg-error/5" data-testid="provider-logout">
          <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center"><LogOut size={18} className="text-error" /></div>
          <span className="flex-1 text-left font-semibold text-error text-sm">Log out</span>
        </button>
      </div>
      <BottomNav role="provider" />
    </div>
  );
}
