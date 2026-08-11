import { useEffect, useState } from "react";
import api from "./api";

let cached = null;

/** Fetches the backend /config/public once and caches it. */
export function useAppConfig() {
  const [cfg, setCfg] = useState(cached);
  useEffect(() => {
    if (cached) return;
    api.get("/config/public").then(({ data }) => {
      cached = data;
      setCfg(data);
    }).catch(() => setCfg({ firebase_enabled: false, razorpay_enabled: false, cloudinary_enabled: false }));
  }, []);
  return cfg;
}

/** Upload a File to Cloudinary via unsigned preset if configured, else return a local blob URL (mock). */
export async function uploadImage(file) {
  const cloud = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
  if (cloud && preset) {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", preset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: form });
    if (!res.ok) throw new Error("Cloudinary upload failed");
    const data = await res.json();
    return { url: data.secure_url, mode: "live" };
  }
  // Mock: use local object URL. Backend accepts arbitrary URL strings.
  const url = URL.createObjectURL(file);
  return { url, mode: "mock" };
}

/** Load Razorpay Checkout script once. */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}
