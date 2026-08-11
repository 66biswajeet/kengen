import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell } from "lucide-react";

export default function AppHeader({ title, showBack = true, showBell = true, right, testid = "app-header" }) {
  const nav = useNavigate();
  return (
    <div className="glass-header flex items-center justify-between" data-testid={testid}>
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => nav(-1)}
            className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-charcoal hover:bg-primary-surface transition-colors"
            data-testid="header-back-btn"
            aria-label="Back"
          >
            <ArrowLeft size={20} strokeWidth={2} />
          </button>
        )}
        {title && <h2 className="font-display text-lg font-semibold text-charcoal">{title}</h2>}
      </div>
      <div className="flex items-center gap-2">
        {right}
        {showBell && (
          <button
            onClick={() => nav("/notifications")}
            className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center relative hover:bg-primary-surface transition-colors"
            data-testid="header-bell-btn"
            aria-label="Notifications"
          >
            <Bell size={18} strokeWidth={2} className="text-charcoal" />
          </button>
        )}
      </div>
    </div>
  );
}
