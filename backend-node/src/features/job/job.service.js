'use strict';
/**
 * Job dispatch service — accept, reject, advance status, OTP verification.
 * Equivalent to Python's app/services/job_service.py
 */
const { getDb } = require('../../db/connection');
const { getDefaultCommissionPct } = require('../../utils/helpers');
const { nowUtc, newId, genOtp, hashOtp, clean } = require('../../utils/security');
const { serializeBooking, recordStatus } = require('../booking/booking.service');

function httpError(status, msg) {
  const e = new Error(msg);
  e.statusCode = status;
  return e;
}

const STATUS_ORDER = ['pending', 'provider_assigned', 'on_the_way', 'arrived', 'in_progress', 'completed'];

// ── Provider job requests ─────────────────────────────────────────────────────

async function providerJobRequestsService(user) {
  const db = getDb();
  const prof = await db.collection('provider_profiles').findOne({ user_id: user.id });
  if (!prof) return [];

  const reqs = await db.collection('job_assignment_requests')
    .find({ provider_id: prof.id, status: 'pending' })
    .toArray();

  const out = [];
  for (const r of reqs) {
    const b = await db.collection('bookings').findOne({ id: r.booking_id });
    if (b && !b.provider_id) {
      out.push({ request: clean({ ...r }), booking: await serializeBooking({ ...b }) });
    }
  }
  return out;
}

// ── Accept job ────────────────────────────────────────────────────────────────

async function acceptJobService(bid, user) {
  const db = getDb();
  const prof = await db.collection('provider_profiles').findOne({ user_id: user.id });
  if (!prof) throw httpError(404, 'Provider profile not found');

  const otp = genOtp();

  // Atomic: only succeed if booking is still unassigned and pending
  const claimed = await db.collection('bookings').findOneAndUpdate(
    { id: bid, provider_id: null, status: 'pending' },
    {
      $set: {
        provider_id: prof.id,
        status: 'provider_assigned',
        otp_code_hash: hashOtp(otp),
        otp_plain_for_client: otp,
        otp_attempts: 0,
        updated_at: nowUtc(),
      },
    },
    { returnDocument: 'after' },
  );

  if (!claimed) {
    // Someone else grabbed it first
    await db.collection('job_assignment_requests').updateOne(
      { booking_id: bid, provider_id: prof.id },
      { $set: { status: 'expired', responded_at: nowUtc() } },
    );
    throw httpError(409, 'This job has already been taken by another provider');
  }

  // Mark this request accepted
  await db.collection('job_assignment_requests').updateOne(
    { booking_id: bid, provider_id: prof.id },
    { $set: { status: 'accepted', responded_at: nowUtc() } },
  );
  // Expire all other pending requests for this booking
  await db.collection('job_assignment_requests').updateMany(
    { booking_id: bid, provider_id: { $ne: prof.id }, status: 'pending' },
    { $set: { status: 'expired', responded_at: nowUtc() } },
  );

  await recordStatus(bid, 'provider_assigned', user.id, 'Accepted by provider');

  const b = await db.collection('bookings').findOne({ id: bid });
  if (b) {
    await db.collection('notifications').insertOne({
      id: newId(),
      user_id: b.service_needer_id,
      title: 'Technician assigned',
      body: `${user.name || 'A technician'} accepted your booking.`,
      type: 'booking_update',
      is_read: false,
      created_at: nowUtc(),
    });
  }
  return { ok: true };
}

// ── Reject job ────────────────────────────────────────────────────────────────

async function rejectJobService(bid, user) {
  const db = getDb();
  const prof = await db.collection('provider_profiles').findOne({ user_id: user.id });
  if (!prof) throw httpError(404, 'Provider profile not found');

  await db.collection('job_assignment_requests').updateOne(
    { booking_id: bid, provider_id: prof.id, status: 'pending' },
    { $set: { status: 'rejected', responded_at: nowUtc() } },
  );
  return { ok: true };
}

// ── Advance status ────────────────────────────────────────────────────────────

async function advanceStatusService(bid, body, user) {
  const db = getDb();
  const prof = await db.collection('provider_profiles').findOne({ user_id: user.id });
  const b = await db.collection('bookings').findOne({ id: bid });

  if (!b || (prof && b.provider_id !== prof.id)) throw httpError(404, 'Booking not found');

  const curIdx = STATUS_ORDER.indexOf(b.status);
  const targetIdx = STATUS_ORDER.indexOf(body.status);
  if (targetIdx < 0) throw httpError(400, 'Invalid status');
  if (targetIdx <= curIdx) throw httpError(400, 'Cannot move status backward');
  if (body.status === 'in_progress' && !b.otp_verified_at) {
    throw httpError(400, 'OTP verification required before starting service');
  }

  await db.collection('bookings').updateOne(
    { id: bid },
    { $set: { status: body.status, updated_at: nowUtc() } },
  );
  await recordStatus(bid, body.status, user.id);

  if (body.status === 'completed') {
    const prof2 = await db.collection('provider_profiles').findOne({ id: b.provider_id });
    const defaultComm = await getDefaultCommissionPct();
    const rate = parseFloat((prof2 || {}).commission_percentage || defaultComm);
    const serviceAmount = parseFloat(b.total_amount);
    const commission = Math.round(serviceAmount * rate / 100 * 100) / 100;
    const payout = Math.round((serviceAmount - commission) * 100) / 100;

    await db.collection('commission_ledger').insertOne({
      id: newId(),
      booking_id: bid,
      provider_id: b.provider_id,
      service_amount: serviceAmount,
      commission_percentage: rate,
      platform_commission_amount: commission,
      provider_payout_amount: payout,
      payout_status: 'pending',
      payment_method: b.payment_method || 'cod',
      created_at: nowUtc(),
    });
    await db.collection('provider_profiles').updateOne(
      { id: b.provider_id },
      { $inc: { total_jobs_completed: 1 } },
    );
    await db.collection('notifications').insertOne({
      id: newId(),
      user_id: b.service_needer_id,
      title: 'Service completed',
      body: 'Please rate your experience.',
      type: 'booking_update',
      is_read: false,
      created_at: nowUtc(),
    });
  }

  const fresh = await db.collection('bookings').findOne({ id: bid });
  return serializeBooking({ ...fresh });
}

// ── Verify booking OTP ────────────────────────────────────────────────────────

async function verifyBookingOtpService(bid, body, user) {
  const db = getDb();
  const b = await db.collection('bookings').findOne({ id: bid });
  if (!b) throw httpError(404, 'Booking not found');
  if ((b.otp_attempts || 0) >= 3) throw httpError(400, 'Max OTP attempts exceeded — please resend a new OTP');
  if (!b.otp_code_hash) throw httpError(400, 'No OTP generated for this booking');

  if (hashOtp(body.otp) !== b.otp_code_hash) {
    await db.collection('bookings').updateOne({ id: bid }, { $inc: { otp_attempts: 1 } });
    const remaining = 2 - (b.otp_attempts || 0);
    throw httpError(400, `Invalid OTP. ${remaining} attempt(s) left`);
  }
  await db.collection('bookings').updateOne(
    { id: bid },
    { $set: { otp_verified_at: nowUtc(), otp_attempts: 0 } },
  );
  return { ok: true, verified: true };
}

// ── Resend booking OTP ────────────────────────────────────────────────────────

async function resendBookingOtpService(bid, user) {
  const db = getDb();
  const b = await db.collection('bookings').findOne({ id: bid, service_needer_id: user.id });
  if (!b) throw httpError(404, 'Booking not found');

  const otp = genOtp();
  await db.collection('bookings').updateOne(
    { id: bid },
    { $set: { otp_code_hash: hashOtp(otp), otp_plain_for_client: otp, otp_attempts: 0 } },
  );
  return { ok: true, otp };
}

module.exports = {
  providerJobRequestsService,
  acceptJobService,
  rejectJobService,
  advanceStatusService,
  verifyBookingOtpService,
  resendBookingOtpService,
};
