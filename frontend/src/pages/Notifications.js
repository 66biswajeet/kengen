import React, { useEffect, useState } from "react";
import api, { apiError } from "../lib/api";
import { toast } from "sonner";
import AppHeader from "../components/AppHeader";
import { Bell } from "lucide-react";

export default function Notifications() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    (async () => { try { const { data } = await api.get("/notifications"); setItems(data); } catch (e) { toast.error(apiError(e)); } })();
  }, []);

  return (
    <div className="app-shell pb-8" data-testid="notifications-screen">
      <AppHeader title="Notifications" />
      <div className="px-5 pt-4 space-y-3">
        {items.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-full bg-primary-surface mx-auto flex items-center justify-center mb-3"><Bell size={40} className="text-primary" /></div>
            <div className="font-display font-semibold text-charcoal">Nothing new for you</div>
            <div className="text-slate text-sm">We'll notify you about your bookings here.</div>
          </div>
        )}
        {items.map((n) => (
          <div key={n.id} className={`card p-4 flex gap-3 ${n.is_read ? "opacity-70" : ""}`} data-testid={`notif-${n.id}`}>
            <div className={`w-2 h-2 rounded-full mt-2 ${n.is_read ? "bg-slate/30" : "bg-primary"}`} />
            <div className="flex-1">
              <div className="font-semibold text-charcoal text-sm">{n.title}</div>
              <div className="text-xs text-slate">{n.body}</div>
              <div className="text-[10px] text-slate mt-1">{new Date(n.created_at).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
