import React, { useEffect, useState } from "react";
import api, { apiError } from "../../lib/api";
import { toast } from "sonner";
import AdminShell from "./AdminShell";
import { ShoppingBag, Users, IndianRupee, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Stat = ({ icon: Icon, label, value, sub, tone = "primary", testid }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card" data-testid={testid}>
    <div className="flex items-center justify-between">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tone === "primary" ? "bg-primary/10 text-primary" : tone === "accent" ? "bg-accent/10 text-accent-dark" : tone === "success" ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
        <Icon size={20} />
      </div>
    </div>
    <div className="text-xs text-slate uppercase font-semibold tracking-wider mt-4">{label}</div>
    <div className="font-display text-3xl font-bold text-charcoal mt-1">{value}</div>
    {sub && <div className="text-xs text-slate mt-1">{sub}</div>}
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [earnings, setEarnings] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, b, e] = await Promise.all([
          api.get("/admin/dashboard/stats"),
          api.get("/admin/bookings"),
          api.get("/admin/earnings/summary"),
        ]);
        setStats(s.data);
        setRecent(b.data.slice(0, 8));
        setEarnings(e.data);
      } catch (err) { toast.error(apiError(err)); }
    })();
  }, []);

  return (
    <AdminShell title="Dashboard" subtitle="Real-time snapshot of your operations">
      {!stats ? (
        <div className="text-slate">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat icon={ShoppingBag} label="Bookings today" value={stats.bookings_today} tone="primary" testid="stat-bookings-today" />
            <Stat icon={Users} label="Active providers" value={stats.active_providers} sub={`${stats.pending_approvals} pending approvals`} tone="accent" testid="stat-active-providers" />
            <Stat icon={IndianRupee} label="Revenue today" value={`₹${stats.revenue_today || 0}`} tone="success" testid="stat-revenue-today" />
            <Stat icon={TrendingUp} label="Revenue this month" value={`₹${stats.revenue_month || 0}`} tone="primary" testid="stat-revenue-month" />
          </div>

          {earnings && (
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
                <div className="text-xs text-slate uppercase font-semibold tracking-wider">Total revenue</div>
                <div className="font-display text-2xl font-bold text-charcoal mt-1">₹{earnings.total_revenue}</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
                <div className="text-xs text-slate uppercase font-semibold tracking-wider">Platform commission</div>
                <div className="font-display text-2xl font-bold text-charcoal mt-1">₹{earnings.total_commission}</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
                <div className="text-xs text-slate uppercase font-semibold tracking-wider">Payouts pending</div>
                <div className="font-display text-2xl font-bold text-accent-dark mt-1">₹{earnings.payouts_pending}</div>
              </div>
            </div>
          )}

          <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="font-display font-semibold text-charcoal">Recent bookings</div>
              <Link to="/admin/bookings" className="text-xs text-primary font-semibold flex items-center gap-1" data-testid="dashboard-view-all-bookings">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recent.length === 0 && <div className="px-5 py-10 text-slate text-sm text-center">No bookings yet.</div>}
              {recent.map((b) => (
                <div key={b.id} className="px-5 py-3 flex items-center gap-3 hover:bg-primary-surface/30 transition-colors" data-testid={`dashboard-booking-${b.id}`}>
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><Clock size={16} className="text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-charcoal">{b.booking_code}</span>
                      <span className="text-[10px] uppercase font-semibold text-slate">{b.status.replace(/_/g, " ")}</span>
                    </div>
                    <div className="text-sm text-charcoal truncate">{(b.items || []).map((i) => i.service?.name).join(", ")}</div>
                    <div className="text-[11px] text-slate">{b.service_needer?.name || "—"} · {b.scheduled_date}</div>
                  </div>
                  <div className="font-semibold text-charcoal">₹{b.total_amount}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
