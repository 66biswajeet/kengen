import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Search, ChevronDown, ArrowRight } from "lucide-react";

/* ─────────────────────────────────────────────
   CAROUSEL SLIDES DATA
   Replace imageUrl with real assets when ready.
───────────────────────────────────────────── */
const HERO_SLIDES = [
  {
    headline: ["First-ever RO with", "3-year filter life."],
    cta: "Know more",
    imageUrl: "https://res.cloudinary.com/dlllz6quk/image/upload/v1786732660/Screenshot_2026-08-15_000722_josk5h.png", // fallback placeholder
  },
  {
    headline: ["Same-day RO repair", "at your doorstep."],
    cta: "Book now",
    imageUrl: "https://res.cloudinary.com/dlllz6quk/image/upload/v1786732088/image2_kengen_a51vpz.jpg",
  },
  {
    headline: ["Annual AMC plans", "starting ₹1,499."],
    cta: "Explore plan",
    imageUrl: "https://res.cloudinary.com/dlllz6quk/image/upload/v1786731591/image3_kengen_ehzs2z.jpg",
  },
];

/* ─────────────────────────────────────────────
   PRODUCT PLACEHOLDER — fallback when no image
───────────────────────────────────────────── */
function ProductPlaceholder() {
  return (
    <div className="relative w-full h-full flex items-end justify-center">
      {/* RO unit */}
      <div
        className="absolute bottom-0 right-0"
        style={{ width: 88, height: 130 }}
      >
        <div
          className="w-full h-full rounded-2xl flex flex-col items-center justify-between py-3 px-2"
          style={{
            background:
              "linear-gradient(160deg,#1c1c1e 0%,#2a2a2e 60%,#111 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          }}
        >
          {/* top control panel */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map((d) => (
              <div
                key={d}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: d === 1 ? "#4CA3DD" : "#444" }}
              />
            ))}
          </div>
          {/* brand label */}
          <div
            className="w-full text-center text-[7px] font-bold tracking-widest"
            style={{ color: "rgba(255,255,255,0.45)", letterSpacing: 3 }}
          >
            AQUA
          </div>
          {/* water outlet nub */}
          <div
            className="w-4 h-3 rounded-sm"
            style={{ background: "#222", border: "1px solid #333" }}
          />
        </div>
        {/* reflection */}
        <div
          className="w-full mt-1 rounded-xl"
          style={{
            height: 14,
            background:
              "linear-gradient(to bottom, rgba(76,163,221,0.18), transparent)",
          }}
        />
      </div>

      {/* Phone mockup */}
      <div
        className="absolute"
        style={{ bottom: 18, right: 92, width: 55, height: 96 }}
      >
        <div
          className="w-full h-full rounded-xl overflow-hidden"
          style={{
            background:
              "linear-gradient(160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
          }}
        >
          {/* notch */}
          <div className="flex justify-center pt-1.5">
            <div
              className="w-8 h-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.15)" }}
            />
          </div>
          {/* screen content strips */}
          <div className="px-1.5 pt-2 space-y-1">
            {[80, 60, 70, 50, 65].map((w, i) => (
              <div
                key={i}
                className="rounded-sm"
                style={{
                  width: `${w}%`,
                  height: i === 0 ? 5 : 3,
                  background:
                    i === 0
                      ? "rgba(76,163,221,0.7)"
                      : "rgba(255,255,255,0.12)",
                }}
              />
            ))}
          </div>
          {/* mini chart area */}
          <div
            className="mx-1.5 mt-2 rounded"
            style={{
              height: 28,
              background:
                "linear-gradient(to top, rgba(76,163,221,0.3) 0%, transparent 100%)",
              borderBottom: "1px solid rgba(76,163,221,0.5)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function HomeHero({
  locationCode = "W68G+J6Q",
  locationAddress = "Karapakkam- Chennai- Tamil Nadu...",
  searchQuery = "",
  onSearchChange,
  onLocationClick,
}) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef(null);

  /* auto-advance — useCallback so the ref is stable across renders */
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  function goToSlide(idx) {
    setAnimating(true);
    setTimeout(() => {
      setSlideIdx(idx);
      setAnimating(false);
    }, 280);
    startTimer();
  }

  const slide = HERO_SLIDES[slideIdx];

  return (
    <div
      className="w-full bg-black"
      style={{ fontFamily: "'Inter', sans-serif" }}
      data-testid="home-hero-section"
    >
      {/* ── LOCATION HEADER ───────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <MapPin
          size={22}
          className="text-white shrink-0"
          strokeWidth={2}
          aria-hidden="true"
        />

        <button
          className="flex flex-col items-start gap-0.5 flex-1 min-w-0"
          onClick={onLocationClick}
          aria-label="Change location"
          data-testid="location-header-btn"
        >
          <span
            className="text-white font-bold leading-tight"
            style={{ fontSize: 17, letterSpacing: 0.2 }}
          >
            {locationCode}
          </span>
          <span
            className="flex items-center gap-1 text-gray-400"
            style={{ fontSize: 12 }}
          >
            <span className="truncate max-w-[230px]">{locationAddress}</span>
            <ChevronDown size={12} strokeWidth={2} className="text-gray-400" aria-hidden="true" />
          </span>
        </button>
      </div>

      {/* ── SEARCH BAR ────────────────────────────────────────────── */}
      <div className="px-4 pb-3">
        <div
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl shadow-sm bg-white border border-gray-100"
        >
          <Search size={16} strokeWidth={2} style={{ color: "#9ca3af" }} aria-hidden="true" />
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-xs text-gray-900 placeholder:text-gray-400 font-medium"
            placeholder="Search for 'RO Service'"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            data-testid="hero-search-input"
          />
        </div>
      </div>

      {/* ── HERO BANNER ───────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden w-full bg-gray-900"
        style={{ height: "25vh", minHeight: 130, maxHeight: 210 }}
        data-testid="hero-banner"
      >
        {/* Full-bleed background image covering entire carousel */}
        {slide.imageUrl ? (
          <img
            src={slide.imageUrl}
            alt={slide.headline.join(" ")}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-slate-900 to-blue-950">
            <ProductPlaceholder />
          </div>
        )}

        {/* Subtle Overlay to ensure text readability over any background image */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none" />

        {/* Text Content Overlay */}
        <div
          className="absolute inset-0 flex flex-col justify-center gap-3 z-10 px-5"
          style={{
            width: "100%",
            opacity: animating ? 0 : 1,
            transform: animating ? "translateX(-12px)" : "translateX(0)",
            transition: "opacity 0.28s ease, transform 0.28s ease",
          }}
        >
          <div>
            {slide.headline.map((line, i) => (
              <p
                key={i}
                className="text-white font-extrabold leading-tight text-lg drop-shadow"
                style={{ fontSize: 18, lineHeight: 1.22 }}
              >
                {line}
              </p>
            ))}
          </div>

          {/* CTA Link */}
          <button
            className="flex items-center gap-1.5 self-start text-white/90 hover:text-white transition-colors text-xs font-semibold"
            data-testid={`hero-cta-${slideIdx}`}
          >
            <span>{slide.cta}</span>
            <ArrowRight size={13} strokeWidth={2.2} />
          </button>
        </div>

        {/* PAGINATION INDICATORS */}
        <div
          className="absolute bottom-2.5 left-0 right-0 flex items-center justify-center gap-1.5 z-20"
          role="tablist"
          aria-label="Banner slides"
        >
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === slideIdx}
              aria-label={`Slide ${i + 1}`}
              onClick={() => goToSlide(i)}
              style={{
                height: 4,
                width: i === slideIdx ? 18 : 5,
                borderRadius: 9999,
                background:
                  i === slideIdx ? "#ffffff" : "rgba(255,255,255,0.4)",
                transition: "width 0.3s ease, background 0.3s ease",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
