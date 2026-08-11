'use strict';
const { listNotificationsService, markNotifReadService } = require('./notification.service');

async function handleListNotifications(req, res, next) {
  try { res.json(await listNotificationsService(req.user)); } catch (e) { next(e); }
}
async function handleMarkNotifRead(req, res, next) {
  try { res.json(await markNotifReadService(req.params.nid, req.user)); } catch (e) { next(e); }
}

module.exports = { handleListNotifications, handleMarkNotifRead };
