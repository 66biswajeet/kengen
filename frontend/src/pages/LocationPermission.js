import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, PenLine, Navigation, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import api, { apiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function LocationPermission() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [manual, setManual] = useState(false);
  const [addr, setAddr] = useState({ label: "Home", address_line: "", city: "", state: "", pincode: "" });
  const [busy, setBusy] = useState(false);

  const proceed = () => {
    if (user?.role === "provider") nav("/provider/jobs");
    else nav("/home");
  };

  const allowGeo = () => {
    if (!navigator.geolocation) {
      toast.info("Geolocation unavailable. Please enter address manually.");
      setManual(true);
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        localStorage.setItem("aq_loc", JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
        toast.success("Location captured");
        setBusy(false);
        if (user?.role === "service_needer") {
          try {
            let city = "Unknown City";
            let state = "Unknown State";
            let pincode = "";
            let addressLine = "Near me";

            try {
              const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&addressdetails=1`
              );
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData && geoData.address) {
                  const addrInfo = geoData.address;
                  city = addrInfo.city || addrInfo.town || addrInfo.village || addrInfo.suburb || addrInfo.county || "Unknown City";
                  state = addrInfo.state || "Unknown State";
                  pincode = addrInfo.postcode || "";
                  addressLine = geoData.display_name || "Near me";
                }
              }
            } catch (err) {
              console.error("Reverse geocoding failed", err);
            }

            await api.post("/addresses", {
              label: "Current Location",
              address_line: addressLine.slice(0, 120),
              city,
              state,
              pincode,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              is_default: true,
            });
          } catch (e) { /* non-blocking */ }
        }
        proceed();
      },
      () => { setBusy(false); toast.info("Please enter address manually."); setManual(true); },
      { timeout: 8000 }
    );
  };

  const saveManual = async () => {
    if (!addr.address_line || !addr.pincode) return toast.error("Please enter address and pincode");
    try {
      if (user?.role === "service_needer") {
        await api.post("/addresses", { ...addr, is_default: true });
      }
      proceed();
    } catch (e) { toast.error(apiError(e)); }
  };

  return (
    <div
      className="app-shell relative min-h-screen flex flex-col justify-between"
      style={{ background: "#F8FAFC" }}
      data-testid="location-screen"
    >
      <div className="px-6 pt-12 pb-8 flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        {/* MapPin Icon Badge */}
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4 shrink-0">
          <MapPin size={18} className="text-primary" />
        </div>

        {/* Title & Description */}
        <h1 className="font-display text-lg font-bold text-charcoal tracking-tight">
          Enable your location
        </h1>
        <p className="text-slate/80 text-xs mt-1 mb-6 leading-relaxed">
          We use your location to {user?.role === "provider" ? "assign nearby jobs" : "find technicians near you"} and deliver our service accurately.
        </p>

        {!manual ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={allowGeo}
              disabled={busy}
              className="w-full bg-primary text-white font-semibold text-xs rounded-xl py-3 px-4 flex items-center justify-center gap-2 shadow-sm hover:bg-primary/95 disabled:opacity-50 active:scale-[0.98] transition-all"
              data-testid="allow-loc-btn"
            >
              <Navigation size={14} className="fill-white/20" />
              {busy ? "Locating..." : "Allow Location Access"}
            </button>
            <button
              onClick={() => setManual(true)}
              className="text-xs text-slate/70 font-medium hover:text-charcoal self-center py-1 transition-colors flex items-center gap-1"
              data-testid="manual-loc-btn"
            >
              <PenLine size={13} /> Enter address manually
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder:text-slate/50 font-medium focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 shadow-sm transition-all"
              placeholder="Flat / Building / Street"
              value={addr.address_line}
              onChange={(e) => setAddr({ ...addr, address_line: e.target.value })}
              data-testid="addr-line-input"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <input
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder:text-slate/50 font-medium focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 shadow-sm transition-all"
                placeholder="City"
                value={addr.city}
                onChange={(e) => setAddr({ ...addr, city: e.target.value })}
                data-testid="addr-city-input"
              />
              <input
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder:text-slate/50 font-medium focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 shadow-sm transition-all"
                placeholder="Pincode"
                value={addr.pincode}
                onChange={(e) => setAddr({ ...addr, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                data-testid="addr-pincode-input"
              />
            </div>
            <button
              className="w-full bg-primary text-white font-semibold text-xs rounded-xl py-3 px-4 flex items-center justify-center gap-2 shadow-sm hover:bg-primary/95 active:scale-[0.98] transition-all mt-1"
              onClick={saveManual}
              data-testid="save-manual-loc-btn"
            >
              Save & Continue <ArrowRight size={14} />
            </button>
            <button
              className="text-xs text-slate/70 font-medium hover:text-charcoal self-center py-1 transition-colors"
              onClick={() => setManual(false)}
            >
              Use GPS location instead
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pb-8 text-[10px] text-slate/60 text-center px-6">
        By continuing you agree to our <span className="underline cursor-pointer">Terms</span> & <span className="underline cursor-pointer">Privacy Policy</span>.
      </div>
    </div>
  );
}
