'use strict';
/**
 * Notification routes
 * GET   /notifications
 * PATCH /notifications/:nid/read
 */
const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { handleListNotifications, handleMarkNotifRead } = require('./notification.controller');

const router = Router();
router.get('/notifications', authenticate, handleListNotifications);
router.patch('/notifications/:nid/read', authenticate, handleMarkNotifRead);
module.exports = router;
