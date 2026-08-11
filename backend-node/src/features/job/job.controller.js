'use strict';
const {
  providerJobRequestsService, acceptJobService, rejectJobService,
  advanceStatusService, verifyBookingOtpService, resendBookingOtpService,
} = require('./job.service');
const { statusUpdateSchema, otpVerifySchema } = require('./job.validation');

async function handleProviderJobRequests(req, res, next) {
  try { res.json(await providerJobRequestsService(req.user)); } catch (e) { next(e); }
}
async function handleAcceptJob(req, res, next) {
  try { res.json(await acceptJobService(req.params.bid, req.user)); } catch (e) { next(e); }
}
async function handleRejectJob(req, res, next) {
  try { res.json(await rejectJobService(req.params.bid, req.user)); } catch (e) { next(e); }
}
async function handleAdvanceStatus(req, res, next) {
  try {
    const body = statusUpdateSchema.parse(req.body);
    res.json(await advanceStatusService(req.params.bid, body, req.user));
  } catch (e) { next(e); }
}
async function handleVerifyBookingOtp(req, res, next) {
  try {
    const body = otpVerifySchema.parse(req.body);
    res.json(await verifyBookingOtpService(req.params.bid, body, req.user));
  } catch (e) { next(e); }
}
async function handleResendBookingOtp(req, res, next) {
  try { res.json(await resendBookingOtpService(req.params.bid, req.user)); } catch (e) { next(e); }
}

module.exports = {
  handleProviderJobRequests, handleAcceptJob, handleRejectJob,
  handleAdvanceStatus, handleVerifyBookingOtp, handleResendBookingOtp,
};
