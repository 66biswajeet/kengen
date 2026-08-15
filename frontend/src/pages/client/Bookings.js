import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { apiError } from "../../lib/api";
import { toast } from "sonner";
import AppHeader from "../../components/AppHeader";
import BottomNav from "../../components/BottomNav";
import { useAuth } from "../../context/AuthContext";
import { Calendar, Wrench, Star, RotateCw } from "lucide-react";

const STATUS_STYLES = {
  pending: "bg-primary/10 text-primary",
  provider_assigned: "bg-primary/10 text-primary",
  on_the_way: "bg-accent/15 text-accent-dark",
  arrived: "bg-accent/15 text-accent-dark",
  in_progress: "bg-accent/15 text-accent-dark",
  completed: "bg-success/10 text-success",
  cancelled: "bg-error/10 text-error",
};
const STATUS_LABELS = {
  pending: "Confirmed",
  provider_assigned: "Provider Assigned",
  on_the_way: "On the way",
  arrived: "Arrived",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function Bookings() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState("upcoming");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/bookings", { params: { scope: tab } });
      setItems(data);
    } catch (e) { toast.error(apiError(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  return (
    <div className="app-shell pb-28" data-testid="bookings-screen">
      <div className="glass-header">
        <h2 className="font-display text-xl font-semibold text-charcoal">My bookings</h2>
        <div className="mt-3 bg-white rounded-xl border border-gray-100 flex p-1" data-testid="bookings-tabs">
          {[
            { k: "upcoming", label: "Upcoming" },
            { k: "past", label: "Past" },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              data-testid={`tab-${t.k}`}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${tab === t.k ? "bg-primary text-white" : "text-slate"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-4">
        {loading && <div className="flex justify-center py-8"><img src="/kengen_loading1.gif" alt="Loading..." className="w-16 h-16 object-contain" /></div>}
        {!loading && items.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-full bg-primary-surface mx-auto flex items-center justify-center mb-3"><Calendar size={40} className="text-primary" /></div>
            <div className="font-display font-semibold text-charcoal">No {tab} bookings</div>
            <button onClick={() => nav("/home")} className="btn-primary w-auto px-6 mt-4">Book a service</button>
          </div>
        )}
        <div className="flex flex-col gap-3">
          {items.map((b) => (
            <button
              key={b.id}
              onClick={() => nav(`/booking/${b.id}`)}
              className="card w-full p-4 flex gap-3 text-left transition-all active:scale-[0.99] hover:border-primary/40"
              data-testid={`booking-card-${b.id}`}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Wrench size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="chip !py-0.5 !text-[10px]">{b.booking_code}</span>
                  <span className={`chip !py-0.5 !text-[10px] ${STATUS_STYLES[b.status] || "bg-slate/10 text-slate"} !bg-opacity-100`}>{STATUS_LABELS[b.status] || b.status}</span>
                </div>
                <div className="font-semibold text-charcoal mt-1 truncate">{(b.items || []).map((i) => i.service?.name).join(", ") || "Service"}</div>
                <div className="text-xs text-slate mt-1">{b.scheduled_date} · {b.scheduled_time_slot}</div>
                {tab === "past" && b.status === "completed" && !b.review && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="chip-amber"><Star size={12} /> Rate & Review</span>
                  </div>
                )}
                {tab === "past" && (
                  <div className="mt-2 flex items-center gap-2 text-primary text-xs font-semibold">
                    <RotateCw size={12} /> Book again
                  </div>
                )}
              </div>
              <div className="font-display font-bold text-charcoal">₹{b.total_amount}</div>
            </button>
          ))}
        </div>
      </div>

      <BottomNav role={user?.role} />
    </div>
  );
}
