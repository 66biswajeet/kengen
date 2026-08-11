import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Calendar, ShoppingBag, User, Briefcase, Clock, IndianRupee } from "lucide-react";

const ClientNav = [
  { to: "/home", icon: Home, label: "Home", testid: "nav-home" },
  { to: "/bookings", icon: Calendar, label: "Bookings", testid: "nav-bookings" },
  { to: "/cart", icon: ShoppingBag, label: "Cart", testid: "nav-cart" },
  { to: "/account", icon: User, label: "Account", testid: "nav-account" },
];

const ProviderNav = [
  { to: "/provider/jobs", icon: Briefcase, label: "Jobs", testid: "nav-jobs" },
  { to: "/provider/schedule", icon: Clock, label: "Schedule", testid: "nav-schedule" },
  { to: "/provider/earnings", icon: IndianRupee, label: "Earnings", testid: "nav-earnings" },
  { to: "/provider/account", icon: User, label: "Account", testid: "nav-account" },
];

export default function BottomNav({ role = "service_needer" }) {
  const items = role === "provider" ? ProviderNav : ClientNav;
  const loc = useLocation();
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-white/95 backdrop-blur-xl border-t border-gray-100 flex justify-around items-stretch px-2 py-2 z-50 rounded-t-[24px] shadow-[0_-8px_30px_rgba(0,0,0,0.06)] safe-bottom"
      data-testid="bottom-nav"
    >
      {items.map((it) => {
        const active = loc.pathname === it.to || (it.to !== "/home" && it.to !== "/provider/jobs" && loc.pathname.startsWith(it.to));
        const Icon = it.icon;
        return (
          <NavLink
            key={it.to}
            to={it.to}
            data-testid={it.testid}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-colors ${active ? "text-primary" : "text-slate"}`}
          >
            <Icon size={22} strokeWidth={2} className={active ? "fill-primary/10" : ""} />
            <span className={`text-[11px] font-semibold ${active ? "text-primary" : "text-slate"}`}>{it.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
