import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Calendar } from "lucide-react";
import api, { apiError } from "../../lib/api";
import { toast } from "sonner";

export default function BookingConfirmation() {
  const { id } = useParams();
  const nav = useNavigate();
  const [b, setB] = useState(null);

  useEffect(() => {
    (async () => {
      try { const { data } = await api.get(`/bookings/${id}`); setB(data); }
      catch (e) { toast.error(apiError(e)); }
    })();
  }, [id]);

  return (
    <div className="app-shell flex flex-col items-center px-6 pt-16 pb-8" data-testid="booking-confirmation-screen">
      <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-4 animate-slide-up">
        <CheckCircle2 size={54} className="text-success" strokeWidth={2} />
      </div>
      <h1 className="font-display text-3xl font-bold text-charcoal">Booking confirmed</h1>
      <p className="text-slate mt-2 text-center">Thank you! We're finding the best technician for you.</p>

      {b && (
        <div className="card p-5 w-full mt-8" data-testid="confirmation-summary">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate uppercase tracking-wider font-semibold">Booking ID</span>
            <span className="chip">{b.booking_code}</span>
          </div>
          <div className="flex items-center gap-2 text-charcoal">
            <Calendar size={16} className="text-primary" />
            <span className="font-semibold">{b.scheduled_date}</span>
            <span className="text-slate text-sm">· {b.scheduled_time_slot}</span>
          </div>
          <div className="mt-3 text-sm text-slate">
            {(b.items || []).map((i) => i.service?.name).join(", ")}
          </div>
          <div className="mt-4 flex justify-between border-t pt-3 border-gray-100">
            <span className="text-slate">Total</span>
            <span className="font-display font-bold text-charcoal">₹{b.total_amount}</span>
          </div>
        </div>
      )}

      <div className="w-full mt-8 flex flex-col gap-3">
        <button onClick={() => nav(`/booking/${id}`)} className="btn-primary" data-testid="view-booking-btn">View booking</button>
        <button onClick={() => nav("/home")} className="btn-ghost" data-testid="back-home-btn">Back to home</button>
      </div>
    </div>
  );
}
