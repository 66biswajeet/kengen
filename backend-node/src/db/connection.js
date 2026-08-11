'use strict';
/**
 * AquaServe — MongoDB connection.
 * Exports getDb() used across all feature modules.
 * Equivalent to Python's app/core/database.py
 */
const { MongoClient } = require('mongodb');
const { MONGO_URL, DB_NAME } = require('../config');

let _client = null;
let _db = null;

/**
 * Connect to MongoDB and store the client/db references.
 * Called once at server startup.
 */
async function connectDb() {
  if (_client) return _db;
  _client = new MongoClient(MONGO_URL, {
    // Allow TLS connections to Atlas and other cloud providers
    tls: MONGO_URL.startsWith('mongodb+srv'),
  });
  await _client.connect();
  _db = _client.db(DB_NAME);
  console.log(`[DB] Connected to MongoDB — database: "${DB_NAME}"`);

  // Create indexes (idempotent)
  await _db.collection('users').createIndex({ phone: 1 });
  await _db.collection('users').createIndex({ email: 1 });
  await _db.collection('services').createIndex({ name: 1 });
  await _db.collection('bookings').createIndex({ service_needer_id: 1 });
  await _db.collection('bookings').createIndex({ provider_id: 1 });
  console.log('[DB] Indexes ensured.');

  return _db;
}

/**
 * Return the active database handle.
 * Throws if connectDb() has not been called yet.
 */
function getDb() {
  if (!_db) throw new Error('Database not connected. Call connectDb() first.');
  return _db;
}

/**
 * Close the client — called on graceful shutdown.
 */
async function closeDb() {
  if (_client) {
    await _client.close();
    _client = null;
    _db = null;
    console.log('[DB] Connection closed.');
  }
}

module.exports = { connectDb, getDb, closeDb };
