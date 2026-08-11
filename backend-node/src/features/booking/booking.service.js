'use strict';
/**
 * Booking service — creation, listing, status serialization, cancel, reschedule.
 * Equivalent to Python's app/services/booking_service.py
 */
const { getDb } = require('../../db/connection');
const { nowUtc, newId, genBookingCode, clean } = require('../../utils/security');
const { cartResponse, getOrCreateCart } = require('../cart/cart.service');

function httpError(status, msg) {
  const e = new Error(msg);
  e.statusCode = status;
  return e;
}

// ── Rich serializer ───────────────────────────────────────────────────────────

async function serializeBooking(b) {
  const db = getDb();

  // Items
  const items = await db.collection('booking_items').find({ booking_id: b.id }).toArray();
  const bItems = [];
  for (const i of items) {
    const svc = await db.collection('services').findOne({ id: i.service_id });
    bItems.push({ ...clean({ ...i }), service: svc ? clean({ ...svc }) : null });
  }

  const addr = await db.collection('addresses').findOne({ id: b.address_id });
  const needer = await db.collection('users').findOne({ id: b.service_needer_id });

  let providerInfo = null;
  if (b.provider_id) {
    const prof = await db.collection('provider_profiles').findOne({ id: b.provider_id });
    if (prof) {
      const pu = await db.collection('users').findOne({ id: prof.user_id });
      providerInfo = {
        id: prof.id,
        name: (pu || {}).name || 'Technician',
        phone: (pu || {}).phone,
        profile_photo_url: (pu || {}).profile_photo_url,
        average_rating: prof.average_rating || 0,
      };
    }
  }

  const history = await db.collection('booking_status_history')
    .find({ booking_id: b.id })
    .sort({ created_at: 1 })
    .toArray();
  const payment = await db.collection('payments').findOne({ booking_id: b.id });
  const review = await db.collection('reviews').findOne({ booking_id: b.id });

  return {
    ...clean({ ...b }),
    items: bItems,
    address: addr ? clean({ ...addr }) : null,
    service_needer: {
      name: (needer || {}).name,
      phone: (needer || {}).phone,
    },
    provider: providerInfo,
    status_history: history.map((h) => clean({ ...h })),
    payment: payment ? clean({ ...payment }) : null,
    review: review ? clean({ ...review }) : null,
  };
}

// ── Status history recorder ───────────────────────────────────────────────────

async function recordStatus(bookingId, status, userId, notes = '') {
  const db = getDb();
  await db.collection('booking_status_history').insertOne({
    id: newId(),
    booking_id: bookingId,
    status,
    changed_by: userId,
    notes,
    created_at: nowUtc(),
  });
}

// ── Provider dispatch ─────────────────────────────────────────────────────────

async function dispatchProvider(bookingId) {
  const db = getDb();
  const providers = await db.collection('provider_profiles').find({ status: 'approved' }).toArray();
  if (!providers.length) return null;

  const now = nowUtc();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

  for (const prof of providers) {
    await db.collection('job_assignment_requests').insertOne({
      id: newId(),
      booking_id: bookingId,
      provider_id: prof.id,
      status: 'pending',
      sent_at: now,
      responded_at: null,
      expires_at: expiresAt,
    });
    await db.collection('notifications').insertOne({
      id: newId(),
      user_id: prof.user_id,
      title: 'New job available',
      body: "Tap Jobs to accept before it's gone.",
      type: 'job_request',
      is_read: false,
      created_at: now,
    });
  }
  return providers;
}

// ── Create booking ────────────────────────────────────────────────────────────

async function createBookingService(body, user) {
  const db = getDb();
  const addr = await db.collection('addresses').findOne({ id: body.address_id, user_id: user.id });
  if (!addr) throw httpError(404, 'Address not found');

  const cartData = await cartResponse(user.id);
  if (!cartData.items.length) throw httpError(400, 'Cart is empty');

  const bookingId = newId();
  const bookingDoc = {
    id: bookingId,
    booking_code: genBookingCode(),
    service_needer_id: user.id,
    provider_id: null,
    address_id: body.address_id,
    scheduled_date: body.scheduled_date,
    scheduled_time_slot: body.scheduled_time_slot,
    notes: body.notes || null,
    status: 'pending',
    otp_code_hash: null,
    otp_attempts: 0,
    otp_verified_at: null,
    subtotal: cartData.subtotal,
    visit_charge: cartData.visit_charge,
    tax: cartData.tax,
    total_amount: cartData.total,
    payment_method: body.payment_method,
    payment_status: 'pending',
    cancelled_reason: null,
    cancelled_by: null,
    created_at: nowUtc(),
    updated_at: nowUtc(),
  };
  await db.collection('bookings').insertOne(bookingDoc);

  for (const it of cartData.items) {
    await db.collection('booking_items').insertOne({
      id: newId(),
      booking_id: bookingId,
      service_id: it.service_id,
      quantity: it.quantity,
      price: it.price_snapshot,
    });
  }

  await recordStatus(bookingId, 'pending', user.id, 'Booking created');

  await db.collection('notifications').insertOne({
    id: newId(),
    user_id: user.id,
    title: 'Booking confirmed',
    body: `Your booking ${bookingDoc.booking_code} is confirmed for ${body.scheduled_date}.`,
    type: 'booking_update',
    is_read: false,
    created_at: nowUtc(),
  });

  // Clear cart
  const cart = await getOrCreateCart(user.id);
  await db.collection('cart_items').deleteMany({ cart_id: cart.id });

  await dispatchProvider(bookingId);

  const fresh = await db.collection('bookings').findOne({ id: bookingId });
  return serializeBooking({ ...fresh });
}

// ── List bookings ─────────────────────────────────────────────────────────────

async function listBookingsService(scope, user) {
  const db = getDb();
  const q = {};

  if (user.role === 'service_needer') {
    q.service_needer_id = user.id;
  } else if (user.role === 'provider') {
    const prof = await db.collection('provider_profiles').findOne({ user_id: user.id });
    if (!prof) return [];
    q.provider_id = prof.id;
  }

  if (scope === 'upcoming') {
    q.status = { $nin: ['completed', 'cancelled'] };
  } else if (scope === 'past') {
    q.status = { $in: ['completed', 'cancelled'] };
  }

  const items = await db.collection('bookings').find(q).sort({ created_at: -1 }).toArray();
  return Promise.all(items.map((b) => serializeBooking({ ...b })));
}

// ── Get single booking ────────────────────────────────────────────────────────

async function getBookingService(bid, user) {
  const db = getDb();
  const b = await db.collection('bookings').findOne({ id: bid });
  if (!b) throw httpError(404, 'Booking not found');

  if (user.role === 'service_needer' && b.service_needer_id !== user.id) {
    throw httpError(403, 'Forbidden');
  }
  if (user.role === 'provider') {
    const prof = await db.collection('provider_profiles').findOne({ user_id: user.id });
    if (!prof || b.provider_id !== prof.id) throw httpError(403, 'Forbidden');
  }
  return serializeBooking({ ...b });
}

// ── Cancel booking ────────────────────────────────────────────────────────────

async function cancelBookingService(bid, body, user) {
  const db = getDb();
  const b = await db.collection('bookings').findOne({ id: bid });
  if (!b) throw httpError(404, 'Booking not found');
  if (user.role === 'service_needer' && b.service_needer_id !== user.id) throw httpError(403, 'Forbidden');
  if (['completed', 'cancelled'].includes(b.status)) {
    throw httpError(400, 'Cannot cancel a completed/cancelled booking');
  }

  const created = b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
  const ageMs = Date.now() - created.getTime();
  const reason = body.reason || 'User cancelled';

  await db.collection('bookings').updateOne(
    { id: bid },
    { $set: { status: 'cancelled', cancelled_by: user.id, cancelled_reason: reason, updated_at: nowUtc() } },
  );
  await recordStatus(bid, 'cancelled', user.id, reason);

  const fresh = await db.collection('bookings').findOne({ id: bid });
  return {
    booking: await serializeBooking({ ...fresh }),
    free_cancellation: ageMs <= 30 * 60 * 1000,
  };
}

// ── Reschedule booking ────────────────────────────────────────────────────────

async function rescheduleBookingService(bid, body, user) {
  const db = getDb();
  const b = await db.collection('bookings').findOne({ id: bid, service_needer_id: user.id });
  if (!b) throw httpError(404, 'Booking not found');
  if (['completed', 'cancelled', 'in_progress'].includes(b.status)) {
    throw httpError(400, 'Cannot reschedule this booking');
  }
  await db.collection('bookings').updateOne({ id: bid }, {
    $set: {
      scheduled_date: body.scheduled_date || b.scheduled_date,
      scheduled_time_slot: body.scheduled_time_slot || b.scheduled_time_slot,
      updated_at: nowUtc(),
    },
  });
  await recordStatus(bid, b.status, user.id, 'Rescheduled');
  const fresh = await db.collection('bookings').findOne({ id: bid });
  return serializeBooking({ ...fresh });
}

module.exports = {
  serializeBooking,
  recordStatus,
  dispatchProvider,
  createBookingService,
  listBookingsService,
  getBookingService,
  cancelBookingService,
  rescheduleBookingService,
};
