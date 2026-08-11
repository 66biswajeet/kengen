import React, { useEffect, useState } from "react";
import api, { apiError } from "../../lib/api";
import { toast } from "sonner";
import BottomNav from "../../components/BottomNav";
import { useNavigate } from "react-router-dom";

export default function Schedule() {
  const nav = useNavigate();
  const [tab, setTab] = useState("today");
  const [items, setItems] = useState([]);

  const load = async () => {
    try {
      const scope = tab === "completed" ? "past" : "upcoming";
      const { data } = await api.get("/bookings", { params: { scope } });
      if (tab === "today") {
        const today = new Date().toISOString().slice(0, 10);
        setItems(data.filter((b) => b.scheduled_date === today));
      } else if (tab === "upcoming") {
        const today = new Date().toISOString().slice(0, 10);
        setItems(data.filter((b) => b.scheduled_date > today));
      } else {
        setItems(data);
      }
    } catch (e) { toast.error(apiError(e)); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  return (
    <div className="app-shell pb-28" data-testid="provider-schedule-screen">
      <div className="glass-header">
        <h2 className="font-display text-xl font-semibold text-charcoal">Schedule</h2>
        <div className="mt-3 bg-white rounded-xl border border-gray-100 flex p-1">
          {[
            { k: "today", label: "Today" },
            { k: "upcoming", label: "Upcoming" },
            { k: "completed", label: "Completed" },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              data-testid={`schedule-tab-${t.k}`}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold ${tab === t.k ? "bg-primary text-white" : "text-slate"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-4 space-y-3">
        {items.length === 0 && <div className="text-slate text-center py-10">No jobs here.</div>}
        {items.map((b) => (
          <button key={b.id} onClick={() => nav(`/provider/job/${b.id}`)} className="card w-full p-4 text-left active:scale-[0.99] transition-transform" data-testid={`schedule-job-${b.id}`}>
            <div className="flex items-center justify-between"><span className="chip !py-0.5 !text-[10px]">{b.booking_code}</span><span className="text-xs text-slate uppercase font-semibold">{b.status}</span></div>
            <div className="font-semibold text-charcoal mt-2 truncate">{b.items?.[0]?.service?.name}</div>
            <div className="text-xs text-slate mt-0.5">{b.scheduled_date} · {b.scheduled_time_slot}</div>
            <div className="text-xs text-slate mt-1">Client: {b.service_needer?.name || "—"}</div>
          </button>
        ))}
      </div>
      <BottomNav role="provider" />
    </div>
  );
}
