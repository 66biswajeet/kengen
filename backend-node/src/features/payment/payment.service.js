'use strict';
/**
 * Payment service — COD collection, UPI confirmation, QR generation, Razorpay verify.
 * Equivalent to Python's app/services/payment_service.py
 */
const { getDb } = require('../../db/connection');
const { RAZORPAY_KEY_ID, CLOUDINARY_URL } = require('../../config');
const { nowUtc, newId, clean, getRazorpayClient } = require('../../utils/security');

function httpError(status, msg) {
  const e = new Error(msg);
  e.statusCode = status;
  return e;
}

async function collectCodService(bid, user) {
  const db = getDb();
  const b = await db.collection('bookings').findOne({ id: bid });
  if (!b) throw httpError(404, 'Booking not found');

  await db.collection('payments').insertOne({
    id: newId(),
    booking_id: bid,
    amount: parseFloat(b.total_amount),
    method: 'cod',
    transaction_id: null,
    status: 'paid',
    collected_by: user.id,
    paid_at: nowUtc(),
  });
  await db.collection('bookings').updateOne(
    { id: bid },
    { $set: { payment_status: 'paid', updated_at: nowUtc() } },
  );
  return { ok: true };
}

async function confirmUpiService(bid, user) {
  const db = getDb();
  const b = await db.collection('bookings').findOne({ id: bid });
  if (!b) throw httpError(404, 'Booking not found');

  const txn = 'MOCK-UPI-' + newId().slice(0, 8).toUpperCase();
  await db.collection('payments').insertOne({
    id: newId(),
    booking_id: bid,
    amount: parseFloat(b.total_amount),
    method: 'upi',
    transaction_id: txn,
    status: 'paid',
    collected_by: user.id,
    paid_at: nowUtc(),
  });
  await db.collection('bookings').updateOne(
    { id: bid },
    { $set: { payment_status: 'paid', updated_at: nowUtc() } },
  );
  return { ok: true, transaction_id: txn };
}

async function upiQrService(bid, user) {
  const db = getDb();
  const b = await db.collection('bookings').findOne({ id: bid });
  if (!b) throw httpError(404, 'Booking not found');

  const amount = parseFloat(b.total_amount);
  const rzp = getRazorpayClient();

  if (rzp) {
    try {
      const order = await rzp.orders.create({
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: b.booking_code,
        notes: { booking_id: bid, booking_code: b.booking_code },
      });
      return {
        provider: 'razorpay',
        mode: 'live',
        amount,
        currency: 'INR',
        booking_code: b.booking_code,
        razorpay_order_id: order.id,
        razorpay_key_id: RAZORPAY_KEY_ID,
      };
    } catch (e) {
      throw httpError(502, `Razorpay order create failed: ${e.message}`);
    }
  }

  const upiString = `upi://pay?pa=aquaserve@razorpay&pn=AquaServe&am=${amount.toFixed(2)}&cu=INR&tn=Booking-${b.booking_code}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(upiString)}`;
  return {
    provider: 'razorpay_mock',
    mode: 'mock',
    amount,
    currency: 'INR',
    upi_string: upiString,
    qr_image_url: qrUrl,
    booking_code: b.booking_code,
  };
}

async function razorpayVerifyService(bid, body, user) {
  const rzp = getRazorpayClient();
  if (!rzp) throw httpError(400, 'Razorpay not configured');

  try {
    rzp.utility.verifyPaymentSignature({
      razorpay_order_id: body.razorpay_order_id,
      razorpay_payment_id: body.razorpay_payment_id,
      razorpay_signature: body.razorpay_signature,
    });
  } catch (e) {
    throw httpError(400, `Signature verification failed: ${e.message}`);
  }

  const db = getDb();
  const b = await db.collection('bookings').findOne({ id: bid });
  if (!b) throw httpError(404, 'Booking not found');

  await db.collection('payments').insertOne({
    id: newId(),
    booking_id: bid,
    amount: parseFloat(b.total_amount),
    method: 'upi',
    transaction_id: body.razorpay_payment_id,
    razorpay_order_id: body.razorpay_order_id,
    status: 'paid',
    collected_by: user.id,
    paid_at: nowUtc(),
  });
  await db.collection('bookings').updateOne(
    { id: bid },
    { $set: { payment_status: 'paid', updated_at: nowUtc() } },
  );
  return { ok: true, verified: true };
}

async function bookingPaymentService(bid, user) {
  const db = getDb();
  const p = await db.collection('payments').findOne({ booking_id: bid });
  if (!p) return { status: 'pending' };
  return clean({ ...p });
}

module.exports = {
  collectCodService,
  confirmUpiService,
  upiQrService,
  razorpayVerifyService,
  bookingPaymentService,
};
