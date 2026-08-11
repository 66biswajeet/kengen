import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, ShoppingBag, Package, Settings, LogOut, Droplet } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NAV = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard", testid: "admin-nav-dashboard" },
  { to: "/admin/bookings", icon: ShoppingBag, label: "Bookings", testid: "admin-nav-bookings" },
  { to: "/admin/providers", icon: Users, label: "Providers", testid: "admin-nav-providers" },
  { to: "/admin/services", icon: Package, label: "Catalog", testid: "admin-nav-services" },
  { to: "/admin/settings", icon: Settings, label: "Settings", testid: "admin-nav-settings" },
];

export default function AdminShell({ children, title, subtitle, headerRight }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const doLogout = () => { logout(); nav("/admin/login", { replace: true }); };

  return (
    <div className="min-h-screen bg-[#F0EEE8] flex text-charcoal" data-testid="admin-shell">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-64 shrink-0 bg-primary text-white flex-col p-5 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
            <img src="/logo.png" alt="AquaServe Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="font-display text-lg font-bold leading-tight">AquaServe</div>
            <div className="text-[10px] uppercase tracking-widest text-white/70">Admin Console</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              data-testid={n.testid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium ${
                  isActive ? "bg-white/15 text-white" : "text-white/70 hover:text-white hover:bg-white/10"
                }`
              }
            >
              <n.icon size={17} />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 border-t border-white/10 pt-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-display font-bold">{(user?.name || "A")[0]}</div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{user?.name || "Admin"}</div>
              <div className="text-[10px] text-white/60 truncate">{user?.email}</div>
            </div>
          </div>
          <button onClick={doLogout} className="text-xs text-white/80 hover:text-white flex items-center gap-2 self-start" data-testid="admin-logout-btn">
            <LogOut size={13} /> Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <div className="bg-white/70 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-30 md:px-8 px-4 py-4 flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-xl md:text-2xl font-bold text-charcoal truncate">{title}</h1>
            {subtitle && <div className="text-xs text-slate">{subtitle}</div>}
          </div>
          <div className="flex items-center gap-3">{headerRight}</div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex overflow-x-auto no-scrollbar gap-1 px-3 py-3 border-b border-gray-100 bg-white">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              data-testid={`m-${n.testid}`}
              className={({ isActive }) =>
                `shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap ${
                  isActive ? "bg-primary text-white" : "text-slate"
                }`
              }
            >
              <n.icon size={14} />
              {n.label}
            </NavLink>
          ))}
          <button onClick={doLogout} className="shrink-0 px-3 py-2 text-xs font-semibold text-error ml-auto" data-testid="m-admin-logout">
            <LogOut size={13} className="inline mr-1" /> Logout
          </button>
        </div>

        <div className="md:p-8 p-4">
          {children}
        </div>
      </main>
    </div>
  );
}
