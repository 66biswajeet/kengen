import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { apiError } from "../../lib/api";
import { toast } from "sonner";
import AppHeader from "../../components/AppHeader";
import StatusStepper from "../../components/StatusStepper";
import { Phone, MapPin, KeyRound, Star, XCircle, RefreshCcw, Wallet, Smartphone, CheckCircle2 } from "lucide-react";
import { loadRazorpayScript, useAppConfig } from "../../lib/integrations";

export default function BookingDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const cfg = useAppConfig();
  const [b, setB] = useState(null);
  const [qr, setQr] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { const { data } = await api.get(`/bookings/${id}`); setB(data); }
    catch (e) { toast.error(apiError(e)); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  useEffect(() => {
    if (!b || b.status === "completed" || b.status === "cancelled") return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [b?.status]);

  const cancel = async () => {
    setBusy(true);
    try {
      const { data } = await api.patch(`/bookings/${id}/cancel`, { reason: "User cancelled" });
      toast.success(data.free_cancellation ? "Cancelled (free of charge)" : "Cancelled");
      load();
    } catch (e) { toast.error(apiError(e)); }
    finally { setBusy(false); }
  };

  const resendOtp = async () => {
    try { const { data } = await api.post(`/bookings/${id}/resend-otp`); toast.success(`New OTP: ${data.otp}`); load(); }
    catch (e) { toast.error(apiError(e)); }
  };

  const showQr = async () => {
    try {
      const { data } = await api.get(`/bookings/${id}/payments/qr`);
      if (data.mode === "live" && data.provider === "razorpay") {
        // Open real Razorpay Checkout
        const ok = await loadRazorpayScript();
        if (!ok) return toast.error("Failed to load Razorpay");
        const rz = new window.Razorpay({
          key: data.razorpay_key_id,
          amount: Math.round(data.amount * 100),
          currency: data.currency,
          name: "AquaServe",
          description: `Booking ${data.booking_code}`,
          order_id: data.razorpay_order_id,
          handler: async (resp) => {
            try {
              await api.post(`/bookings/${id}/payments/razorpay/verify`, {
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
              });
              toast.success("Payment successful");
              load();
            } catch (e) { toast.error(apiError(e)); }
          },
          theme: { color: "#0C54A4" },
        });
        rz.open();
      } else {
        setQr(data);
      }
    } catch (e) { toast.error(apiError(e)); }
  };

  const confirmUpi = async () => {
    try { await api.post(`/bookings/${id}/payments/confirm-upi`); toast.success("Payment confirmed"); setQr(null); load(); }
    catch (e) { toast.error(apiError(e)); }
  };

  const confirmCash = async () => {
    // provider-side normally; client just marks after handoff — we show a friendly confirmation
    toast.info("Please hand cash to the technician; they'll mark it collected in their app.");
  };

  if (!b) return <div className="app-shell flex items-center justify-center h-full"><div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const showOtpCard = ["provider_assigned", "on_the_way", "arrived"].includes(b.status) && b.otp_plain_for_client;

  return (
    <div className="app-shell pb-32" data-testid="booking-detail-screen">
      <AppHeader title={b.booking_code} />
      <div className="px-5 pt-4 space-y-4">
        {/* OTP card */}
        {showOtpCard && (
          <div className="card p-5 bg-gradient-to-br from-primary/5 to-accent/5" data-testid="client-otp-card">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound size={16} className="text-primary" />
              <div className="font-semibold text-charcoal">Share this OTP with the technician</div>
            </div>
            <div className="text-center py-6 bg-white rounded-xl border border-primary/10 mt-3">
              <div className="text-[3rem] font-bold tracking-[0.4em] text-primary pl-4" data-testid="otp-code">{b.otp_plain_for_client}</div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="text-xs text-slate">Only share when your technician arrives</div>
              <button onClick={resendOtp} className="btn-ghost !p-2 text-xs" data-testid="resend-otp-btn"><RefreshCcw size={12} className="inline mr-1" /> Resend</button>
            </div>
          </div>
        )}

        {/* Provider info */}
        {b.provider && (
          <div className="card p-4 flex items-center gap-4" data-testid="provider-card">
            <img src={b.provider.profile_photo_url || "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200"} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-primary/10" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-charcoal truncate">{b.provider.name}</div>
              <div className="flex items-center gap-1 text-xs mt-0.5">
                <Star size={12} className="fill-accent text-accent" />
                <span className="text-slate">{b.provider.average_rating || "4.6"}</span>
              </div>
            </div>
            {b.provider.phone && (
              <a href={`tel:${b.provider.phone}`} className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center shadow-button" data-testid="call-provider-btn">
                <Phone size={18} />
              </a>
            )}
          </div>
        )}

        {/* Status */}
        <section className="card p-5">
          <div className="font-display font-semibold text-charcoal mb-4">Status</div>
          <StatusStepper status={b.status === "cancelled" ? "pending" : b.status} />
          {b.status === "cancelled" && (
            <div className="mt-4 chip-amber !bg-error/10 !text-error"><XCircle size={12} /> Booking cancelled</div>
          )}
        </section>

        {/* Address */}
        {b.address && (
          <section className="card p-4">
            <div className="flex items-center gap-2 mb-1"><MapPin size={16} className="text-primary" /><div className="font-semibold text-charcoal">Address</div></div>
            <div className="text-sm text-slate">{b.address.address_line}, {b.address.city} {b.address.pincode}</div>
          </section>
        )}

        {/* Items */}
        <section className="card p-4">
          <div className="font-semibold text-charcoal mb-3">Services</div>
          {(b.items || []).map((it) => (
            <div key={it.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-b-0">
              <img src={it.service?.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1 min-w-0"><div className="text-sm font-semibold text-charcoal truncate">{it.service?.name}</div><div className="text-xs text-slate">Qty {it.quantity}</div></div>
              <div className="text-sm font-semibold">₹{it.price}</div>
            </div>
          ))}
          <div className="border-t border-gray-100 mt-3 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-slate"><span>Subtotal</span><span>₹{b.subtotal}</span></div>
            <div className="flex justify-between text-slate"><span>Visit charge</span><span>₹{b.visit_charge}</span></div>
            <div className="flex justify-between text-slate"><span>Tax</span><span>₹{b.tax}</span></div>
            <div className="flex justify-between font-display font-bold text-charcoal text-base"><span>Total</span><span>₹{b.total_amount}</span></div>
          </div>
        </section>

        {/* Payment */}
        <section className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            {b.payment_method === "upi" ? <Smartphone size={16} className="text-primary" /> : <Wallet size={16} className="text-primary" />}
            <div className="font-semibold text-charcoal capitalize flex-1">{b.payment_method}</div>
            <span className={`chip ${b.payment_status === "paid" ? "!bg-success/10 !text-success" : "!bg-accent/10 !text-accent-dark"}`}>{b.payment_status}</span>
          </div>
          {b.status === "completed" && b.payment_status !== "paid" && (
            <div className="flex gap-2 mt-3">
              <button onClick={confirmCash} className="btn-secondary" data-testid="confirm-cash-btn"><Wallet size={16} /> Confirm cash</button>
              <button onClick={showQr} className="btn-primary" data-testid="show-qr-btn"><Smartphone size={16} /> Pay via UPI</button>
            </div>
          )}
        </section>

        {/* QR modal-ish */}
        {qr && (
          <div className="card p-5 text-center" data-testid="upi-qr-card">
            <div className="font-semibold text-charcoal">Scan to pay ₹{qr.amount}</div>
            <img src={qr.qr_image_url} alt="UPI QR" className="mx-auto mt-3 rounded-xl" />
            <div className="text-xs text-slate mt-2">Booking: {qr.booking_code}</div>
            <button onClick={confirmUpi} className="btn-accent mt-4" data-testid="upi-confirm-paid-btn"><CheckCircle2 size={16} /> I have paid</button>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {b.status !== "completed" && b.status !== "cancelled" && (
            <button onClick={cancel} disabled={busy} className="btn-secondary !text-error !border-error/30 hover:!bg-error/5" data-testid="cancel-booking-btn">
              <XCircle size={16} /> Cancel booking
            </button>
          )}
          {b.status === "completed" && !b.review && (
            <button onClick={() => nav(`/booking/${b.id}/rate`)} className="btn-accent" data-testid="rate-now-btn">
              <Star size={16} /> Rate & Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
