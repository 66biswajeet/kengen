'use strict';
/**
 * Auth service — OTP flow, admin login, token refresh, me, logout.
 * Equivalent to Python's app/services/auth_service.py
 */
const { getDb } = require('../../db/connection');
const { FIREBASE_PROJECT_ID, OTP_STATIC_MOCK, DEFAULT_COMMISSION_PCT } = require('../../config');
const {
  nowUtc, newId, hashOtp, verifyPassword,
  createToken, decodeToken, clean,
  verifyFirebaseIdToken,
} = require('../../utils/security');

function httpError(status, msg) {
  const e = new Error(msg);
  e.statusCode = status;
  return e;
}

function normalizePhone(p) {
  if (!p) return p;
  const digits = String(p).replace(/\D/g, '');
  if (digits.length === 10) return '+91' + digits;
  if (digits.length === 12 && digits.startsWith('91')) return '+' + digits;
  return String(p).startsWith('+') ? String(p) : '+' + String(p);
}

// ── OTP Request ───────────────────────────────────────────────────────────────

async function otpRequestService(body) {
  const phoneNorm = normalizePhone(body.phone);
  if (FIREBASE_PROJECT_ID) {
    return { ok: true, mode: 'firebase', phone: phoneNorm };
  }
  const db = getDb();
  const otp = OTP_STATIC_MOCK;
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await db.collection('otp_verifications').insertOne({
    id: newId(),
    phone: phoneNorm,
    otp_code_hash: hashOtp(otp),
    expires_at: expiresAt,
    is_verified: false,
    created_at: nowUtc(),
  });
  return { ok: true, mode: 'mock', message: 'OTP sent (mocked)', mock_otp: otp, phone: phoneNorm };
}

// ── OTP Verify ────────────────────────────────────────────────────────────────

async function otpVerifyService(body) {
  const db = getDb();
  const phoneNorm = normalizePhone(body.phone);

  // Path A: Firebase ID token
  if (FIREBASE_PROJECT_ID && body.firebase_id_token) {
    const claims = await verifyFirebaseIdToken(body.firebase_id_token);
    const fbPhone = claims.phone_number;
    if (!fbPhone) throw httpError(400, 'Firebase token has no phone number');
    body.phone = normalizePhone(fbPhone);
  } else {
    // Path B: Mock or DB-stored OTP
    if (!body.otp) throw httpError(400, 'OTP is required when Firebase is not used');
    if (body.otp !== OTP_STATIC_MOCK) {
      const rec = await db.collection('otp_verifications').findOne(
        {
          $or: [{ phone: phoneNorm }, { phone: body.phone }],
          otp_code_hash: hashOtp(body.otp),
          is_verified: false,
        },
        { sort: { created_at: -1 } },
      );
      if (!rec || rec.expires_at < nowUtc()) {
        throw httpError(400, 'Invalid or expired OTP');
      }
      await db.collection('otp_verifications').updateOne(
        { id: rec.id },
        { $set: { is_verified: true } },
      );
    }
  }

  let user = await db.collection('users').findOne({
    $or: [{ phone: phoneNorm }, { phone: body.phone }]
  });
  let isNew = false;

  if (!user) {
    isNew = true;
    const userId = newId();
    const userDoc = {
      id: userId,
      role: body.role,
      phone: phoneNorm,
      email: body.email || null,
      name: body.name || '',
      profile_photo_url: null,
      is_active: true,
      created_at: nowUtc(),
      updated_at: nowUtc(),
    };
    await db.collection('users').insertOne(userDoc);
    user = userDoc;

    if (body.role === 'provider') {
      await db.collection('provider_profiles').insertOne({
        id: newId(),
        user_id: userId,
        status: 'approved', // MVP: auto-approve
        service_area_locality: body.service_area_locality || '',
        service_radius_km: body.service_radius_km || 10.0,
        id_proof_url: null,
        commission_percentage: DEFAULT_COMMISSION_PCT,
        is_online: false,
        current_latitude: null,
        current_longitude: null,
        average_rating: 0,
        total_jobs_completed: 0,
        approved_by: null,
        approved_at: nowUtc(),
        category_ids: body.category_ids || [],
        created_at: nowUtc(),
        updated_at: nowUtc(),
      });
    }
  } else {
    // Update missing fields for returning users
    const updates = {};
    if (body.name && !user.name) updates.name = body.name;
    if (body.email && !user.email) updates.email = body.email;
    if (Object.keys(updates).length > 0) {
      updates.updated_at = nowUtc();
      await db.collection('users').updateOne({ id: user.id }, { $set: updates });
      Object.assign(user, updates);
    }
  }

  const hasLocation = await checkUserHasLocation(db, user);

  const access = createToken(user.id, user.role, 'access');
  const refresh = createToken(user.id, user.role, 'refresh');
  const cleanUser = clean({ ...user, has_location: hasLocation });

  return {
    access_token: access,
    refresh_token: refresh,
    token_type: 'bearer',
    user: cleanUser,
    is_new_user: isNew,
    has_location: hasLocation,
  };
}

// Helper to check if user already has location/address stored in DB
async function checkUserHasLocation(db, user) {
  if (!user || !user.id) return false;
  const addr = await db.collection('addresses').findOne({ user_id: user.id });
  if (addr) return true;

  if (user.role === 'provider') {
    const prof = await db.collection('provider_profiles').findOne({ user_id: user.id });
    if (prof && (prof.service_area_locality || (prof.current_latitude && prof.current_longitude))) {
      return true;
    }
  }
  return false;
}

// ── Admin Login ───────────────────────────────────────────────────────────────

async function adminLoginService(body) {
  const db = getDb();
  const user = await db.collection('users').findOne({ email: body.email.toLowerCase(), role: 'admin' });
  if (!user || !(await verifyPassword(body.password, user.password_hash || ''))) {
    throw httpError(401, 'Invalid credentials');
  }
  const access = createToken(user.id, 'admin', 'access');
  const refresh = createToken(user.id, 'admin', 'refresh');
  return {
    access_token: access,
    refresh_token: refresh,
    token_type: 'bearer',
    user: clean({ ...user }),
  };
}

// ── Refresh Token ─────────────────────────────────────────────────────────────

async function refreshTokenService(body) {
  const tok = body.refresh_token;
  if (!tok) throw httpError(400, 'refresh_token required');
  let payload;
  try {
    payload = decodeToken(tok);
  } catch {
    throw httpError(401, 'Invalid refresh token');
  }
  if (payload.type !== 'refresh') throw httpError(401, 'Invalid token type');
  const access = createToken(payload.sub, payload.role, 'access');
  return { access_token: access, token_type: 'bearer' };
}

// ── Get Me ────────────────────────────────────────────────────────────────────

async function getMeService(user) {
  const db = getDb();
  if (user.role === 'provider') {
    const prof = await db.collection('provider_profiles').findOne({ user_id: user.id });
    user.provider_profile = prof ? clean({ ...prof }) : null;
  }
  user.has_location = await checkUserHasLocation(db, user);
  return user;
}

// ── Logout ────────────────────────────────────────────────────────────────────

async function logoutService() {
  return { ok: true };
}

module.exports = {
  otpRequestService,
  otpVerifyService,
  adminLoginService,
  refreshTokenService,
  getMeService,
  logoutService,
};
