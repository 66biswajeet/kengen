import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { apiError } from "../../lib/api";
import { toast } from "sonner";
import { CheckCircle2, Clock, Heart, ShoppingBag, Zap } from "lucide-react";
import AppHeader from "../../components/AppHeader";
import { useAuth } from "../../context/AuthContext";

export default function ServiceDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [svc, setSvc] = useState(null);
  const [busy, setBusy] = useState(false);
  const [wish, setWish] = useState(() => (JSON.parse(localStorage.getItem("aq_wish") || "[]").includes(id)));

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/services/${id}`);
        setSvc(data);
      } catch (e) { toast.error(apiError(e)); }
    })();
  }, [id]);

  const addToCart = async (goToCheckout = false) => {
    setBusy(true);
    try {
      await api.post("/cart/items", { service_id: id, quantity: 1 });
      toast.success("Added to cart");
      if (goToCheckout) nav("/checkout");
    } catch (e) { toast.error(apiError(e)); }
    finally { setBusy(false); }
  };

  const toggleWish = () => {
    const w = JSON.parse(localStorage.getItem("aq_wish") || "[]");
    const next = w.includes(id) ? w.filter((x) => x !== id) : [...w, id];
    localStorage.setItem("aq_wish", JSON.stringify(next));
    setWish(!wish);
  };

  if (!svc) return <div className="app-shell flex items-center justify-center h-full"><img src="/kengen_loading1.gif" alt="Loading..." className="w-16 h-16 object-contain" /></div>;

  const included = [
    "Full diagnostic check",
    "Genuine parts guaranteed",
    "30-day service warranty",
    "Free follow-up call within 7 days",
  ];

  return (
    <div className="app-shell pb-32" data-testid="service-detail-screen">
      <div className="relative">
        <img src={svc.image_url} alt="" className="w-full h-64 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
        <div className="absolute top-4 inset-x-0"><AppHeader title="" showBack showBell={false} right={
          <button onClick={toggleWish} data-testid="wishlist-btn" className={`w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center ${wish ? "bg-error/10 text-error" : "bg-white text-slate"}`}>
            <Heart size={18} className={wish ? "fill-error text-error" : ""} />
          </button>
        } /></div>
      </div>

      <div className="px-5 pt-5">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-2xl font-semibold text-charcoal">{svc.name}</h1>
          <span className="chip-amber !text-base whitespace-nowrap">₹{svc.price}</span>
        </div>
        <div className="flex items-center gap-3 mt-2 text-sm">
          <div className="flex items-center gap-1 text-slate"><Clock size={14} /> {svc.estimated_duration_minutes} min</div>
          <div className="chip"><Zap size={12} /> Same-day slot</div>
        </div>

        <p className="text-slate mt-4 leading-relaxed">{svc.description}</p>

        <section className="mt-6">
          <h3 className="font-display font-semibold text-charcoal mb-3">What's included</h3>
          <ul className="flex flex-col gap-2">
            {included.map((i, k) => (
              <li key={k} className="flex items-center gap-2 text-sm text-charcoal">
                <CheckCircle2 size={16} className="text-success shrink-0" /> {i}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Sticky footer CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] px-5 py-4 bg-white/95 backdrop-blur-xl border-t border-gray-100 flex gap-3 safe-bottom z-40">
        <button onClick={() => addToCart(false)} disabled={busy} className="btn-secondary" data-testid="add-to-cart-btn">
          <ShoppingBag size={16} /> Add to Cart
        </button>
        <button onClick={() => addToCart(true)} disabled={busy} className="btn-accent" data-testid="book-now-btn">
          Book Now
        </button>
      </div>
    </div>
  );
}
