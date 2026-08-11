'use strict';
/**
 * Payment routes
 * GET  /bookings/:bid/payments/qr             [authenticate]
 * POST /bookings/:bid/payments/collect        [authenticate]
 * POST /bookings/:bid/payments/confirm-upi    [authenticate]
 * POST /bookings/:bid/payments/razorpay/verify [authenticate]
 * GET  /bookings/:bid/payment                 [authenticate]
 */
const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const {
  handleCollectCod, handleConfirmUpi, handleUpiQr,
  handleRazorpayVerify, handleBookingPayment,
} = require('./payment.controller');

const router = Router();
router.get('/bookings/:bid/payments/qr', authenticate, handleUpiQr);
router.post('/bookings/:bid/payments/collect', authenticate, handleCollectCod);
router.post('/bookings/:bid/payments/confirm-upi', authenticate, handleConfirmUpi);
router.post('/bookings/:bid/payments/razorpay/verify', authenticate, handleRazorpayVerify);
router.get('/bookings/:bid/payment', authenticate, handleBookingPayment);

module.exports = router;
