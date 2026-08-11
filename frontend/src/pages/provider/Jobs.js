import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { apiError } from "../../lib/api";
import { toast } from "sonner";
import { Power, Briefcase, Clock, ArrowRight, Zap, MapPin, X } from "lucide-react";
import BottomNav from "../../components/BottomNav";
import { useAuth } from "../../context/AuthContext";

export default function Jobs() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const [online, setOnline] = useState(user?.provider_profile?.is_online ?? false);
  const [assigned, setAssigned] = useState([]);
  const [available, setAvailable] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    try {
      const [a, r] = await Promise.all([
        api.get("/bookings", { params: { scope: "upcoming" } }),
        api.get("/jobs/requests"),
      ]);
      setAssigned(a.data);
      setAvailable(r.data);
    } catch (e) { /* silent poll */ }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setInterval(load, 5000); return () => clearInterval(t); }, []);

  const toggleOnline = async () => {
    try {
      const { data } = await api.patch("/providers/me/availability", { is_online: !online });
      setOnline(data.is_online);
      toast.success(data.is_online ? "You are online — jobs will come in" : "You are offline");
      refresh();
    } catch (e) { toast.error(apiError(e)); }
  };

  const accept = async (bookingId) => {
    setBusyId(bookingId);
    try {
      await api.post(`/jobs/${bookingId}/accept`);
      toast.success("Job accepted");
      await load();
      nav(`/provider/job/${bookingId}`);
    } catch (e) { toast.error(apiError(e)); await load(); }
    finally { setBusyId(null); }
  };

  const reject = async (bookingId) => {
    setBusyId(bookingId);
    try {
      await api.post(`/jobs/${bookingId}/reject`);
      setAvailable((prev) => prev.filter((x) => x.booking.id !== bookingId));
    } catch (e) { toast.error(apiError(e)); }
    finally { setBusyId(null); }
  };

  const next = assigned.find((b) => ["provider_assigned", "on_the_way", "arrived", "in_progress"].includes(b.status));

  return (
    <div className="app-shell pb-28" data-testid="provider-jobs-screen">
      <div className="glass-header flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-charcoal">Hi{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</h2>
          <div className="text-xs text-slate mt-0.5">Ready to serve?</div>
        </div>
        <button
          onClick={toggleOnline}
          data-testid="online-toggle"
          className={`px-4 py-2 rounded-full flex items-center gap-2 border transition-colors ${online ? "bg-success text-white border-success" : "bg-white text-slate border-gray-200"}`}
        >
          <Power size={14} strokeWidth={2.5} />
          <span className="text-xs font-semibold uppercase tracking-wider">{online ? "Online" : "Offline"}</span>
        </button>
      </div>

      <div className="px-5 pt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <div className="text-xs text-slate uppercase tracking-wider font-semibold">Today</div>
            <div className="font-display text-2xl font-bold text-charcoal mt-1">{assigned.length}</div>
            <div className="text-xs text-slate">jobs assigned</div>
          </div>
          <div className="card p-4">
            <div className="text-xs text-slate uppercase tracking-wider font-semibold">Available</div>
            <div className="font-display text-2xl font-bold text-accent-dark mt-1">{available.length}</div>
            <div className="text-xs text-slate">new requests</div>
          </div>
        </div>

        {/* Available (broadcast) job requests */}
        {available.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-charcoal flex items-center gap-2">
                <span className="inline-flex items-center gap-1 chip-amber !text-[10px]"><Zap size={12} /> LIVE</span>
                Available jobs
              </h3>
              <span className="text-xs text-slate">First to accept wins</span>
            </div>
            <div className="flex flex-col gap-3">
              {available.map((item) => {
                const b = item.booking;
                const primary = b.items?.[0]?.service;
                return (
                  <div key={b.id} className="card p-4 border-l-4 !border-l-accent animate-slide-up" data-testid={`available-job-${b.id}`}>
                    <div className="flex items-center gap-3">
                      <img src={primary?.image_url} alt="" className="w-14 h-14 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="chip !py-0.5 !text-[10px]">{b.booking_code}</span>
                          <span className="text-[10px] text-slate uppercase font-semibold">{b.payment_method}</span>
                        </div>
                        <div className="font-semibold text-charcoal truncate mt-1">{primary?.name}</div>
                        <div className="text-xs text-slate mt-0.5"><Clock size={11} className="inline mr-1" />{b.scheduled_date} · {b.scheduled_time_slot.split(" - ")[0]}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-display font-bold text-charcoal">₹{b.total_amount}</div>
                        <div className="text-[10px] text-slate">total</div>
                      </div>
                    </div>
                    {b.address && (
                      <div className="text-xs text-slate mt-3 flex items-start gap-1.5"><MapPin size={12} className="mt-0.5 shrink-0" /><span className="line-clamp-1">{b.address.address_line}, {b.address.city} {b.address.pincode}</span></div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => reject(b.id)}
                        disabled={busyId === b.id}
                        className="btn-secondary !py-2.5 !text-error !border-error/20 hover:!bg-error/5"
                        data-testid={`reject-job-${b.id}`}
                      >
                        <X size={14} /> Skip
                      </button>
                      <button
                        onClick={() => accept(b.id)}
                        disabled={busyId === b.id}
                        className="btn-accent !py-2.5"
                        data-testid={`accept-job-${b.id}`}
                      >
                        {busyId === b.id ? "Accepting…" : "Accept job"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Next job hero */}
        {next && (
          <button onClick={() => nav(`/provider/job/${next.id}`)} className="card w-full p-4 flex items-center gap-3 text-left border-l-4 !border-l-primary active:scale-[0.99] transition-transform" data-testid={`job-card-${next.id}`}>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Briefcase size={22} className="text-primary" /></div>
            <div className="flex-1 min-w-0">
              <div className="chip !py-0.5 !text-[10px] uppercase">Next job</div>
              <div className="font-semibold text-charcoal truncate mt-1">{next.items?.[0]?.service?.name || "Service"}</div>
              <div className="text-xs text-slate mt-0.5"><Clock size={11} className="inline mr-1" />{next.scheduled_date} · {next.scheduled_time_slot}</div>
            </div>
            <ArrowRight size={18} className="text-slate" />
          </button>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-charcoal">Your active jobs</h3>
            <span className="text-xs text-slate">{assigned.length}</span>
          </div>
          <div className="flex flex-col gap-3">
            {assigned.length === 0 && available.length === 0 && (
              <div className="card p-6 text-center text-slate text-sm">No active jobs right now.<br />Toggle online to receive requests.</div>
            )}
            {assigned.map((b) => (
              <button key={b.id} onClick={() => nav(`/provider/job/${b.id}`)} className="card w-full p-4 flex gap-3 text-left active:scale-[0.99]" data-testid={`job-card-${b.id}`}>
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center"><Briefcase size={20} className="text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between"><span className="chip !py-0.5 !text-[10px]">{b.booking_code}</span><span className="text-xs text-slate">{b.status.replace(/_/g, " ")}</span></div>
                  <div className="font-semibold text-charcoal truncate mt-1">{b.items?.[0]?.service?.name}</div>
                  <div className="text-xs text-slate mt-0.5">{b.scheduled_date} · {b.scheduled_time_slot}</div>
                </div>
                <div className="font-display font-bold text-charcoal">₹{b.total_amount}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <BottomNav role="provider" />
    </div>
  );
}
