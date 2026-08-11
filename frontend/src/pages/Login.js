import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, ArrowRight, KeyRound } from "lucide-react";
import { toast } from "sonner";
import api, { apiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useAppConfig } from "../lib/integrations";
import { firebaseSendOtp, firebaseConfirmOtp, isFirebaseConfigured } from "../lib/firebase";

export default function Login() {
  const nav = useNavigate();
  const { role, applyTokens } = useAuth();
  const cfg = useAppConfig();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState("phone");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [confirmation, setConfirmation] = useState(null);
  const useFirebase = cfg?.firebase_enabled && isFirebaseConfigured();

  useEffect(() => { if (!role) nav("/role"); }, [role, nav]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const requestOtp = async () => {
    if (phone.replace(/\D/g, "").length < 10) return toast.error("Enter a valid 10-digit phone number");
    setLoading(true);
    try {
      const e164 = "+91" + phone;
      if (useFirebase) {
        const conf = await firebaseSendOtp(e164, "aq-recaptcha");
        setConfirmation(conf);
        toast.success(`OTP sent via SMS to ${e164}`);
      } else {
        const { data } = await api.post("/auth/otp/request", { phone: e164, role });
        if (data.mode === "mock") toast.success(`OTP sent (demo mode). Use ${data.mock_otp}.`);
        else toast.success(`OTP sent to ${data.phone}`);
      }
      setStage("otp");
      setCountdown(30);
    } catch (e) { toast.error(e?.message || apiError(e)); }
    finally { setLoading(false); }
  };

  const verify = async () => {
    if (otp.length < 4) return toast.error("Enter the OTP");
    setLoading(true);
    try {
      const e164 = phone.startsWith("+") ? phone : "+91" + phone;
      let payload = { phone: e164, role };
      if (useFirebase && confirmation) {
        const { idToken, phone: fbPhone } = await firebaseConfirmOtp(confirmation, otp);
        payload = { phone: fbPhone || `+91${phone}`, firebase_id_token: idToken, role };
      } else {
        payload.otp = otp;
      }
      const { data } = await api.post("/auth/otp/verify", payload);
      applyTokens(data);
      toast.success("Verified");
      if (data.is_new_user) {
        nav("/register");
      } else if (data.has_location || data.user?.has_location) {
        if (data.user?.role === "provider" || role === "provider") nav("/provider/jobs");
        else nav("/home");
      } else {
        nav("/location");
      }
    } catch (e) { toast.error(e?.message || apiError(e)); }
    finally { setLoading(false); }
  };

  return (
    <div className="app-shell" data-testid="login-screen">
      {/* 30% height top illustration banner */}
      <div className="w-full h-[30vh] min-h-[220px] relative overflow-hidden flex items-center justify-center bg-slate-100">
        <img
          src="/login_illustration.png"
          alt="AquaServe Login Illustration"
          className="w-full h-full object-cover object-center"
        />
      </div>

      <div className="px-6 pt-6 pb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Phone size={22} className="text-primary" />
        </div>
        <h1 className="font-display text-3xl font-semibold text-charcoal">
          {stage === "phone" ? "Enter your mobile number" : "Verify your number"}
        </h1>
        <p className="text-slate mt-2 mb-8">
          {stage === "phone"
            ? (useFirebase ? "You'll get a real SMS with a 6-digit code." : "We'll send you a one-time password on your whatsapp to verify.")
            : `A 6-digit code was sent to +91 ${phone}. Enter it below.`}
        </p>

        {stage === "phone" ? (
          <>
            <div className="flex gap-3 mb-4">
              <div
                className="flex items-center justify-center bg-primary/5 border border-gray-200 rounded-xl font-semibold text-primary"
                style={{ width: "64px", minWidth: "64px", flexShrink: 0 }}
              >
                +91
              </div>
              <input
                data-testid="phone-input"
                inputMode="tel"
                autoFocus
                className="input-field flex-1 tracking-wider"
                style={{ width: "auto", minWidth: 0 }}
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
              />
            </div>
            <button
              onClick={requestOtp}
              disabled={loading || phone.length < 10}
              className="btn-primary"
              data-testid="send-otp-btn"
            >
              {loading ? "Sending..." : (<>Send OTP <ArrowRight size={18} /></>)}
            </button>
          </>
        ) : (
          <>
            <div className="relative">
              <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
              <input
                data-testid="otp-input"
                inputMode="numeric"
                autoFocus
                className="input-field pl-11 tracking-[0.5em] text-center text-lg font-semibold"
                placeholder="——————"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
              />
            </div>
            <div className="mt-3 text-sm text-slate flex items-center justify-between">
              {useFirebase
                ? <span className="text-xs">Firebase SMS mode</span>
                : <span>Demo OTP: <span className="font-mono font-semibold text-primary">123456</span></span>}
              {countdown > 0 ? (
                <span>Resend in 00:{String(countdown).padStart(2, "0")}</span>
              ) : (
                <button className="btn-ghost !p-0" onClick={requestOtp} data-testid="resend-otp-btn">Resend OTP</button>
              )}
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={verify}
                disabled={loading || otp.length < 4}
                className="btn-primary"
                data-testid="verify-otp-btn"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
              <button className="btn-ghost self-center" onClick={() => setStage("phone")} data-testid="change-phone-btn">Change phone number</button>
            </div>
          </>
        )}
        <div className="relative my-6 flex items-center justify-center">
          <div className="border-t border-gray-200 w-full"></div>
          <span className="bg-[#F4F7FA] px-3 text-xs uppercase text-slate tracking-wider font-semibold absolute">
            Or continue with
          </span>
        </div>

        <button
          type="button"
          onClick={() => toast.info("Google Sign-In will be available soon. Please use Mobile Number to continue.")}
          className="w-full bg-white border border-gray-200 text-charcoal font-semibold rounded-xl py-3.5 px-4 flex items-center justify-center gap-3 shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all"
          data-testid="google-login-btn"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Invisible reCAPTCHA anchor for Firebase — must exist in DOM */}
        <div id="aq-recaptcha" />
      </div>
    </div>
  );
}
