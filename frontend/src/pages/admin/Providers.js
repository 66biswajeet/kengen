import React, { useEffect, useState } from "react";
import api, { apiError } from "../../lib/api";
import { toast } from "sonner";
import AdminShell from "./AdminShell";
import { Star, MapPin, Check, X, PauseCircle, User } from "lucide-react";

const STATUS_TABS = [
  { k: "all", label: "All" },
  { k: "pending", label: "Pending" },
  { k: "approved", label: "Approved" },
  { k: "rejected", label: "Rejected" },
  { k: "suspended", label: "Suspended" },
];

const statusStyle = (s) => ({
  approved: "bg-success/10 text-success",
  pending: "bg-accent/10 text-accent-dark",
  rejected: "bg-error/10 text-error",
  suspended: "bg-slate/10 text-slate",
}[s] || "bg-slate/10 text-slate");

export default function Providers() {
  const [tab, setTab] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = tab === "all" ? {} : { status: tab };
      const { data } = await api.get("/admin/providers", { params });
      setItems(data);
    } catch (e) { toast.error(apiError(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  const act = async (id, kind) => {
    setBusyId(id);
    try {
      await api.patch(`/admin/providers/${id}/${kind}`);
      toast.success(`Provider ${kind}d`);
      await load();
    } catch (e) { toast.error(apiError(e)); }
    finally { setBusyId(null); }
  };

  return (
    <AdminShell title="Providers" subtitle="Approve, reject or suspend service providers">
      <div className="mb-4 flex flex-wrap gap-2" data-testid="providers-filter-tabs">
        {STATUS_TABS.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            data-testid={`providers-tab-${t.k}`}
            className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${tab === t.k ? "bg-primary text-white border-primary" : "bg-white text-slate border-gray-200 hover:border-primary/40"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-slate">Loading…</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-slate text-sm text-center">No providers in this list.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card" data-testid={`provider-card-${p.id}`}>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                  {p.user?.profile_photo_url ? <img src={p.user.profile_photo_url} className="w-full h-full object-cover" alt="" /> : <User size={22} className="text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-charcoal truncate">{p.user?.name || "Unnamed"}</span>
                    <span className={`chip !py-0.5 !text-[10px] ${statusStyle(p.status)} !bg-opacity-100`}>{p.status}</span>
                  </div>
                  <div className="text-xs text-slate mt-0.5 truncate">{p.user?.phone || p.user?.email || "—"}</div>
                  <div className="text-xs text-slate mt-1 flex items-center gap-1"><MapPin size={11} /> {p.service_area_locality || "—"} · {p.service_radius_km || 10}km</div>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <div className="flex items-center gap-1 text-accent-dark font-semibold"><Star size={11} className="fill-accent text-accent" /> {p.average_rating || 0}</div>
                    <span className="text-slate">·</span>
                    <span className="text-slate">{p.total_jobs_completed || 0} jobs</span>
                    <span className="text-slate">·</span>
                    <span className="text-slate">{p.commission_percentage}% commission</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-50">
                {p.status !== "approved" && (
                  <button disabled={busyId === p.id} onClick={() => act(p.id, "approve")} className="chip !bg-success/10 !text-success hover:!bg-success hover:!text-white transition-colors" data-testid={`approve-${p.id}`}>
                    <Check size={12} /> Approve
                  </button>
                )}
                {p.status !== "rejected" && (
                  <button disabled={busyId === p.id} onClick={() => act(p.id, "reject")} className="chip !bg-error/10 !text-error hover:!bg-error hover:!text-white transition-colors" data-testid={`reject-${p.id}`}>
                    <X size={12} /> Reject
                  </button>
                )}
                {p.status !== "suspended" && (
                  <button disabled={busyId === p.id} onClick={() => act(p.id, "suspend")} className="chip !bg-slate/10 !text-slate hover:!bg-slate hover:!text-white transition-colors" data-testid={`suspend-${p.id}`}>
                    <PauseCircle size={12} /> Suspend
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
