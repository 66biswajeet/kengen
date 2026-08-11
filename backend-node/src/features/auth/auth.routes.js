'use strict';
/**
 * Auth routes — /auth/* endpoints.
 * POST /auth/otp/request
 * POST /auth/otp/verify
 * POST /auth/admin/login
 * POST /auth/refresh
 * GET  /auth/me          [authenticate]
 * POST /auth/logout      [authenticate]
 */
const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const {
  handleOtpRequest,
  handleOtpVerify,
  handleAdminLogin,
  handleRefreshToken,
  handleMe,
  handleLogout,
} = require('./auth.controller');

const router = Router();

router.post('/otp/request', handleOtpRequest);
router.post('/otp/verify', handleOtpVerify);
router.post('/admin/login', handleAdminLogin);
router.post('/refresh', handleRefreshToken);
router.get('/me', authenticate, handleMe);
router.post('/logout', authenticate, handleLogout);

module.exports = router;
