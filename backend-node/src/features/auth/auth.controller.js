'use strict';
/**
 * Auth controller — thin handlers that call auth service and return JSON.
 */
const {
  otpRequestService,
  otpVerifyService,
  adminLoginService,
  refreshTokenService,
  getMeService,
  logoutService,
} = require('./auth.service');
const { otpRequestSchema, otpVerifySchema, adminLoginSchema } = require('./auth.validation');

async function handleOtpRequest(req, res, next) {
  try {
    const body = otpRequestSchema.parse(req.body);
    const result = await otpRequestService(body);
    res.json(result);
  } catch (e) { next(e); }
}

async function handleOtpVerify(req, res, next) {
  try {
    const body = otpVerifySchema.parse(req.body);
    const result = await otpVerifyService(body);
    res.json(result);
  } catch (e) { next(e); }
}

async function handleAdminLogin(req, res, next) {
  try {
    const body = adminLoginSchema.parse(req.body);
    const result = await adminLoginService(body);
    res.json(result);
  } catch (e) { next(e); }
}

async function handleRefreshToken(req, res, next) {
  try {
    const result = await refreshTokenService(req.body);
    res.json(result);
  } catch (e) { next(e); }
}

async function handleMe(req, res, next) {
  try {
    const result = await getMeService(req.user);
    res.json(result);
  } catch (e) { next(e); }
}

async function handleLogout(req, res, next) {
  try {
    const result = await logoutService();
    res.json(result);
  } catch (e) { next(e); }
}

module.exports = {
  handleOtpRequest,
  handleOtpVerify,
  handleAdminLogin,
  handleRefreshToken,
  handleMe,
  handleLogout,
};
