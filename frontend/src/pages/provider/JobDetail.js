import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { apiError } from "../../lib/api";
import { toast } from "sonner";
import { Phone, MapPin, Navigation, KeyRound, CheckCircle2, Wallet, Smartphone } from "lucide-react";
import AppHeader from "../../components/AppHeader";
import { loadRazorpayScript } from "../../lib/integrations";

const STATUS_FLOW = ["provider_assigned", "on_the_way", "arrived", "in_progress", "completed"];

export default function JobDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [b, setB] = useState(null);
  const [otp, setOtp] = useState("");
  const [qr, setQr] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { const { data } = await api.get(`/bookings/${id}`); setB(data); }
    catch (e) { toast.error(apiError(e)); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const advance = async (target) => {
    setBusy(true);
    try { await api.patch(`/bookings/${id}/status`, { status: target }); await load(); toast.success(`Status: ${target.replace(/_/g, " ")}`); }
    catch (e) { toast.error(apiError(e)); }
    finally { setBusy(false); }
  };

  const verifyOtp = async () => {
    setBusy(true);
    try { await api.post(`/bookings/${id}/verify-otp`, { otp }); toast.success("OTP verified"); setOtp(""); await load(); }
    catch (e) { toast.error(apiError(e)); }
    finally { setBusy(false); }
  };

  const collectCash = async () => { try { await api.post(`/bookings/${id}/payments/collect`); toast.success("Cash marked collected"); load(); } catch (e) { toast.error(apiError(e)); } };
  const showQr = async () => {
    try {
      const { data } = await api.get(`/bookings/${id}/payments/qr`);
      if (data.mode === "live" && data.provider === "razorpay") {
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
              toast.success("Payment received");
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
  const confirmUpi = async () => { try { await api.post(`/bookings/${id}/payments/confirm-upi`); toast.success("UPI payment confirmed"); setQr(null); load(); } catch (e) { toast.error(apiError(e)); } };

  if (!b) return <div className="app-shell flex items-center justify-center h-full"><img src="/kengen_loading1.gif" alt="Loading..." className="w-16 h-16 object-contain" /></div>;

  const idx = STATUS_FLOW.indexOf(b.status);
  const nextStatus = idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
  const nextLabel = { on_the_way: "Start Journey", arrived: "Mark Arrived", in_progress: "Start Service", completed: "Mark Complete" }[nextStatus];

  const addr = b.address ? `${b.address.address_line}, ${b.address.city} ${b.address.pincode}` : "";

  return (
    <div className="app-shell pb-24" data-testid="provider-job-detail">
      <AppHeader title={b.booking_code} />
      <div className="px-5 pt-4 space-y-4">
        {/* Client card */}
        <div className="card p-4 flex items-center gap-4" data-testid="client-info">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display text-lg font-bold">{(b.service_needer?.name || "C")[0]}</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-charcoal truncate">{b.service_needer?.name || "Customer"}</div>
            <div className="text-xs text-slate">{b.scheduled_date} · {b.scheduled_time_slot}</div>
          </div>
          {b.service_needer?.phone && (
            <a href={`tel:${b.service_needer.phone}`} className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center shadow-button" data-testid="call-client-btn"><Phone size={18} /></a>
          )}
        </div>

        {/* Address */}
        {b.address && (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2"><MapPin size={16} className="text-primary" /><div className="font-semibold text-charcoal">Service address</div></div>
            <div className="text-sm text-slate mb-3">{addr}</div>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`} target="_blank" rel="noreferrer" className="btn-secondary" data-testid="navigate-btn">
              <Navigation size={16} /> Navigate
            </a>
          </div>
        )}

        {/* Service info */}
        <div className="card p-4">
          <div className="font-semibold text-charcoal mb-2">Service</div>
          {(b.items || []).map((i) => (
            <div key={i.id} className="flex items-center gap-3 py-1"><img src={i.service?.image_url} className="w-10 h-10 rounded-lg object-cover" alt="" /><div className="flex-1"><div className="text-sm font-semibold text-charcoal">{i.service?.name}</div><div className="text-xs text-slate">Qty {i.quantity}</div></div><div className="text-sm font-semibold">₹{i.price}</div></div>
          ))}
          {b.notes && <div className="mt-3 p-3 bg-primary-surface rounded-xl text-xs text-charcoal">"{b.notes}"</div>}
        </div>

        {/* OTP entry (after arrival) */}
        {b.status === "arrived" && !b.otp_verified_at && (
          <div className="card p-4" data-testid="otp-entry-card">
            <div className="flex items-center gap-2 mb-2"><KeyRound size={16} className="text-primary" /><div className="font-semibold text-charcoal">Enter customer OTP</div></div>
            <div className="text-xs text-slate mb-3">Ask the customer for the 4-digit code to start service. {b.otp_attempts >= 3 && <span className="text-error">Max attempts reached — ask customer to resend OTP.</span>}</div>
            <div className="flex gap-2">
              <input
                inputMode="numeric"
                className="input-field tracking-[0.5em] text-center font-semibold text-lg"
                placeholder="——"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                data-testid="provider-otp-input"
              />
              <button onClick={verifyOtp} disabled={busy || otp.length !== 4} className="btn-primary !w-auto px-4" data-testid="verify-otp-btn">Verify</button>
            </div>
          </div>
        )}

        {/* Sequenced stepper action */}
        {nextStatus && b.status !== "completed" && (
          <button
            onClick={() => advance(nextStatus)}
            disabled={busy || (nextStatus === "in_progress" && !b.otp_verified_at)}
            className="btn-accent"
            data-testid="advance-status-btn"
          >
            {nextLabel} <CheckCircle2 size={16} />
          </button>
        )}

        {/* Payment */}
        {b.status === "completed" && b.payment_status !== "paid" && (
          <div className="card p-4">
            <div className="font-semibold text-charcoal mb-3">Collect payment · ₹{b.total_amount}</div>
            <div className="flex gap-2">
              <button onClick={collectCash} className="btn-secondary" data-testid="collect-cash-btn"><Wallet size={16} /> Cash collected</button>
              <button onClick={showQr} className="btn-primary" data-testid="show-upi-qr-btn"><Smartphone size={16} /> Show UPI QR</button>
            </div>
            {qr && (
              <div className="mt-4 text-center">
                <img src={qr.qr_image_url} alt="UPI QR" className="mx-auto rounded-xl" />
                <div className="text-xs text-slate mt-2">Amount: ₹{qr.amount}</div>
                <button onClick={confirmUpi} className="btn-accent mt-3" data-testid="confirm-upi-btn"><CheckCircle2 size={16} /> Confirm UPI received</button>
              </div>
            )}
          </div>
        )}

        {b.status === "completed" && b.payment_status === "paid" && (
          <div className="card p-4 bg-success/5 border-success/20 flex items-center gap-3"><CheckCircle2 className="text-success" /><div className="font-semibold text-success">Job completed & paid</div></div>
        )}
      </div>
    </div>
  );
}
