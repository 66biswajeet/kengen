'use strict';
/**
 * User service — profile and address CRUD.
 * Equivalent to Python's app/services/user_service.py
 */
const { getDb } = require('../../db/connection');
const { nowUtc, newId, clean } = require('../../utils/security');

function httpError(status, msg) {
  const e = new Error(msg);
  e.statusCode = status;
  return e;
}

async function updateMeService(body, user) {
  const db = getDb();
  const updates = {};
  for (const [k, v] of Object.entries(body)) {
    if (v !== undefined && v !== null) updates[k] = v;
  }
  if (Object.keys(updates).length > 0) {
    updates.updated_at = nowUtc();
    await db.collection('users').updateOne({ id: user.id }, { $set: updates });
  }
  const user2 = await db.collection('users').findOne({ id: user.id });
  return clean({ ...user2 });
}

async function listAddressesService(user) {
  const db = getDb();
  const items = await db.collection('addresses')
    .find({ user_id: user.id })
    .sort({ created_at: -1 })
    .toArray();
  return items.map((d) => clean({ ...d }));
}

async function addAddressService(body, user) {
  const db = getDb();
  const doc = { id: newId(), user_id: user.id, ...body, created_at: nowUtc() };
  if (body.is_default) {
    await db.collection('addresses').updateMany({ user_id: user.id }, { $set: { is_default: false } });
  }
  await db.collection('addresses').insertOne(doc);
  return clean({ ...doc });
}

async function updateAddressService(addrId, body, user) {
  const db = getDb();
  if (body.is_default) {
    await db.collection('addresses').updateMany({ user_id: user.id }, { $set: { is_default: false } });
  }
  const r = await db.collection('addresses').updateOne(
    { id: addrId, user_id: user.id },
    { $set: body },
  );
  if (r.matchedCount === 0) throw httpError(404, 'Address not found');
  const doc = await db.collection('addresses').findOne({ id: addrId });
  return clean({ ...doc });
}

async function deleteAddressService(addrId, user) {
  const db = getDb();
  const r = await db.collection('addresses').deleteOne({ id: addrId, user_id: user.id });
  if (r.deletedCount === 0) throw httpError(404, 'Address not found');
  return { ok: true };
}

module.exports = {
  updateMeService,
  listAddressesService,
  addAddressService,
  updateAddressService,
  deleteAddressService,
};
