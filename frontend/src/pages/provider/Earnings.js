import React, { useEffect, useState } from "react";
import api, { apiError } from "../../lib/api";
import { toast } from "sonner";
import BottomNav from "../../components/BottomNav";

export default function Earnings() {
  const [data, setData] = useState({ today: 0, this_week: 0, this_month: 0, history: [] });
  useEffect(() => {
    (async () => { try { const { data } = await api.get("/providers/me/earnings"); setData(data); } catch (e) { toast.error(apiError(e)); } })();
  }, []);
  return (
    <div className="app-shell pb-28" data-testid="provider-earnings-screen">
      <div className="glass-header"><h2 className="font-display text-xl font-semibold text-charcoal">Earnings</h2></div>
      <div className="px-5 pt-4 grid grid-cols-3 gap-3">
        <div className="card p-3"><div className="text-[10px] text-slate uppercase font-semibold tracking-wider">Today</div><div className="font-display text-xl font-bold text-charcoal">₹{data.today}</div></div>
        <div className="card p-3"><div className="text-[10px] text-slate uppercase font-semibold tracking-wider">This week</div><div className="font-display text-xl font-bold text-charcoal">₹{data.this_week}</div></div>
        <div className="card p-3"><div className="text-[10px] text-slate uppercase font-semibold tracking-wider">This month</div><div className="font-display text-xl font-bold text-charcoal">₹{data.this_month}</div></div>
      </div>
      <div className="px-5 pt-6">
        <h3 className="font-display font-semibold text-charcoal mb-3">Transactions</h3>
        <div className="flex flex-col gap-2">
          {data.history?.length === 0 && <div className="text-slate text-sm text-center py-6">No transactions yet.</div>}
          {data.history?.map((h, i) => (
            <div key={i} className="card p-3 flex justify-between text-sm">
              <div>
                <div className="font-semibold text-charcoal">Booking payout</div>
                <div className="text-xs text-slate">{new Date(h.date).toLocaleDateString()} · {h.payment_method?.toUpperCase()}</div>
              </div>
              <div className="font-semibold text-success">+ ₹{h.amount}</div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav role="provider" />
    </div>
  );
}
