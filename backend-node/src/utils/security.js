'use strict';
/**
 * AquaServe — security utilities.
 * Covers: JWT, bcrypt, OTP hashing, Firebase ID-token verification,
 * and lazy third-party client factories (Razorpay, Cloudinary).
 * Equivalent to Python's app/core/security.py
 */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const {
  JWT_SECRET, JWT_ALG,
  ACCESS_TTL_MIN, REFRESH_TTL_DAYS,
  FIREBASE_PROJECT_ID,
  RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET,
  CLOUDINARY_URL,
} = require('../config');

// ── General utilities ─────────────────────────────────────────────────────────

function nowUtc() {
  return new Date();
}

function newId() {
  return uuidv4();
}

function genOtp() {
  // 4-digit numeric OTP
  return String(Math.floor(1000 + Math.random() * 9000));
}

function genBookingCode() {
  const digits = String(Math.floor(100000 + Math.random() * 900000));
  return 'AQS-' + digits;
}

/**
 * Strip _id and sensitive fields before sending to API consumers.
 */
function clean(doc) {
  if (!doc) return doc;
  const d = { ...doc };
  delete d._id;
  delete d.password_hash;
  delete d.otp_code_hash;
  return d;
}

// ── Password helpers ──────────────────────────────────────────────────────────

async function hashPassword(pw) {
  return bcrypt.hash(pw, 10);
}

async function verifyPassword(pw, hashed) {
  try {
    return await bcrypt.compare(pw, hashed || '');
  } catch {
    return false;
  }
}

// ── OTP helpers ───────────────────────────────────────────────────────────────

function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

// ── JWT helpers ───────────────────────────────────────────────────────────────

function createToken(sub, role, kind = 'access') {
  const expiresIn = kind === 'access'
    ? ACCESS_TTL_MIN * 60          // seconds
    : REFRESH_TTL_DAYS * 24 * 3600;
  return jwt.sign({ sub, role, type: kind }, JWT_SECRET, {
    algorithm: JWT_ALG,
    expiresIn,
  });
}

function decodeToken(token) {
  return jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALG] });
}

// ── Firebase ID-token verification ────────────────────────────────────────────

let _firebaseApp = null;

function _getFirebaseApp() {
  if (_firebaseApp) return _firebaseApp;
  if (!FIREBASE_PROJECT_ID) return null;
  try {
    const admin = require('firebase-admin');
    if (admin.apps.length === 0) {
      admin.initializeApp({ projectId: FIREBASE_PROJECT_ID });
    }
    _firebaseApp = admin.apps[0] || admin.app();
  } catch (e) {
    console.warn('[Firebase] firebase-admin not available:', e.message);
    _firebaseApp = null;
  }
  return _firebaseApp;
}

async function verifyFirebaseIdToken(idToken) {
  if (!FIREBASE_PROJECT_ID) {
    const err = new Error('Firebase not configured on the server');
    err.statusCode = 400;
    throw err;
  }
  const app = _getFirebaseApp();
  if (!app) {
    const err = new Error('Firebase admin SDK unavailable');
    err.statusCode = 500;
    throw err;
  }
  const admin = require('firebase-admin');
  try {
    const claims = await admin.auth(app).verifyIdToken(idToken);
    return claims;
  } catch (e) {
    const err = new Error('Invalid Firebase ID token: ' + e.message);
    err.statusCode = 400;
    throw err;
  }
}

// ── Lazy third-party client factories ─────────────────────────────────────────

let _razorpayClient = null;

function getRazorpayClient() {
  if (_razorpayClient) return _razorpayClient;
  if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
    const Razorpay = require('razorpay');
    _razorpayClient = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpayClient;
}

function cloudinaryConfigured() {
  return Boolean(CLOUDINARY_URL);
}

module.exports = {
  nowUtc,
  newId,
  genOtp,
  genBookingCode,
  clean,
  hashPassword,
  verifyPassword,
  hashOtp,
  createToken,
  decodeToken,
  verifyFirebaseIdToken,
  getRazorpayClient,
  cloudinaryConfigured,
};
