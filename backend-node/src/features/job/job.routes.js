'use strict';
/**
 * Job routes
 * GET   /jobs/requests               [authenticate, requireRole('provider')]
 * POST  /jobs/:bid/accept            [authenticate, requireRole('provider')]
 * POST  /jobs/:bid/reject            [authenticate, requireRole('provider')]
 * PATCH /bookings/:bid/status        [authenticate, requireRole('provider')]
 * POST  /bookings/:bid/verify-otp    [authenticate]
 * POST  /bookings/:bid/resend-otp    [authenticate]
 */
const { Router } = require('express');
const { authenticate, requireRole } = require('../../middleware/auth.middleware');
const {
  handleProviderJobRequests, handleAcceptJob, handleRejectJob,
  handleAdvanceStatus, handleVerifyBookingOtp, handleResendBookingOtp,
} = require('./job.controller');

const router = Router();
router.get('/jobs/requests', authenticate, requireRole('provider'), handleProviderJobRequests);
router.post('/jobs/:bid/accept', authenticate, requireRole('provider'), handleAcceptJob);
router.post('/jobs/:bid/reject', authenticate, requireRole('provider'), handleRejectJob);
router.patch('/bookings/:bid/status', authenticate, requireRole('provider'), handleAdvanceStatus);
router.post('/bookings/:bid/verify-otp', authenticate, handleVerifyBookingOtp);
router.post('/bookings/:bid/resend-otp', authenticate, handleResendBookingOtp);

module.exports = router;
