import React, { useEffect, useState } from "react";
import api, { apiError } from "../../lib/api";
import { toast } from "sonner";
import AppHeader from "../../components/AppHeader";
import { MapPin, Plus, Trash2, Check } from "lucide-react";

export default function Addresses() {
  const [items, setItems] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ label: "Home", address_line: "", city: "", state: "", pincode: "", is_default: false });

  const load = async () => {
    try { const { data } = await api.get("/addresses"); setItems(data); }
    catch (e) { toast.error(apiError(e)); }
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.address_line || !form.pincode) return toast.error("Address and pincode required");
    try { await api.post("/addresses", form); setShowAdd(false); setForm({ label: "Home", address_line: "", city: "", state: "", pincode: "", is_default: false }); load(); }
    catch (e) { toast.error(apiError(e)); }
  };

  const del = async (id) => { try { await api.delete(`/addresses/${id}`); load(); } catch (e) { toast.error(apiError(e)); } };
  const setDefault = async (a) => { try { await api.patch(`/addresses/${a.id}`, { ...a, is_default: true }); load(); } catch (e) { toast.error(apiError(e)); } };

  return (
    <div className="app-shell pb-8" data-testid="addresses-screen">
      <AppHeader title="Saved addresses" />
      <div className="px-5 pt-4 space-y-3">
        {items.map((a) => (
          <div key={a.id} className="card p-4 flex gap-3" data-testid={`addr-item-${a.id}`}>
            <div className="w-10 h-10 rounded-xl bg-primary-surface flex items-center justify-center shrink-0"><MapPin size={18} className="text-primary" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2"><span className="font-semibold text-charcoal text-sm">{a.label}</span>{a.is_default && <span className="chip !py-0.5 !text-[10px]">Default</span>}</div>
              <div className="text-xs text-slate mt-0.5">{a.address_line}, {a.city} {a.pincode}</div>
              <div className="flex items-center gap-3 mt-2">
                {!a.is_default && <button onClick={() => setDefault(a)} className="text-xs text-primary font-semibold" data-testid={`addr-default-${a.id}`}><Check size={12} className="inline" /> Make default</button>}
                <button onClick={() => del(a.id)} className="text-xs text-error font-semibold" data-testid={`addr-delete-${a.id}`}><Trash2 size={12} className="inline" /> Delete</button>
              </div>
            </div>
          </div>
        ))}

        {!showAdd ? (
          <button onClick={() => setShowAdd(true)} className="btn-secondary" data-testid="add-address-btn"><Plus size={16} /> Add new address</button>
        ) : (
          <div className="card p-4 flex flex-col gap-3">
            <div className="flex gap-2">
              {["Home", "Office", "Other"].map((l) => (
                <button key={l} onClick={() => setForm({ ...form, label: l })} className={`chip ${form.label === l ? "!bg-primary !text-white" : ""}`} data-testid={`addr-label-${l.toLowerCase()}`}>{l}</button>
              ))}
            </div>
            <input className="input-field" placeholder="Flat / Building / Street" value={form.address_line} onChange={(e) => setForm({ ...form, address_line: e.target.value })} data-testid="addr-line-input" />
            <div className="grid grid-cols-2 gap-2">
              <input className="input-field" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} data-testid="addr-city-input" />
              <input className="input-field" placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} data-testid="addr-pincode-input" />
            </div>
            <label className="flex items-center gap-2 text-sm text-charcoal">
              <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} /> Make default
            </label>
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn-primary" onClick={add} data-testid="save-address-btn">Save</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
