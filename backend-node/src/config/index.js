'use strict';
/**
 * AquaServe — centralised configuration.
 * All environment variables and application-wide constants live here.
 * Equivalent to Python's app/core/config.py
 */
require('dotenv').config();

// ── Database ─────────────────────────────────────────────────────────────────
const MONGO_URL = process.env.MONGO_URL;
if (!MONGO_URL) throw new Error('MONGO_URL environment variable is required');

const DB_NAME = process.env.DB_NAME;

// ── Auth ──────────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');

const JWT_ALG = 'HS256';
const ACCESS_TTL_MIN = parseInt(process.env.ACCESS_TTL_MIN || '1440', 10);  // 24h
const REFRESH_TTL_DAYS = parseInt(process.env.REFRESH_TTL_DAYS || '30', 10);

// ── Admin credentials (seeded on first startup) ───────────────────────────────
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@aquaserve.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12345';

// ── 3rd-party integrations (env-gated: real when keys present, mocked otherwise)
const FIREBASE_PROJECT_ID = (process.env.FIREBASE_PROJECT_ID || '').trim();
const RAZORPAY_KEY_ID = (process.env.RAZORPAY_KEY_ID || '').trim();
const RAZORPAY_KEY_SECRET = (process.env.RAZORPAY_KEY_SECRET || '').trim();
const CLOUDINARY_URL = (process.env.CLOUDINARY_URL || '').trim();
const CLOUDINARY_UPLOAD_PRESET = (process.env.CLOUDINARY_UPLOAD_PRESET || '').trim();

// ── Business constants ────────────────────────────────────────────────────────
const OTP_STATIC_MOCK = '123456';   // Any phone accepts this OTP in mock mode
const VISIT_CHARGE = 49.0;
const TAX_PCT = 0.05;
const DEFAULT_COMMISSION_PCT = 20.0;

// ── Server ────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '8000', 10);

module.exports = {
  MONGO_URL,
  DB_NAME,
  JWT_SECRET,
  JWT_ALG,
  ACCESS_TTL_MIN,
  REFRESH_TTL_DAYS,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  FIREBASE_PROJECT_ID,
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  CLOUDINARY_URL,
  CLOUDINARY_UPLOAD_PRESET,
  OTP_STATIC_MOCK,
  VISIT_CHARGE,
  TAX_PCT,
  DEFAULT_COMMISSION_PCT,
  PORT,
};
