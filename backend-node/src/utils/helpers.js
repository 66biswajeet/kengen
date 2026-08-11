'use strict';
/**
 * AquaServe — dynamic settings helpers.
 * Retrieves configurations from the `app_settings` DB collection with fallback to core config defaults.
 * Equivalent to Python's app/core/settings.py
 */
const { getDb } = require('../db/connection');
const { VISIT_CHARGE, TAX_PCT, DEFAULT_COMMISSION_PCT } = require('../config');

async function getSettingValue(key, defaultVal) {
  const db = getDb();
  const setting = await db.collection('app_settings').findOne({ key });
  if (setting && setting.value !== undefined) return setting.value;
  return defaultVal;
}

async function getVisitCharge() {
  const val = await getSettingValue('visit_charge', String(VISIT_CHARGE));
  const n = parseFloat(val);
  return isNaN(n) ? VISIT_CHARGE : n;
}

async function getTaxPct() {
  const val = await getSettingValue('tax_percentage', String(TAX_PCT * 100));
  const n = parseFloat(val);
  return isNaN(n) ? TAX_PCT : n / 100.0;
}

async function getDefaultCommissionPct() {
  const val = await getSettingValue('default_commission_percentage', String(DEFAULT_COMMISSION_PCT));
  const n = parseFloat(val);
  return isNaN(n) ? DEFAULT_COMMISSION_PCT : n;
}

module.exports = { getSettingValue, getVisitCharge, getTaxPct, getDefaultCommissionPct };
