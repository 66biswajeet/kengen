'use strict';
/**
 * Notification service — list and mark read.
 * Equivalent to Python's app/services/notification_service.py
 */
const { getDb } = require('../../db/connection');
const { clean } = require('../../utils/security');

async function listNotificationsService(user) {
  const db = getDb();
  const items = await db.collection('notifications')
    .find({ user_id: user.id })
    .sort({ created_at: -1 })
    .limit(50)
    .toArray();
  return items.map((d) => clean({ ...d }));
}

async function markNotifReadService(nid, user) {
  const db = getDb();
  await db.collection('notifications').updateOne(
    { id: nid, user_id: user.id },
    { $set: { is_read: true } },
  );
  return { ok: true };
}

module.exports = { listNotificationsService, markNotifReadService };
