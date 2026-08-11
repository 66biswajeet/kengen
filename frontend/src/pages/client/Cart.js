import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { apiError } from "../../lib/api";
import { toast } from "sonner";
import { Minus, Plus, ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
import AppHeader from "../../components/AppHeader";
import BottomNav from "../../components/BottomNav";
import { useAuth } from "../../context/AuthContext";

export default function Cart() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], subtotal: 0, visit_charge: 0, tax: 0, total: 0 });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { const { data } = await api.get("/cart"); setCart(data); }
    catch (e) { toast.error(apiError(e)); }
  };
  useEffect(() => { load(); }, []);

  const change = async (itemId, quantity) => {
    setBusy(true);
    try {
      const { data } = quantity <= 0
        ? await api.delete(`/cart/items/${itemId}`)
        : await api.patch(`/cart/items/${itemId}`, { quantity });
      setCart(data);
    } catch (e) { toast.error(apiError(e)); }
    finally { setBusy(false); }
  };

  const empty = !cart.items || cart.items.length === 0;

  return (
    <div className="app-shell pb-40" data-testid="cart-screen">
      <AppHeader title="Your cart" />
      <div className="px-5 pt-4">
        {empty ? (
          <div className="flex flex-col items-center py-16">
            <div className="w-24 h-24 rounded-full bg-primary-surface flex items-center justify-center mb-4">
              <ShoppingBag size={40} className="text-primary" />
            </div>
            <div className="font-display font-semibold text-charcoal">Your cart is empty</div>
            <div className="text-slate text-sm mt-1">Add a service to get started</div>
            <button className="btn-primary w-auto px-6 mt-6" onClick={() => nav("/home")} data-testid="cart-explore-btn">Explore services</button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {cart.items.map((it) => (
                <div key={it.id} className="card p-4 flex gap-3" data-testid={`cart-item-${it.id}`}>
                  <img src={it.service?.image_url} alt="" className="w-20 h-20 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-charcoal truncate">{it.service?.name}</div>
                    <div className="text-xs text-slate mt-1">₹{it.price_snapshot} each</div>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="inline-flex items-center gap-3 bg-primary-surface rounded-lg px-2 py-1">
                        <button disabled={busy} onClick={() => change(it.id, it.quantity - 1)} className="w-7 h-7 rounded-md hover:bg-white flex items-center justify-center" data-testid={`cart-dec-${it.id}`}>
                          <Minus size={14} className="text-primary" />
                        </button>
                        <span className="text-sm font-semibold text-primary" data-testid={`cart-qty-${it.id}`}>{it.quantity}</span>
                        <button disabled={busy} onClick={() => change(it.id, it.quantity + 1)} className="w-7 h-7 rounded-md hover:bg-white flex items-center justify-center" data-testid={`cart-inc-${it.id}`}>
                          <Plus size={14} className="text-primary" />
                        </button>
                      </div>
                      <button onClick={() => change(it.id, 0)} className="text-slate hover:text-error transition-colors" data-testid={`cart-del-${it.id}`}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="font-semibold text-charcoal">₹{it.line_total}</div>
                </div>
              ))}
            </div>

            <div className="card p-4 mt-5" data-testid="cart-summary">
              <div className="flex justify-between text-sm text-slate mb-2"><span>Subtotal</span><span>₹{cart.subtotal}</span></div>
              <div className="flex justify-between text-sm text-slate mb-2"><span>Visit charge</span><span>₹{cart.visit_charge}</span></div>
              <div className="flex justify-between text-sm text-slate mb-3"><span>Taxes</span><span>₹{cart.tax}</span></div>
              <div className="border-t border-gray-100 pt-3 flex justify-between font-display font-bold text-charcoal text-lg">
                <span>Total</span><span data-testid="cart-total">₹{cart.total}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {!empty && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[440px] px-5 py-3 bg-white/95 backdrop-blur-xl border-t border-gray-100 z-40">
          <button onClick={() => nav("/checkout")} className="btn-accent" data-testid="proceed-checkout-btn">
            Proceed to Checkout <ArrowRight size={18} />
          </button>
        </div>
      )}
      <BottomNav role={user?.role} />
    </div>
  );
}
