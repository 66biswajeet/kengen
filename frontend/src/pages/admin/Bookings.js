import React, { useEffect, useState } from "react";
import api, { apiError } from "../../lib/api";
import { toast } from "sonner";
import AdminShell from "./AdminShell";
import { Search, User, Calendar, MapPin, Wallet, Smartphone, X, Star, Clock } from "lucide-react";

const STATUSES = [
  "all", "pending", "provider_assigned", "on_the_way", "arrived", "in_progress", "completed", "cancelled",
];

const statusStyle = (s) => ({
  pending: "bg-primary/10 text-primary",
  provider_assigned: "bg-primary/10 text-primary",
  on_the_way: "bg-accent/10 text-accent-dark",
  arrived: "bg-accent/10 text-accent-dark",
  in_progress: "bg-accent/10 text-accent-dark",
  completed: "bg-success/10 text-success",
  cancelled: "bg-error/10 text-error",
}[s] || "bg-slate/10 text-slate");

export default function Bookings() {
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = status === "all" ? {} : { status };
      const { data } = await api.get("/admin/bookings", { params });
      setItems(data);
    } catch (e) { toast.error(apiError(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const filtered = q.trim()
    ? items.filter((b) => (b.booking_code || "").toLowerCase().includes(q.toLowerCase()) || (b.service_needer?.name || "").toLowerCase().includes(q.toLowerCase()) || (b.provider?.name || "").toLowerCase().includes(q.toLowerCase()))
    : items;

  return (
    <AdminShell title="Bookings" subtitle="Monitor and inspect every booking">
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            data-testid={`bookings-tab-${s}`}
            className={`px-3 py-2 rounded-full text-xs font-semibold border transition-colors ${status === s ? "bg-primary text-white border-primary" : "bg-white text-slate border-gray-200 hover:border-primary/40"}`}
          >
            {s === "all" ? "All" : s.replace(/_/g, " ")}
          </button>
        ))}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
          <input
            className="w-full pl-8 pr-3 py-2 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:border-primary"
            placeholder="Search code, customer, provider…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            data-testid="bookings-search"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-slate">Loading…</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="hidden md:grid grid-cols-[130px,1fr,1fr,120px,120px,120px] px-5 py-3 text-[11px] uppercase tracking-wider text-slate font-semibold border-b border-gray-50 bg-mist">
            <div>Code</div><div>Service · Customer</div><div>Provider</div><div>Date</div><div>Status</div><div className="text-right">Total</div>
          </div>
          <div className="divide-y divide-gray-50">
            {filtered.length === 0 && <div className="px-5 py-10 text-slate text-sm text-center">No bookings.</div>}
            {filtered.map((b) => (
              <button
                key={b.id}
                onClick={() => setDetail(b)}
                data-testid={`admin-booking-${b.id}`}
                className="w-full text-left px-5 py-3 md:grid md:grid-cols-[130px,1fr,1fr,120px,120px,120px] block md:items-center hover:bg-primary-surface/30 transition-colors"
              >
                <div className="text-xs font-semibold text-charcoal">{b.booking_code}</div>
                <div className="min-w-0">
                  <div className="text-sm text-charcoal truncate">{(b.items || []).map((i) => i.service?.name).join(", ")}</div>
                  <div className="text-[11px] text-slate truncate">{b.service_needer?.name || "—"} · {b.service_needer?.phone || ""}</div>
                </div>
                <div className="min-w-0 text-sm text-charcoal truncate">{b.provider?.name || <span className="text-slate">— unassigned —</span>}</div>
                <div className="text-xs text-slate">{b.scheduled_date}</div>
                <div><span className={`chip !py-0.5 !text-[10px] ${statusStyle(b.status)}`}>{b.status.replace(/_/g, " ")}</span></div>
                <div className="text-right font-semibold text-charcoal">₹{b.total_amount}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Detail slide-over */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-sm animate-fade-in" onClick={() => setDetail(null)} data-testid="admin-booking-drawer">
          <div className="absolute right-0 top-0 h-full w-full md:w-[520px] bg-white shadow-floating overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <div className="text-[10px] uppercase text-slate font-semibold tracking-wider">Booking</div>
                <div className="font-display text-lg font-bold text-charcoal">{detail.booking_code}</div>
              </div>
              <button onClick={() => setDetail(null)} className="w-10 h-10 rounded-full bg-primary-surface hover:bg-primary/10 flex items-center justify-center" data-testid="close-booking-drawer">
                <X size={18} className="text-primary" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="flex items-center gap-2">
                <span className={`chip !py-0.5 !text-[10px] ${statusStyle(detail.status)}`}>{detail.status.replace(/_/g, " ")}</span>
                <span className="text-slate">{detail.payment_method?.toUpperCase()} · {detail.payment_status}</span>
              </div>

              <div className="flex items-start gap-3">
                <User size={16} className="text-primary mt-0.5" />
                <div>
                  <div className="font-semibold text-charcoal">{detail.service_needer?.name || "—"}</div>
                  <div className="text-slate text-xs">{detail.service_needer?.phone}</div>
                </div>
              </div>

              {detail.provider && (
                <div className="flex items-start gap-3">
                  <div className="w-4 mt-0.5"><Star size={16} className="text-accent-dark" /></div>
                  <div>
                    <div className="font-semibold text-charcoal">Provider: {detail.provider.name}</div>
                    <div className="text-slate text-xs">{detail.provider.phone} · {detail.provider.average_rating || 0}★</div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar size={16} className="text-primary mt-0.5" />
                <div className="text-charcoal">{detail.scheduled_date} · <span className="text-slate">{detail.scheduled_time_slot}</span></div>
              </div>

              {detail.address && (
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-primary mt-0.5" />
                  <div>
                    <div className="text-charcoal">{detail.address.label}</div>
                    <div className="text-slate text-xs">{detail.address.address_line}, {detail.address.city} {detail.address.pincode}</div>
                  </div>
                </div>
              )}

              <div className="bg-mist rounded-xl p-4">
                <div className="text-xs font-semibold text-slate uppercase mb-2">Services</div>
                {(detail.items || []).map((i) => (
                  <div key={i.id} className="flex justify-between text-sm py-1">
                    <span className="text-charcoal">{i.service?.name} × {i.quantity}</span>
                    <span className="font-semibold">₹{i.price}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 mt-2 pt-2 space-y-1 text-xs text-slate">
                  <div className="flex justify-between"><span>Subtotal</span><span>₹{detail.subtotal}</span></div>
                  <div className="flex justify-between"><span>Visit charge</span><span>₹{detail.visit_charge}</span></div>
                  <div className="flex justify-between"><span>Tax</span><span>₹{detail.tax}</span></div>
                  <div className="flex justify-between font-bold text-charcoal text-sm pt-1"><span>Total</span><span>₹{detail.total_amount}</span></div>
                </div>
              </div>

              {detail.notes && (
                <div>
                  <div className="text-xs font-semibold text-slate uppercase mb-1">Notes</div>
                  <div className="text-charcoal italic">"{detail.notes}"</div>
                </div>
              )}

              {detail.status_history?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate uppercase mb-2">Status history</div>
                  <div className="space-y-1.5 text-xs">
                    {detail.status_history.map((h) => (
                      <div key={h.id} className="flex items-center gap-2">
                        <Clock size={11} className="text-primary" />
                        <span className="text-charcoal">{h.status.replace(/_/g, " ")}</span>
                        <span className="text-slate">— {new Date(h.created_at).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
