import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { apiError } from "../../lib/api";
import { toast } from "sonner";
import AppHeader from "../../components/AppHeader";
import { useAuth } from "../../context/AuthContext";
import BottomNav from "../../components/BottomNav";

export default function CategoryList() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [cat, setCat] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, cs] = await Promise.all([
          api.get("/services", { params: { category_id: id } }),
          api.get("/categories"),
        ]);
        setServices(s.data);
        setCat((cs.data || []).find((c) => c.id === id));
      } catch (e) { toast.error(apiError(e)); }
    })();
  }, [id]);

  return (
    <div className="app-shell pb-28" data-testid="category-list-screen">
      <AppHeader title={cat?.name || "Services"} />
      <div className="px-5 pt-4 space-y-3">
        {services.length === 0 && <div className="text-slate text-center py-10">No services in this category.</div>}
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => nav(`/service/${s.id}`)}
            className="card w-full p-4 flex gap-3 text-left hover:border-primary/40 active:scale-[0.99] transition-all"
            data-testid={`service-card-${s.id}`}
          >
            <img src={s.image_url} alt="" className="w-24 h-24 rounded-xl object-cover" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-charcoal">{s.name}</div>
              <div className="text-xs text-slate line-clamp-2 mt-1">{s.description}</div>
              <div className="flex items-center gap-2 mt-3">
                <span className="chip-amber">₹{s.price}</span>
                <span className="text-[11px] text-slate">{s.estimated_duration_minutes} min</span>
              </div>
            </div>
          </button>
        ))}
      </div>
      <BottomNav role={user?.role} />
    </div>
  );
}
