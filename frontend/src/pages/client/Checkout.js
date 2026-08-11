import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { apiError } from "../../lib/api";
import { toast } from "sonner";
import { CalendarDays, Sun, Sunset, Moon, MapPin, StickyNote, Wallet, Smartphone, CheckCircle2 } from "lucide-react";
import AppHeader from "../../components/AppHeader";

const TIME_SLOTS = [
  { key: "10:00 AM - 12:00 PM", label: "Morning", icon: Sun },
  { key: "01:00 PM - 04:00 PM", label: "Afternoon", icon: Sunset },
  { key: "05:00 PM - 08:00 PM", label: "Evening", icon: Moon },
];

export default function Checkout() {
  const nav = useNavigate();
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [addrId, setAddrId] = useState(null);
  const [slot, setSlot] = useState(TIME_SLOTS[0].key);
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState("cod");
  const [busy, setBusy] = useState(false);

  const dates = useMemo(() => {
    const arr = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now); d.setDate(now.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);
  const [selectedDate, setSelectedDate] = useState(dates[0]);

  useEffect(() => {
    (async () => {
      try {
        const [c, a] = await Promise.all([api.get("/cart"), api.get("/addresses")]);
        setCart(c.data);
        setAddresses(a.data);
        const def = a.data.find((x) => x.is_default) || a.data[0];
        setAddrId(def?.id || null);
      } catch (e) { toast.error(apiError(e)); }
    })();
  }, []);

  const confirm = async () => {
    if (!addrId) return toast.error("Please add a delivery address first");
    if (!cart?.items?.length) return toast.error("Your cart is empty");
    setBusy(true);
    try {
      const isoDate = selectedDate.toISOString().slice(0, 10);
      const { data } = await api.post("/bookings", {
        address_id: addrId,
        scheduled_date: isoDate,
        scheduled_time_slot: slot,
        notes,
        payment_method: payment,
      });
      toast.success("Booking confirmed");
      nav(`/booking/${data.id}/confirmation`, { replace: true });
    } catch (e) { toast.error(apiError(e)); }
    finally { setBusy(false); }
  };

  if (!cart) return <div className="app-shell flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="app-shell pb-32" data-testid="checkout-screen">
      <AppHeader title="Checkout" />
      <div className="px-5 pt-4 space-y-4">
        {/* Date picker */}
        <section className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays size={16} className="text-primary" />
            <div className="font-semibold text-charcoal">Select date</div>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
            {dates.map((d) => {
              const sel = d.toDateString() === selectedDate.toDateString();
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => setSelectedDate(d)}
                  data-testid={`date-${d.toISOString().slice(0,10)}`}
                  className={`min-w-[64px] rounded-xl px-3 py-2.5 border transition-all ${sel ? "bg-primary text-white border-primary shadow-button" : "bg-white text-charcoal border-gray-100"}`}
                >
                  <div className="text-[10px] font-semibold uppercase opacity-70">{d.toLocaleDateString("en-IN", { weekday: "short" })}</div>
                  <div className="font-display font-semibold text-lg leading-none mt-1">{d.getDate()}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{d.toLocaleDateString("en-IN", { month: "short" })}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Time slot */}
        <section className="card p-4">
          <div className="font-semibold text-charcoal mb-3">Select time slot</div>
          <div className="grid grid-cols-3 gap-2">
            {TIME_SLOTS.map((s) => {
              const Icon = s.icon;
              const sel = slot === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setSlot(s.key)}
                  data-testid={`slot-${s.label.toLowerCase()}`}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${sel ? "border-primary bg-primary/5" : "border-gray-100 bg-white"}`}
                >
                  <Icon size={18} className={sel ? "text-primary" : "text-slate"} />
                  <div className={`text-xs font-semibold ${sel ? "text-primary" : "text-charcoal"}`}>{s.label}</div>
                  <div className="text-[10px] text-slate">{s.key.split(" - ")[0]}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Address */}
        <section className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={16} className="text-primary" />
            <div className="font-semibold text-charcoal flex-1">Service address</div>
            <button className="btn-ghost !py-1 !px-2 text-xs" onClick={() => nav("/account/addresses")} data-testid="edit-addr-btn">Edit</button>
          </div>
          {addresses.length === 0 ? (
            <button onClick={() => nav("/account/addresses")} className="btn-secondary" data-testid="add-addr-btn">
              + Add address
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              {addresses.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAddrId(a.id)}
                  data-testid={`addr-select-${a.id}`}
                  className={`text-left p-3 rounded-xl border transition-all ${addrId === a.id ? "border-primary bg-primary/5" : "border-gray-100"}`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-charcoal text-sm">{a.label}</span>
                    {a.is_default && <span className="chip !py-0.5 !text-[10px]">Default</span>}
                  </div>
                  <div className="text-xs text-slate">{a.address_line}, {a.city} {a.pincode}</div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Notes */}
        <section className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <StickyNote size={16} className="text-primary" />
            <div className="font-semibold text-charcoal">Notes for technician</div>
          </div>
          <textarea
            rows={2}
            className="input-field"
            placeholder="e.g. Kent Grand RO, 5 years old, water not dispensing"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            data-testid="notes-input"
          />
        </section>

        {/* Payment */}
        <section className="card p-4">
          <div className="font-semibold text-charcoal mb-3">Payment method</div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPayment("cod")}
              data-testid="pay-cod"
              className={`p-4 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${payment === "cod" ? "border-primary bg-primary/5" : "border-gray-100"}`}
            >
              <Wallet size={20} className={payment === "cod" ? "text-primary" : "text-slate"} />
              <div className="text-sm font-semibold text-charcoal">Cash</div>
              <div className="text-[11px] text-slate">Pay after service</div>
              {payment === "cod" && <CheckCircle2 size={14} className="text-primary" />}
            </button>
            <button
              onClick={() => setPayment("upi")}
              data-testid="pay-upi"
              className={`p-4 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${payment === "upi" ? "border-primary bg-primary/5" : "border-gray-100"}`}
            >
              <Smartphone size={20} className={payment === "upi" ? "text-primary" : "text-slate"} />
              <div className="text-sm font-semibold text-charcoal">UPI</div>
              <div className="text-[11px] text-slate">Via Razorpay</div>
              {payment === "upi" && <CheckCircle2 size={14} className="text-primary" />}
            </button>
          </div>
        </section>

        {/* Billing */}
        <section className="card p-4" data-testid="billing-summary">
          <div className="font-semibold text-charcoal mb-3">Bill summary</div>
          <div className="flex justify-between text-sm text-slate mb-1"><span>Subtotal</span><span>₹{cart.subtotal}</span></div>
          <div className="flex justify-between text-sm text-slate mb-1"><span>Visit charge</span><span>₹{cart.visit_charge}</span></div>
          <div className="flex justify-between text-sm text-slate mb-2"><span>Taxes</span><span>₹{cart.tax}</span></div>
          <div className="border-t border-gray-100 pt-2 flex justify-between font-display font-bold text-charcoal">
            <span>Total</span><span>₹{cart.total}</span>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] px-5 py-4 bg-white/95 backdrop-blur-xl border-t border-gray-100 z-40 safe-bottom">
        <button onClick={confirm} disabled={busy} className="btn-accent" data-testid="confirm-booking-btn">
          {busy ? "Confirming..." : `Confirm booking · ₹${cart.total}`}
        </button>
      </div>
    </div>
  );
}
