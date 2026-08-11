'use strict';
/**
 * AquaServe — Database seeding service.
 * Run on startup to populate initial data (admin, categories, services, providers, settings).
 * Equivalent to Python's app/services/seed_service.py
 */
const { getDb } = require('./connection');
const {
  ADMIN_EMAIL, ADMIN_PASSWORD,
  DEFAULT_COMMISSION_PCT, VISIT_CHARGE, TAX_PCT,
} = require('../config');
const { nowUtc, newId, hashPassword, verifyPassword } = require('../utils/security');

const CATEGORY_SEED = [
  { name: 'Installation',     icon_url: 'https://cdn-icons-png.flaticon.com/512/2933/2933116.png' },
  { name: 'Filter Change',    icon_url: 'https://cdn-icons-png.flaticon.com/512/2933/2933231.png' },
  { name: 'Repair',           icon_url: 'https://cdn-icons-png.flaticon.com/512/2933/2933189.png' },
  { name: 'AMC',              icon_url: 'https://cdn-icons-png.flaticon.com/512/2933/2933112.png' },
  { name: 'General Service',  icon_url: 'https://cdn-icons-png.flaticon.com/512/2933/2933249.png' },
];

const SERVICE_SEED_BY_CATEGORY = {
  Installation: [
    { name: 'RO Installation (Wall-mounted)', description: 'Complete wall-mount installation for standard RO purifiers, including plumbing fittings and test-run.', price: 799, duration: 90, image: 'https://images.unsplash.com/photo-1534616042650-80f5c9b61f09?w=800' },
    { name: 'Under-counter RO Installation', description: 'Neat under-counter fitment with piping and food-grade connectors.', price: 999, duration: 120, image: 'https://images.unsplash.com/photo-1556010656-e60700d4c0d5?w=800' },
  ],
  'Filter Change': [
    { name: 'RO Sediment + Carbon Filter Change', description: 'Replace sediment and pre-carbon filters. Includes flush and TDS check.', price: 499, duration: 45, image: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=800' },
    { name: 'Full Filter Kit Replacement', description: 'Complete filter kit swap (sediment, carbon, post-carbon).', price: 1299, duration: 60, image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800' },
  ],
  Repair: [
    { name: 'Not-Working / No Water Issue', description: "Diagnosis and repair for purifiers that aren't dispensing water.", price: 349, duration: 60, image: 'https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=800' },
    { name: 'Leakage Repair', description: 'Fix leakage from purifier joints, tank or pipe fittings.', price: 299, duration: 45, image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800' },
  ],
  AMC: [
    { name: 'Annual Maintenance Contract (Basic)', description: '12-month plan — 3 scheduled services + priority repair visits.', price: 1999, duration: 30, image: 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?w=800' },
  ],
  'General Service': [
    { name: 'General Cleaning & Sanitisation', description: 'Deep cleaning + sanitisation of tank, taps and pipes.', price: 599, duration: 60, image: 'https://images.unsplash.com/photo-1584265549228-2f04c4b8f6c3?w=800' },
  ],
};

const PROVIDER_SEED = [
  { phone: '+919999900001', name: 'Rajesh Kumar',  locality: 'Koramangala, Bangalore', photo: 'https://images.unsplash.com/photo-1732395805034-e0bf859665e5?w=400' },
  { phone: '+919999900002', name: 'Suresh Sharma', locality: 'Indiranagar, Bangalore',  photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400' },
  { phone: '+919999900003', name: 'Amit Patel',    locality: 'HSR Layout, Bangalore',   photo: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400' },
];

async function seedData() {
  const db = getDb();

  // ── Admin user ────────────────────────────────────────────────────────────
  const existingAdmin = await db.collection('users').findOne({ email: ADMIN_EMAIL.toLowerCase(), role: 'admin' });
  if (!existingAdmin) {
    const adminId = newId();
    await db.collection('users').insertOne({
      id: adminId,
      role: 'admin',
      email: ADMIN_EMAIL.toLowerCase(),
      password_hash: await hashPassword(ADMIN_PASSWORD),
      name: 'AquaServe Admin',
      phone: null,
      is_active: true,
      created_at: nowUtc(),
      updated_at: nowUtc(),
    });
    console.log('[Seed] Admin user created.');
  } else {
    // Ensure password is up to date
    const valid = await verifyPassword(ADMIN_PASSWORD, existingAdmin.password_hash || '');
    if (!valid) {
      await db.collection('users').updateOne(
        { id: existingAdmin.id },
        { $set: { password_hash: await hashPassword(ADMIN_PASSWORD) } },
      );
    }
  }

  // ── Service categories ────────────────────────────────────────────────────
  for (const c of CATEGORY_SEED) {
    const exists = await db.collection('service_categories').findOne({ name: c.name });
    if (!exists) {
      await db.collection('service_categories').insertOne({
        id: newId(),
        name: c.name,
        icon_url: c.icon_url,
        is_active: true,
        created_at: nowUtc(),
      });
    }
  }

  // ── Services per category ─────────────────────────────────────────────────
  for (const [catName, svcs] of Object.entries(SERVICE_SEED_BY_CATEGORY)) {
    const cat = await db.collection('service_categories').findOne({ name: catName });
    if (!cat) continue;
    for (const s of svcs) {
      const existing = await db.collection('services').findOne({ name: s.name });
      if (existing) continue;
      await db.collection('services').insertOne({
        id: newId(),
        category_id: cat.id,
        name: s.name,
        description: s.description,
        price: s.price,
        estimated_duration_minutes: s.duration,
        image_url: s.image,
        is_active: true,
        created_at: nowUtc(),
        updated_at: nowUtc(),
      });
    }
  }

  // ── Seed provider accounts ────────────────────────────────────────────────
  const allCats = await db.collection('service_categories').find({}).toArray();
  for (const p of PROVIDER_SEED) {
    const exists = await db.collection('users').findOne({ phone: p.phone });
    if (exists) continue;
    const uid = newId();
    await db.collection('users').insertOne({
      id: uid,
      role: 'provider',
      phone: p.phone,
      email: null,
      name: p.name,
      profile_photo_url: p.photo,
      is_active: true,
      created_at: nowUtc(),
      updated_at: nowUtc(),
    });
    await db.collection('provider_profiles').insertOne({
      id: newId(),
      user_id: uid,
      status: 'approved',
      service_area_locality: p.locality,
      service_radius_km: 8.0,
      id_proof_url: null,
      commission_percentage: DEFAULT_COMMISSION_PCT,
      is_online: true,
      current_latitude: null,
      current_longitude: null,
      average_rating: parseFloat((4.3 + Math.random() * 0.6).toFixed(1)),
      total_jobs_completed: Math.floor(Math.random() * 171) + 30,
      approved_by: null,
      approved_at: nowUtc(),
      category_ids: allCats.map((c) => c.id),
      created_at: nowUtc(),
      updated_at: nowUtc(),
    });
  }

  // ── App settings defaults ─────────────────────────────────────────────────
  const defaultSettings = {
    support_phone: '+919999900000',
    support_whatsapp: 'https://wa.me/919999900000',
    support_email: 'support@aquaserve.com',
    company_address: 'AquaServe HQ, Bangalore',
    default_commission_percentage: String(DEFAULT_COMMISSION_PCT),
    visit_charge: String(VISIT_CHARGE),
    tax_percentage: String(TAX_PCT * 100),
    assignment_radius_km: '0',
    job_request_expiry_minutes: '15',
  };
  for (const [k, v] of Object.entries(defaultSettings)) {
    const exists = await db.collection('app_settings').findOne({ key: k });
    if (!exists) {
      await db.collection('app_settings').insertOne({ id: newId(), key: k, value: v, updated_at: nowUtc() });
    }
  }

  console.log('[Seed] Database seeding complete.');
}

module.exports = { seedData };
