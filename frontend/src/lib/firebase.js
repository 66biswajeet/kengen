// Firebase Web SDK — Phone Auth for AquaServe.
// Only initialized when both the frontend env config AND the backend flag are present.
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

export function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

let _app = null;
export function getFirebaseApp() {
  if (!isFirebaseConfigured()) return null;
  if (!_app) {
    _app = getApps()[0] || initializeApp(firebaseConfig);
  }
  return _app;
}

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  return app ? getAuth(app) : null;
}

let _recaptchaVerifier = null;

/** Prepare an invisible reCAPTCHA verifier bound to a DOM element id (must exist). */
export function ensureRecaptcha(containerId = "aq-recaptcha") {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase is not configured");
  if (_recaptchaVerifier) return _recaptchaVerifier;
  _recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {},
  });
  return _recaptchaVerifier;
}

/** Send OTP via Firebase; returns a confirmationResult you can call .confirm(code) on. */
export async function firebaseSendOtp(phoneE164, containerId = "aq-recaptcha") {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase is not configured");
  const verifier = ensureRecaptcha(containerId);
  return signInWithPhoneNumber(auth, phoneE164, verifier);
}

/** Verify the OTP the user typed. Returns Firebase ID token on success. */
export async function firebaseConfirmOtp(confirmationResult, code) {
  const cred = await confirmationResult.confirm(code);
  const idToken = await cred.user.getIdToken();
  return { idToken, phone: cred.user.phoneNumber };
}
