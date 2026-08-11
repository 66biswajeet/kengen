'use strict';
/**
 * Booking routes
 * POST  /bookings
 * GET   /bookings
 * GET   /bookings/:bid
 * PATCH /bookings/:bid/cancel
 * POST  /bookings/:bid/reschedule
 */
const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const {
  handleCreateBooking, handleListBookings, handleGetBooking,
  handleCancelBooking, handleRescheduleBooking,
} = require('./booking.controller');

const router = Router();
router.post('/bookings', authenticate, handleCreateBooking);
router.get('/bookings', authenticate, handleListBookings);
router.get('/bookings/:bid', authenticate, handleGetBooking);
router.patch('/bookings/:bid/cancel', authenticate, handleCancelBooking);
router.post('/bookings/:bid/reschedule', authenticate, handleRescheduleBooking);

module.exports = router;
