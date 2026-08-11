'use strict';
/**
 * Admin service — dashboard, provider management, service-needers, earnings, service CRUD, settings.
 * Equivalent to Python's app/services/admin_service.py
 */
const { getDb } = require('../../db/connection');
const { nowUtc, newId, clean } = require('../../utils/security');
const { serializeBooking } = require('../booking/booking.service');

function httpError(status, msg) {
  const e = new Error(msg);
  e.statusCode = status;
  return e;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

async function adminDashboardService() {
  const db = getDb();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const bookingsToday = await db.collection('bookings').countDocuments({
    created_at: { $gte: todayStart },
  });
  const activeProviders = await db.collection('provider_profiles').countDocuments({
    status: 'approved', is_online: true,
  });
  const pendingApprovals = await db.collection('provider_profiles').countDocuments({ status: 'pending' });

  const ledger = await db.collection('commission_ledger').find({}).toArray();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  let revenueToday = 0;
  let revenueMonth = 0;
  for (const e of ledger) {
    const d = e.created_at instanceof Date ? e.created_at : new Date(e.created_at);
    if (d >= today) revenueToday += parseFloat(e.service_amount || 0);
    if (d >= monthStart) revenueMonth += parseFloat(e.service_amount || 0);
  }

  return { bookings_today: bookingsToday, active_providers: activeProviders, pending_approvals: pendingApprovals, revenue_today: revenueToday, revenue_month: revenueMonth };
}

// ── Bookings ──────────────────────────────────────────────────────────────────

async function adminListBookingsService(status) {
  const db = getDb();
  const q = {};
  if (status) q.status = status;
  const items = await db.collection('bookings').find(q).sort({ created_at: -1 }).toArray();
  return Promise.all(items.map((b) => serializeBooking({ ...b })));
}

async function adminBookingDetailService(bid) {
  const db = getDb();
  const b = await db.collection('bookings').findOne({ id: bid });
  if (!b) throw httpError(404, 'Not found');
  return serializeBooking({ ...b });
}

// ── Providers ─────────────────────────────────────────────────────────────────

async function adminListProvidersService(status) {
  const db = getDb();
  const q = {};
  if (status) q.status = status;
  const items = await db.collection('provider_profiles').find(q).toArray();
  const out = [];
  for (const p of items) {
    const u = await db.collection('users').findOne({ id: p.user_id });
    out.push({ ...clean({ ...p }), user: u ? clean({ ...u }) : null });
  }
  return out;
}

async function adminApproveService(pid, user) {
  const db = getDb();
  await db.collection('provider_profiles').updateOne(
    { id: pid },
    { $set: { status: 'approved', approved_by: user.id, approved_at: nowUtc() } },
  );
  return { ok: true };
}

async function adminRejectService(pid) {
  const db = getDb();
  await db.collection('provider_profiles').updateOne({ id: pid }, { $set: { status: 'rejected' } });
  return { ok: true };
}

async function adminSuspendService(pid) {
  const db = getDb();
  await db.collection('provider_profiles').updateOne({ id: pid }, { $set: { status: 'suspended' } });
  return { ok: true };
}

// ── Service needers ───────────────────────────────────────────────────────────

async function adminServiceNeedersService() {
  const db = getDb();
  const items = await db.collection('users').find({ role: 'service_needer' }).toArray();
  const out = [];
  for (const u of items) {
    const cnt = await db.collection('bookings').countDocuments({ service_needer_id: u.id });
    out.push({ ...clean({ ...u }), total_bookings: cnt });
  }
  return out;
}

// ── Earnings ──────────────────────────────────────────────────────────────────

async function adminEarningsSummaryService() {
  const db = getDb();
  const ledger = await db.collection('commission_ledger').find({}).toArray();
  const totalRevenue = ledger.reduce((s, e) => s + parseFloat(e.service_amount || 0), 0);
  const totalCommission = ledger.reduce((s, e) => s + parseFloat(e.platform_commission_amount || 0), 0);
  const payoutsPending = ledger.filter((e) => e.payout_status === 'pending').reduce((s, e) => s + parseFloat(e.provider_payout_amount || 0), 0);
  const payoutsPaid = ledger.filter((e) => e.payout_status === 'paid').reduce((s, e) => s + parseFloat(e.provider_payout_amount || 0), 0);
  return {
    total_revenue: Math.round(totalRevenue * 100) / 100,
    total_commission: Math.round(totalCommission * 100) / 100,
    payouts_pending: Math.round(payoutsPending * 100) / 100,
    payouts_paid: Math.round(payoutsPaid * 100) / 100,
  };
}

// ── Services CRUD ─────────────────────────────────────────────────────────────

async function adminCreateServiceService(body, user) {
  const db = getDb();
  const doc = { id: newId(), ...body, is_active: true, created_by: user.id, created_at: nowUtc(), updated_at: nowUtc() };
  await db.collection('services').insertOne(doc);
  return clean({ ...doc });
}

async function adminUpdateServiceService(sid, body, user) {
  const db = getDb();
  await db.collection('services').updateOne(
    { id: sid },
    { $set: { ...body, updated_by: user.id, updated_at: nowUtc() } },
  );
  const doc = await db.collection('services').findOne({ id: sid });
  return clean({ ...doc });
}

async function adminDeleteServiceService(sid) {
  const db = getDb();
  await db.collection('services').updateOne({ id: sid }, { $set: { is_active: false } });
  return { ok: true };
}

// ── Settings ──────────────────────────────────────────────────────────────────

async function adminGetSettingsService() {
  const db = getDb();
  const items = await db.collection('app_settings').find({}).toArray();
  return Object.fromEntries(items.map((i) => [i.key, i.value]));
}

async function adminUpdateSettingService(body, user) {
  const db = getDb();
  await db.collection('app_settings').updateOne(
    { key: body.key },
    { $set: { value: body.value, updated_by: user.id, updated_at: nowUtc() } },
    { upsert: true },
  );
  return { ok: true };
}

module.exports = {
  adminDashboardService,
  adminListBookingsService,
  adminBookingDetailService,
  adminListProvidersService,
  adminApproveService,
  adminRejectService,
  adminSuspendService,
  adminServiceNeedersService,
  adminEarningsSummaryService,
  adminCreateServiceService,
  adminUpdateServiceService,
  adminDeleteServiceService,
  adminGetSettingsService,
  adminUpdateSettingService,
};
