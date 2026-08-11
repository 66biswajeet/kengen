'use strict';
const {
  collectCodService, confirmUpiService, upiQrService,
  razorpayVerifyService, bookingPaymentService,
} = require('./payment.service');

async function handleCollectCod(req, res, next) {
  try { res.json(await collectCodService(req.params.bid, req.user)); } catch (e) { next(e); }
}
async function handleConfirmUpi(req, res, next) {
  try { res.json(await confirmUpiService(req.params.bid, req.user)); } catch (e) { next(e); }
}
async function handleUpiQr(req, res, next) {
  try { res.json(await upiQrService(req.params.bid, req.user)); } catch (e) { next(e); }
}
async function handleRazorpayVerify(req, res, next) {
  try { res.json(await razorpayVerifyService(req.params.bid, req.body, req.user)); } catch (e) { next(e); }
}
async function handleBookingPayment(req, res, next) {
  try { res.json(await bookingPaymentService(req.params.bid, req.user)); } catch (e) { next(e); }
}

module.exports = {
  handleCollectCod, handleConfirmUpi, handleUpiQr,
  handleRazorpayVerify, handleBookingPayment,
};
