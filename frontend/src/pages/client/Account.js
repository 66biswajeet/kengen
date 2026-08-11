import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import BottomNav from "../../components/BottomNav";
import { MapPin, CreditCard, Bell, HelpCircle, LogOut, ChevronRight, Heart, FileText, ShieldCheck, User } from "lucide-react";

const MENU = [
  { key: "addresses", label: "Saved addresses", icon: MapPin, to: "/account/addresses", testid: "menu-addresses" },
  { key: "payments", label: "Payment history", icon: CreditCard, to: "/bookings", testid: "menu-payments" },
  { key: "wishlist", label: "Wishlist", icon: Heart, to: "/home", testid: "menu-wishlist" },
  { key: "notifications", label: "Notifications", icon: Bell, to: "/notifications", testid: "menu-notifications" },
  { key: "help", label: "Help & Support", icon: HelpCircle, to: "/help", testid: "menu-help" },
  { key: "privacy", label: "Privacy", icon: ShieldCheck, to: "/help", testid: "menu-privacy" },
];

export default function Account() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const doLogout = () => { logout(); localStorage.removeItem("aq_role"); nav("/role", { replace: true }); };

  return (
    <div className="app-shell pb-28" data-testid="account-screen">
      <div className="glass-header"><h2 className="font-display text-xl font-semibold text-charcoal">Account</h2></div>

      <div className="px-5 pt-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {user?.profile_photo_url ? (
              <img src={user.profile_photo_url} className="w-full h-full object-cover" alt="" />
            ) : (
              <User size={28} className="text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-semibold text-charcoal truncate">{user?.name || "Welcome"}</div>
            <div className="text-xs text-slate">{user?.phone || user?.email}</div>
            <span className="chip mt-2 !py-0.5 !text-[10px]">{user?.role === "provider" ? "Provider" : "Client"}</span>
          </div>
        </div>

        <div className="card mt-5 divide-y divide-gray-50">
          {MENU.map((m) => (
            <button key={m.key} onClick={() => nav(m.to)} data-testid={m.testid} className="w-full p-4 flex items-center gap-3 text-left hover:bg-primary-surface/30 transition-colors first:rounded-t-card last:rounded-b-card">
              <div className="w-10 h-10 rounded-xl bg-primary-surface flex items-center justify-center">
                <m.icon size={18} className="text-primary" />
              </div>
              <span className="flex-1 font-semibold text-charcoal text-sm">{m.label}</span>
              <ChevronRight size={16} className="text-slate" />
            </button>
          ))}
        </div>

        <button onClick={doLogout} className="card w-full mt-5 p-4 flex items-center gap-3 text-left hover:bg-error/5 transition-colors" data-testid="logout-btn">
          <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center"><LogOut size={18} className="text-error" /></div>
          <span className="flex-1 font-semibold text-error text-sm">Log out</span>
        </button>

        <div className="mt-5 text-center text-xs text-slate">
          AquaServe · v1.0.0
        </div>
      </div>

      <BottomNav role={user?.role} />
    </div>
  );
}
