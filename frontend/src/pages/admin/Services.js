import React, { useEffect, useState } from "react";
import api, { apiError } from "../../lib/api";
import { toast } from "sonner";
import AdminShell from "./AdminShell";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";

const EMPTY = { category_id: "", name: "", description: "", price: 0, estimated_duration_minutes: 60, image_url: "" };

export default function Services() {
  const [cats, setCats] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCat, setSelectedCat] = useState("all");
  const [editing, setEditing] = useState(null); // service being edited (or new)
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [c, s] = await Promise.all([api.get("/categories"), api.get("/services")]);
      setCats(c.data);
      setItems(s.data);
    } catch (e) { toast.error(apiError(e)); }
  };
  useEffect(() => { load(); }, []);

  const filtered = selectedCat === "all" ? items : items.filter((s) => s.category_id === selectedCat);

  const save = async () => {
    if (!editing.name || !editing.category_id) return toast.error("Name and category are required");
    setBusy(true);
    try {
      const payload = {
        category_id: editing.category_id,
        name: editing.name,
        description: editing.description || "",
        price: Number(editing.price) || 0,
        estimated_duration_minutes: Number(editing.estimated_duration_minutes) || 60,
        image_url: editing.image_url || null,
      };
      if (editing.id) await api.patch(`/admin/services/${editing.id}`, payload);
      else await api.post("/admin/services", payload);
      toast.success("Saved");
      setEditing(null);
      load();
    } catch (e) { toast.error(apiError(e)); }
    finally { setBusy(false); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this service?")) return;
    try { await api.delete(`/admin/services/${id}`); toast.success("Service deleted"); load(); }
    catch (e) { toast.error(apiError(e)); }
  };

  const catName = (id) => cats.find((c) => c.id === id)?.name || "—";

  return (
    <AdminShell
      title="Catalog"
      subtitle="Manage the services and prices customers can book"
      headerRight={
        <button onClick={() => setEditing({ ...EMPTY, category_id: cats[0]?.id || "" })} className="btn-accent !w-auto !py-2 !px-4 !text-sm" data-testid="add-service-btn">
          <Plus size={14} /> New service
        </button>
      }
    >
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setSelectedCat("all")} data-testid="cat-filter-all" className={`px-3 py-2 rounded-full text-xs font-semibold border ${selectedCat === "all" ? "bg-primary text-white border-primary" : "bg-white text-slate border-gray-200"}`}>All</button>
        {cats.map((c) => (
          <button key={c.id} onClick={() => setSelectedCat(c.id)} data-testid={`cat-filter-${c.name.toLowerCase().replace(/\s/g, "-")}`} className={`px-3 py-2 rounded-full text-xs font-semibold border ${selectedCat === c.id ? "bg-primary text-white border-primary" : "bg-white text-slate border-gray-200"}`}>{c.name}</button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.length === 0 && <div className="col-span-2 bg-white rounded-2xl border p-10 text-slate text-center text-sm">No services in this category.</div>}
        {filtered.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-card flex gap-3" data-testid={`service-row-${s.id}`}>
            <img src={s.image_url} alt="" className="w-20 h-20 rounded-xl object-cover" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="chip !py-0.5 !text-[10px]">{catName(s.category_id)}</span>
                <span className="chip-amber !py-0.5 !text-[10px]">₹{s.price}</span>
              </div>
              <div className="font-semibold text-charcoal truncate mt-1">{s.name}</div>
              <div className="text-xs text-slate line-clamp-2 mt-1">{s.description}</div>
              <div className="mt-2 text-[11px] text-slate">{s.estimated_duration_minutes} min</div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button onClick={() => setEditing(s)} className="chip hover:!bg-primary hover:!text-white transition-colors" data-testid={`edit-service-${s.id}`}><Pencil size={11} /> Edit</button>
              <button onClick={() => del(s.id)} className="chip !bg-error/10 !text-error hover:!bg-error hover:!text-white" data-testid={`delete-service-${s.id}`}><Trash2 size={11} /> Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setEditing(null)} data-testid="service-edit-modal">
          <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-floating w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="font-display text-lg font-bold text-charcoal">{editing.id ? "Edit service" : "New service"}</div>
              <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-full bg-primary-surface hover:bg-primary/10 flex items-center justify-center"><X size={18} className="text-primary" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate uppercase tracking-wider">Category</label>
                <select value={editing.category_id} onChange={(e) => setEditing({ ...editing, category_id: e.target.value })} className="input-field mt-1.5" data-testid="svc-category-input">
                  <option value="">Select…</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate uppercase tracking-wider">Name</label>
                <input className="input-field mt-1.5" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} data-testid="svc-name-input" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate uppercase tracking-wider">Description</label>
                <textarea rows={2} className="input-field mt-1.5" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} data-testid="svc-desc-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate uppercase tracking-wider">Price (₹)</label>
                  <input type="number" className="input-field mt-1.5" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} data-testid="svc-price-input" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate uppercase tracking-wider">Duration (min)</label>
                  <input type="number" className="input-field mt-1.5" value={editing.estimated_duration_minutes} onChange={(e) => setEditing({ ...editing, estimated_duration_minutes: e.target.value })} data-testid="svc-duration-input" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate uppercase tracking-wider">Image URL</label>
                <input className="input-field mt-1.5" value={editing.image_url || ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} data-testid="svc-image-input" />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
              <button onClick={save} disabled={busy} className="btn-primary" data-testid="svc-save-btn"><Save size={14} /> Save service</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
