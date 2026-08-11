'use strict';
/**
 * Review service — submit review and recalculate provider average rating.
 * Equivalent to Python's app/services/review_service.py
 */
const { getDb } = require('../../db/connection');
const { nowUtc, newId, clean } = require('../../utils/security');

function httpError(status, msg) {
  const e = new Error(msg);
  e.statusCode = status;
  return e;
}

async function submitReviewService(bid, body, user) {
  const db = getDb();
  const b = await db.collection('bookings').findOne({ id: bid, service_needer_id: user.id });
  if (!b) throw httpError(404, 'Booking not found');
  if (b.status !== 'completed') throw httpError(400, 'Can only review completed bookings');

  const existing = await db.collection('reviews').findOne({ booking_id: bid });
  if (existing) throw httpError(400, 'Review already submitted');

  const r = {
    id: newId(),
    booking_id: bid,
    service_needer_id: user.id,
    provider_id: b.provider_id,
    rating: body.rating,
    comment: body.comment || null,
    tags: body.tags || [],
    created_at: nowUtc(),
  };
  await db.collection('reviews').insertOne(r);

  for (const url of (body.image_urls || [])) {
    await db.collection('review_images').insertOne({ id: newId(), review_id: r.id, image_url: url });
  }

  // Recalculate provider average rating
  const reviews = await db.collection('reviews').find({ provider_id: b.provider_id }).toArray();
  const avg = reviews.length
    ? Math.round(reviews.reduce((sum, x) => sum + x.rating, 0) / reviews.length * 100) / 100
    : 0;
  await db.collection('provider_profiles').updateOne(
    { id: b.provider_id },
    { $set: { average_rating: avg } },
  );

  return clean({ ...r });
}

module.exports = { submitReviewService };
