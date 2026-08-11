'use strict';
/**
 * Service catalog service — categories and services read operations.
 * Equivalent to Python's app/services/service_service.py
 */
const { getDb } = require('../../db/connection');
const { clean } = require('../../utils/security');

function httpError(status, msg) {
  const e = new Error(msg);
  e.statusCode = status;
  return e;
}

async function listCategoriesService() {
  const db = getDb();
  const items = await db.collection('service_categories').find({ is_active: true }).toArray();
  return items.map((d) => clean({ ...d }));
}

async function listServicesService(categoryId) {
  const db = getDb();
  const q = { is_active: true };
  if (categoryId) q.category_id = categoryId;
  const items = await db.collection('services').find(q).toArray();
  return items.map((d) => clean({ ...d }));
}

async function getServiceService(sid) {
  const db = getDb();
  const doc = await db.collection('services').findOne({ id: sid });
  if (!doc) throw httpError(404, 'Service not found');
  return clean({ ...doc });
}

module.exports = { listCategoriesService, listServicesService, getServiceService };
