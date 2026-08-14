import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star, ArrowRight, Wrench,
  BadgeCheck, ChevronRight,
} from "lucide-react";
import api, { apiError } from "../../lib/api";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import BottomNav from "../../components/BottomNav";
import HomeHero from "../../components/HomeHero";

const CATEGORY_META = {
  "Installation":    { emoji: "💧", color: "bg-blue-50",   ring: "ring-blue-100" },
  "Filter Change":   { emoji: "🔄", color: "bg-cyan-50",   ring: "ring-cyan-100" },
  "Repair":          { emoji: "🔧", color: "bg-orange-50", ring: "ring-orange-100" },
  "AMC":             { emoji: "🛡️", color: "bg-green-50",  ring: "ring-green-100" },
  "General Service": { emoji: "✨",   color: "bg-purple-50", ring: "ring-purple-100" },
};



function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [activeBooking, setActiveBooking] = useState(null);
  const [q, setQ] = useState("");
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [c, s, p, b] = await Promise.all([
          api.get("/categories"),
          api.get("/services"),
          api.get("/providers/nearby"),
          api.get("/bookings", { params: { scope: "upcoming" } }),
        ]);
        setCategories(c.data);
        setServices(s.data);
        setProviders(p.data);
        setActiveBooking((b.data || [])[0] || null);

        if (user?.role === "service_needer") {
          const addrRes = await api.get("/addresses");
          const defaultAddr = (addrRes.data || []).find((a) => a.is_default) || (addrRes.data || [])[0];
          if (defaultAddr) setAddress(defaultAddr);
        }
      } catch (e) { toast.error(apiError(e)); }
      finally { setLoading(false); }
    })();
  }, [user]);



  const filtered = q.trim()
    ? services.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()))
    : services;

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="app-shell pb-28" data-testid="home-screen" style={{ background: "#F4F7FA" }}>

      {/* ── HEADER + HERO ──────────────────────────────────────────── */}
      <HomeHero
        locationCode={address?.landmark || "W68G+J6Q"}
        locationAddress={
          address
            ? `${address.address_line1}, ${address.city}, ${address.state}`
            : "Karapakkam- Chennai- Tamil Nadu..."
        }
        searchQuery={q}
        onSearchChange={setQ}
        onLocationClick={() => nav("/account/addresses")}
      />

      <div className="px-5 space-y-7">

        {/* ── ACTIVE BOOKING BANNER ────────────────────────────────── */}
        {!loading && activeBooking && (
          <div
            className="flex items-center gap-4 px-4 py-3.5 rounded-2xl cursor-pointer active:scale-[0.99] transition-transform"
            style={{ background: "linear-gradient(135deg,#F5E6D9,#fdf0e5)" }}
            onClick={() => nav(`/booking/${activeBooking.id}`)}
            data-testid="active-booking-widget"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
              <Wrench size={18} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase font-bold tracking-wider text-accent">Upcoming booking</div>
              <div className="font-semibold text-charcoal text-sm truncate">{activeBooking.items?.[0]?.service?.name || "Service"}</div>
              <div className="text-xs text-slate">{activeBooking.scheduled_date} · {activeBooking.scheduled_time_slot}</div>
            </div>
            <ArrowRight size={16} className="text-accent shrink-0" />
          </div>
        )}

        {/* ── CATEGORIES ─────────────────────────────────────────── */}
        <section className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-charcoal text-sm">What do you need?</h3>
            <button className="text-xs text-primary font-semibold flex items-center gap-0.5" onClick={() => nav("/home")}>
              All <ChevronRight size={12} />
            </button>
          </div>
          {loading ? (
            <div className="grid grid-cols-3 gap-2.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-2.5 flex flex-col items-center gap-1.5 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-gray-100" />
                  <div className="h-2 bg-gray-100 rounded w-12" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              {categories.map((c) => {
                const meta = CATEGORY_META[c.name] || { emoji: "🔧", color: "bg-slate/10", ring: "ring-gray-100" };
                return (
                  <button
                    key={c.id}
                    onClick={() => nav(`/category/${c.id}`)}
                    className={`bg-white rounded-2xl py-3 flex flex-col items-center gap-1.5 border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.96] transition-all ring-1 ${meta.ring}`}
                    data-testid={`cat-btn-${c.name.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${meta.color} flex items-center justify-center`}>
                      <span style={{ fontSize: 20, lineHeight: 1 }}>{meta.emoji}</span>
                    </div>
                    <div className="text-[10px] font-semibold text-charcoal text-center leading-tight px-1">{c.name}</div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ── PROVIDERS NEAR YOU ───────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-charcoal text-base">Top techs near you</h3>
            <span className="text-xs text-slate bg-white px-2.5 py-1 rounded-full border border-gray-100 font-semibold">
              {loading ? "..." : `${providers.length} available`}
            </span>
          </div>
          {loading ? (
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-1 px-1">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl min-w-[170px] p-4 flex flex-col gap-3 animate-pulse border border-gray-100">
                  <div className="w-14 h-14 rounded-full bg-gray-100 mx-auto" />
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-20 mx-auto" />
                    <div className="h-2.5 bg-gray-100 rounded w-14 mx-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-1 px-1">
              {providers.slice(0, 6).map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl min-w-[160px] p-4 flex flex-col items-center gap-2.5 border border-gray-100 shadow-sm active:scale-[0.97] transition-all"
                  data-testid={`provider-card-${p.id}`}
                >
                  <div className="relative">
                    <img
                      src={p.profile_photo_url || "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200"}
                      alt=""
                      className="w-14 h-14 rounded-full object-cover border-2 border-primary/15"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <BadgeCheck size={10} className="text-white fill-white" />
                    </div>
                  </div>
                  <div className="text-center min-w-0 w-full">
                    <div className="font-bold text-charcoal text-sm truncate">{p.name}</div>
                    <div className="text-[10px] text-slate truncate">{p.service_area_locality}</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <span className="font-bold text-charcoal">{p.average_rating || "4.5"}</span>
                    <span className="text-slate">· {p.total_jobs_completed || 0} jobs</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── POPULAR SERVICES ─────────────────────────────────────── */}
        <section className="pb-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-charcoal text-base">Popular services</h3>
          </div>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-3.5 flex gap-3.5 animate-pulse border border-gray-100">
                  <div className="w-20 h-20 rounded-xl bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3.5 bg-gray-100 rounded w-2/3" />
                    <div className="h-2.5 bg-gray-100 rounded w-5/6" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                    <div className="h-6 bg-gray-100 rounded w-16 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.slice(0, 6).map((s) => (
                <button
                  key={s.id}
                  onClick={() => nav(`/service/${s.id}`)}
                  className="bg-white rounded-2xl p-3.5 flex gap-3.5 text-left border border-gray-100 shadow-sm hover:border-primary/30 hover:shadow-md active:scale-[0.99] transition-all"
                  data-testid={`service-card-${s.id}`}
                >
                  <img src={s.image_url} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="font-bold text-charcoal text-sm">{s.name}</div>
                    <div className="text-xs text-slate line-clamp-2 mt-1 leading-relaxed">{s.description}</div>
                    <div className="flex items-center gap-2 mt-2.5">
                      <span className="text-sm font-extrabold text-charcoal">₹{s.price}</span>
                      <span className="text-[10px] text-slate font-medium">· {s.estimated_duration_minutes} min</span>
                      <span className="ml-auto text-primary">
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <BottomNav role={user?.role} />
    </div>
  );
}
