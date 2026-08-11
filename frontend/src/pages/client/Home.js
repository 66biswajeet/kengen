import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, MapPin, Star, ArrowRight, Wrench, Filter,
  Droplet, ShieldCheck, Sparkles, Bell, ChevronRight,
  BadgeCheck,
} from "lucide-react";
import api, { apiError } from "../../lib/api";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import BottomNav from "../../components/BottomNav";

const CATEGORY_META = {
  "Installation":    { icon: Droplet,     color: "bg-primary/10 text-primary", ring: "ring-primary/10" },
  "Filter Change":   { icon: Filter,      color: "bg-primary/10 text-primary", ring: "ring-primary/10" },
  "Repair":          { icon: Wrench,      color: "bg-primary/10 text-primary", ring: "ring-primary/10" },
  "AMC":             { icon: ShieldCheck, color: "bg-primary/10 text-primary", ring: "ring-primary/10" },
  "General Service": { icon: Sparkles,    color: "bg-primary/10 text-primary", ring: "ring-primary/10" },
};

const BANNERS = [
  {
    tag: "Limited offer",
    title: "Filter change\nfrom ₹499",
    sub: "Trusted RO technicians in 60 min",
    cta: "Book now",
    bg: "from-[#0C54A4] via-[#1a6bc7] to-[#4CA3DD]",
    accent: "#E8F1F9",
    shape: "bg-white/10",
  },
  {
    tag: "Same-day service",
    title: "RO repair at\nyour doorstep",
    sub: "No visit charge on confirmed repair",
    cta: "Book now",
    bg: "from-[#8D3E00] via-[#a84c00] to-[#B56124]",
    accent: "#F5E6D9",
    shape: "bg-white/10",
  },
  {
    tag: "Best value",
    title: "Annual AMC\nfrom ₹1,499",
    sub: "4 services + priority support included",
    cta: "Explore plan",
    bg: "from-[#1a3a5c] via-[#0C54A4] to-[#2e6db5]",
    accent: "#E8F1F9",
    shape: "bg-white/10",
  },
];

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
  const [bannerIdx, setBannerIdx] = useState(0);

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

  // Auto-advance banner
  useEffect(() => {
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % BANNERS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const filtered = q.trim()
    ? services.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()))
    : services;

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="app-shell pb-28" data-testid="home-screen" style={{ background: "#F4F7FA" }}>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-40 px-5 pt-5 pb-4"
        style={{ background: "rgba(244,247,250,0.92)", backdropFilter: "blur(18px)" }}
      >
        {/* Greeting row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-slate uppercase tracking-widest">{getGreeting()}</p>
            <h1 className="font-display text-xl font-bold text-charcoal leading-tight">
              Hey, {firstName} 👋
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => nav("/notifications")}
              className="relative w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm hover:border-primary/30 transition-colors"
              data-testid="home-bell-btn"
            >
              <Bell size={17} className="text-charcoal" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white" />
            </button>
            <button
              onClick={() => nav("/account")}
              className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-sm"
            >
              <span className="text-white text-sm font-bold">
                {(user?.name?.[0] || "U").toUpperCase()}
              </span>
            </button>
          </div>
        </div>

        {/* Location pill */}
        <button
          className="flex items-center gap-1.5 mb-3 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 w-fit"
          onClick={() => nav("/account/addresses")}
        >
          <MapPin size={12} className="text-primary" />
          <span className="text-xs font-semibold text-primary truncate max-w-[200px]" data-testid="home-location">
            {address ? `${address.city}, ${address.state}` : "Set your location"}
          </span>
          <ChevronRight size={12} className="text-primary/60" />
        </button>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
          <input
            data-testid="home-search"
            className="w-full bg-white border border-gray-100 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-charcoal placeholder:text-slate/70 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 shadow-sm transition-all"
            placeholder="Search RO service, filter change…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

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

        {/* ── HERO BANNER CAROUSEL ─────────────────────────────────── */}
        <div className="-mx-5">
          <div className="relative overflow-hidden" style={{ height: 210 }}>
            {BANNERS.map((b, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${i === bannerIdx ? "opacity-100 translate-x-0" : i < bannerIdx ? "opacity-0 -translate-x-full" : "opacity-0 translate-x-full"}`}
              >
                <div className={`h-full bg-gradient-to-br ${b.bg} relative overflow-hidden`}>
                  {/* Decorative shapes */}
                  <div className={`absolute -right-10 -top-10 w-44 h-44 ${b.shape} rounded-full blur-2xl`} />
                  <div className={`absolute -right-4 -bottom-8 w-28 h-28 ${b.shape} rounded-full blur-xl`} />
                  <div className={`absolute left-1/2 top-4 w-16 h-16 ${b.shape} rounded-full blur-lg`} />

                  {/* Content — all left aligned */}
                  <div className="relative z-10 h-full flex flex-col justify-between px-6 pt-5 pb-5">
                    <div className="flex flex-col items-start gap-1.5">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white/90 backdrop-blur-sm border border-white/20">
                        {b.tag}
                      </span>
                      <h2 className="font-display text-[1.6rem] font-extrabold text-white leading-[1.2] drop-shadow-sm text-left">
                        {b.title.split("\n").map((line, li) => (
                          <span key={li} style={{ display: "block" }}>{line}</span>
                        ))}
                      </h2>
                      <p className="text-white/80 text-xs font-medium text-left">{b.sub}</p>
                    </div>
                    <button className="self-start px-5 py-2.5 rounded-xl bg-white text-primary text-xs font-bold shadow-lg hover:bg-white/90 transition-colors">
                      {b.cta} →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-1.5 mt-2.5">
            {BANNERS.map((_, i) => (
              <button
                key={i}
                onClick={() => setBannerIdx(i)}
                className={`transition-all duration-300 rounded-full ${i === bannerIdx ? "w-5 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-gray-300"}`}
              />
            ))}
          </div>
        </div>



        {/* ── CATEGORIES ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-charcoal text-base">What do you need?</h3>
            <button className="text-xs text-primary font-semibold flex items-center gap-0.5" onClick={() => nav("/home")}>
              All <ChevronRight size={13} />
            </button>
          </div>
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-3 flex flex-col items-center gap-2 animate-pulse">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100" />
                  <div className="h-2.5 bg-gray-100 rounded w-14" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {categories.map((c) => {
                const meta = CATEGORY_META[c.name] || { icon: Wrench, color: "bg-slate/10 text-slate", ring: "ring-gray-100" };
                const Icon = meta.icon;
                return (
                  <button
                    key={c.id}
                    onClick={() => nav(`/category/${c.id}`)}
                    className={`bg-white rounded-2xl py-4 flex flex-col items-center gap-2 border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.96] transition-all ring-1 ${meta.ring}`}
                    data-testid={`cat-btn-${c.name.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    <div className={`w-12 h-12 rounded-2xl ${meta.color} flex items-center justify-center`}>
                      <Icon size={22} strokeWidth={1.8} />
                    </div>
                    <div className="text-[11px] font-bold text-charcoal text-center leading-tight px-1">{c.name}</div>
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
