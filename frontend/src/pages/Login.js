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
    <div
      className="app-shell relative min-h-screen flex flex-col justify-between"
      style={{ background: "#F8FAFC" }}
      data-testid="login-screen"
    >
      <div className="px-6 pt-12 pb-8 flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        {/* Phone Icon Badge */}
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4 shrink-0">
          <Phone size={18} className="text-primary" />
        </div>

        {/* Title & Description */}
        <h1 className="font-display text-lg font-bold text-charcoal tracking-tight">
          {stage === "phone" ? "Enter your mobile number" : "Verify your number"}
        </h1>
        <p className="text-slate/80 text-xs mt-1 mb-6 leading-relaxed">
          {stage === "phone"
            ? (useFirebase ? "You'll get a real SMS with a 6-digit code." : "We'll send you a one-time password to verify your number.")
            : `A 6-digit code was sent to +91 ${phone}. Enter it below.`}
        </p>

        {stage === "phone" ? (
          <>
            <div className="flex gap-2.5 mb-4">
              <div
                className="flex items-center justify-center bg-slate-100 border border-slate-200/80 rounded-xl font-bold text-slate-700 text-xs px-3"
                style={{ height: 44 }}
              >
                +91
              </div>
              <input
                data-testid="phone-input"
                inputMode="tel"
                autoFocus
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder:text-slate/50 font-medium focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 shadow-sm transition-all"
                style={{ height: 44 }}
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
              />
            </div>
            <button
              onClick={requestOtp}
              disabled={loading || phone.length < 10}
              className="w-full bg-primary text-white font-semibold text-xs rounded-xl py-3 px-4 flex items-center justify-center gap-2 shadow-sm hover:bg-primary/95 disabled:opacity-50 active:scale-[0.98] transition-all"
              data-testid="send-otp-btn"
            >
              {loading ? "Sending..." : (<>Send OTP <ArrowRight size={15} /></>)}
            </button>
          </>
        ) : (
          <>
            <div className="relative mb-3">
              <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate/50" />
              <input
                data-testid="otp-input"
                inputMode="numeric"
                autoFocus
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 tracking-[0.4em] text-center text-base font-bold text-charcoal placeholder:text-slate/40 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 shadow-sm transition-all"
                style={{ height: 44 }}
                placeholder="------"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
              />
            </div>
            <div className="text-[11px] text-slate/70 flex items-center justify-between px-1 mb-4">
              {useFirebase
                ? <span>Firebase SMS mode</span>
                : <span>Demo OTP: <span className="font-mono font-bold text-primary">123456</span></span>}
              {countdown > 0 ? (
                <span>Resend in 00:{String(countdown).padStart(2, "0")}</span>
              ) : (
                <button className="text-primary font-semibold hover:underline" onClick={requestOtp} data-testid="resend-otp-btn">Resend OTP</button>
              )}
            </div>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={verify}
                disabled={loading || otp.length < 4}
                className="w-full bg-primary text-white font-semibold text-xs rounded-xl py-3 px-4 flex items-center justify-center gap-2 shadow-sm hover:bg-primary/95 disabled:opacity-50 active:scale-[0.98] transition-all"
                data-testid="verify-otp-btn"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
              <button className="text-xs text-slate/70 font-medium hover:text-charcoal self-center py-1 transition-colors" onClick={() => setStage("phone")} data-testid="change-phone-btn">
                Change phone number
              </button>
            </div>
          </>
        )}

        {/* Divider */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="border-t border-slate-200/80 w-full" />
          <span className="bg-[#F8FAFC] px-3 text-[10px] uppercase text-slate/50 tracking-wider font-semibold absolute">
            Or continue with
          </span>
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={() => toast.info("Google Sign-In will be available soon. Please use Mobile Number to continue.")}
          className="w-full bg-white border border-slate-200 text-charcoal text-xs font-semibold rounded-xl py-3 px-4 flex items-center justify-center gap-2.5 shadow-sm hover:bg-slate-50 active:scale-[0.98] transition-all"
          data-testid="google-login-btn"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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

      {/* Footer */}
      <div className="pb-8 text-[10px] text-slate/60 text-center px-6">
        By continuing you agree to our <span className="underline cursor-pointer">Terms</span> & <span className="underline cursor-pointer">Privacy Policy</span>.
      </div>
    </div>
  );
}
