import React, { useEffect, useState } from "react";
import api, { apiError } from "../../lib/api";
import { toast } from "sonner";
import AdminShell from "./AdminShell";
import { Save, Zap, Info } from "lucide-react";

const FIELDS = [
  {
    key: "assignment_radius_km",
    label: "Job assignment radius (km)",
    hint: "Distance from the customer within which providers see a new job. Set to 0 to broadcast to ALL approved providers (recommended for MVP).",
    type: "number",
    highlight: true,
  },
  { key: "job_request_expiry_minutes", label: "Job request expiry (minutes)", hint: "How long a broadcast job stays visible to providers.", type: "number" },
  { key: "default_commission_percentage", label: "Default commission (%)", hint: "Platform's share on completed bookings.", type: "number" },
  { key: "visit_charge", label: "Visit charge (₹)", hint: "Added to every booking with items.", type: "number" },
  { key: "tax_percentage", label: "Tax (%)", hint: "GST/tax applied on subtotal.", type: "number" },
  { key: "support_phone", label: "Support phone", hint: "Displayed on customer/provider Help screen.", type: "text" },
  { key: "support_whatsapp", label: "Support WhatsApp link", hint: "wa.me link customers can tap.", type: "text" },
  { key: "support_email", label: "Support email", hint: "Displayed on customer/provider Help screen.", type: "email" },
  { key: "company_address", label: "Company address", hint: "Displayed in receipts and about page.", type: "text" },
];

export default function Settings() {
  const [data, setData] = useState({});
  const [saving, setSaving] = useState(null);

  const load = async () => {
    try { const { data } = await api.get("/admin/settings"); setData(data || {}); }
    catch (e) { toast.error(apiError(e)); }
  };
  useEffect(() => { load(); }, []);

  const save = async (key) => {
    setSaving(key);
    try {
      await api.patch("/admin/settings", { key, value: String(data[key] ?? "") });
      toast.success("Setting saved");
    } catch (e) { toast.error(apiError(e)); }
    finally { setSaving(null); }
  };

  return (
    <AdminShell title="Settings" subtitle="Global configuration for the AquaServe platform">
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6 flex gap-3">
        <Zap size={18} className="text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-charcoal">
          <b>Broadcast dispatch is ON.</b> When any customer books a service, the request is instantly shown to <b>all approved providers</b> — first to accept wins. Adjust the assignment radius below to restrict this to nearby providers only.
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {FIELDS.map((f) => (
          <div key={f.key} className={`bg-white rounded-2xl border p-5 shadow-card ${f.highlight ? "border-accent/40" : "border-gray-100"}`} data-testid={`setting-${f.key}`}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate uppercase tracking-wider">{f.label}</label>
              {f.highlight && <span className="chip-amber !py-0.5 !text-[10px]">Key setting</span>}
            </div>
            <div className="flex items-start gap-1.5 text-[11px] text-slate mb-3"><Info size={11} className="mt-0.5 shrink-0" /><span>{f.hint}</span></div>
            <div className="flex gap-2">
              <input
                type={f.type}
                className="input-field"
                value={data[f.key] ?? ""}
                onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
                data-testid={`setting-input-${f.key}`}
              />
              <button
                onClick={() => save(f.key)}
                disabled={saving === f.key}
                className="btn-primary !w-auto !px-4 !py-3 shrink-0"
                data-testid={`setting-save-${f.key}`}
              >
                <Save size={14} /> {saving === f.key ? "…" : "Save"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
