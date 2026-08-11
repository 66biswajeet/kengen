import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, PenLine } from "lucide-react";
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
        // For clients, save an address for convenience
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
    <div className="app-shell" data-testid="location-screen">
      <div className="px-6 pt-12 pb-8">
        <div className="w-full h-56 rounded-card bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="grid grid-cols-8 gap-2 p-4">
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className="w-full h-6 bg-primary/40 rounded" />
              ))}
            </div>
          </div>
          <div className="relative flex flex-col items-center gap-2 z-10">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-2xl animate-pulse">
              <MapPin size={32} className="text-white fill-white/40" />
            </div>
            <span className="chip mt-2">Precise pickup point</span>
          </div>
        </div>

        <h1 className="font-display text-3xl font-semibold text-charcoal mt-8">Enable your location</h1>
        <p className="text-slate mt-2 mb-8">
          We use your location to {user?.role === "provider" ? "assign nearby jobs" : "find technicians near you"} and to accurately deliver our service.
        </p>

        {!manual ? (
          <div className="flex flex-col gap-3">
            <button onClick={allowGeo} disabled={busy} className="btn-accent" data-testid="allow-loc-btn">
              {busy ? "Locating..." : "Allow Location Access"}
            </button>
            <button onClick={() => setManual(true)} className="btn-ghost self-center" data-testid="manual-loc-btn">
              <PenLine size={14} className="inline mr-1" /> Enter address manually
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input className="input-field" placeholder="Flat / Building / Street" value={addr.address_line} onChange={(e) => setAddr({ ...addr, address_line: e.target.value })} data-testid="addr-line-input" />
            <div className="grid grid-cols-2 gap-3">
              <input className="input-field" placeholder="City" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} data-testid="addr-city-input" />
              <input className="input-field" placeholder="Pincode" value={addr.pincode} onChange={(e) => setAddr({ ...addr, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} data-testid="addr-pincode-input" />
            </div>
            <button className="btn-primary" onClick={saveManual} data-testid="save-manual-loc-btn">Save & Continue</button>
            <button className="btn-ghost self-center" onClick={() => setManual(false)}>Use location instead</button>
          </div>
        )}
      </div>
    </div>
  );
}
