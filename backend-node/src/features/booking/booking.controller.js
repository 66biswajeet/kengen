'use strict';
const {
  createBookingService, listBookingsService, getBookingService,
  cancelBookingService, rescheduleBookingService,
} = require('./booking.service');
const { bookingCreateSchema, bookingCancelSchema, bookingRescheduleSchema } = require('./booking.validation');

async function handleCreateBooking(req, res, next) {
  try {
    const body = bookingCreateSchema.parse(req.body);
    res.json(await createBookingService(body, req.user));
  } catch (e) { next(e); }
}
async function handleListBookings(req, res, next) {
  try { res.json(await listBookingsService(req.query.scope, req.user)); } catch (e) { next(e); }
}
async function handleGetBooking(req, res, next) {
  try { res.json(await getBookingService(req.params.bid, req.user)); } catch (e) { next(e); }
}
async function handleCancelBooking(req, res, next) {
  try {
    const body = bookingCancelSchema.parse(req.body);
    res.json(await cancelBookingService(req.params.bid, body, req.user));
  } catch (e) { next(e); }
}
async function handleRescheduleBooking(req, res, next) {
  try {
    const body = bookingRescheduleSchema.parse(req.body);
    res.json(await rescheduleBookingService(req.params.bid, body, req.user));
  } catch (e) { next(e); }
}

module.exports = {
  handleCreateBooking, handleListBookings, handleGetBooking,
  handleCancelBooking, handleRescheduleBooking,
};
