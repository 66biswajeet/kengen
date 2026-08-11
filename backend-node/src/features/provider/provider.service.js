'use strict';
/**
 * Provider self-service — availability, earnings, reviews.
 * Equivalent to Python's app/services/provider_service.py
 */
const { getDb } = require('../../db/connection');
const { nowUtc, clean } = require('../../utils/security');

function httpError(status, msg) {
  const e = new Error(msg);
  e.statusCode = status;
  return e;
}

async function providersNearbyService() {
  const db = getDb();
  const items = await db.collection('provider_profiles')
    .find({ status: 'approved' })
    .limit(20)
    .toArray();
  const out = [];
  for (const p of items) {
    const u = await db.collection('users').findOne({ id: p.user_id });
    if (!u) continue;
    out.push({
      ...clean({ ...p }),
      name: u.name || 'Technician',
      profile_photo_url: u.profile_photo_url,
    });
  }
  return out;
}

async function toggleAvailabilityService(body, user) {
  const db = getDb();
  await db.collection('provider_profiles').updateOne(
    { user_id: user.id },
    { $set: { is_online: body.is_online, updated_at: nowUtc() } },
  );
  return { is_online: body.is_online };
}

async function providerEarningsService(user) {
  const db = getDb();
  const prof = await db.collection('provider_profiles').findOne({ user_id: user.id });
  if (!prof) throw httpError(404, 'Provider profile not found');

  const ledger = await db.collection('commission_ledger')
    .find({ provider_id: prof.id })
    .toArray();

  const now = nowUtc();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const _sum = (entries, since) =>
    entries
      .filter((e) => e.created_at >= since)
      .reduce((acc, e) => acc + parseFloat(e.provider_payout_amount || 0), 0);

  return {
    today: _sum(ledger, today),
    this_week: _sum(ledger, weekStart),
    this_month: _sum(ledger, monthStart),
    history: [...ledger]
      .sort((a, b) => b.created_at - a.created_at)
      .map((e) => ({
        booking_id: e.booking_id,
        amount: parseFloat(e.provider_payout_amount),
        date: e.created_at instanceof Date ? e.created_at.toISOString() : e.created_at,
        payment_method: e.payment_method || 'cod',
      })),
  };
}

async function providerReviewsService(user) {
  const db = getDb();
  const prof = await db.collection('provider_profiles').findOne({ user_id: user.id });
  if (!prof) return [];
  const items = await db.collection('reviews')
    .find({ provider_id: prof.id })
    .sort({ created_at: -1 })
    .limit(100)
    .toArray();
  return items.map((d) => clean({ ...d }));
}

async function publicProviderReviewsService(pid) {
  const db = getDb();
  const items = await db.collection('reviews')
    .find({ provider_id: pid })
    .sort({ created_at: -1 })
    .limit(50)
    .toArray();
  const out = [];
  for (const r of items) {
    const u = await db.collection('users').findOne({ id: r.service_needer_id });
    out.push({ ...clean({ ...r }), reviewer_name: (u || {}).name || 'Customer' });
  }
  return out;
}

module.exports = {
  providersNearbyService,
  toggleAvailabilityService,
  providerEarningsService,
  providerReviewsService,
  publicProviderReviewsService,
};
