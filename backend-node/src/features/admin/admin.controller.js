'use strict';
const {
  adminDashboardService, adminListBookingsService, adminBookingDetailService,
  adminListProvidersService, adminApproveService, adminRejectService, adminSuspendService,
  adminServiceNeedersService, adminEarningsSummaryService,
  adminCreateServiceService, adminUpdateServiceService, adminDeleteServiceService,
  adminGetSettingsService, adminUpdateSettingService,
} = require('./admin.service');
const { serviceSchema, settingsSchema } = require('./admin.validation');

async function handleAdminDashboard(req, res, next) {
  try { res.json(await adminDashboardService()); } catch (e) { next(e); }
}
async function handleAdminListBookings(req, res, next) {
  try { res.json(await adminListBookingsService(req.query.status)); } catch (e) { next(e); }
}
async function handleAdminBookingDetail(req, res, next) {
  try { res.json(await adminBookingDetailService(req.params.bid)); } catch (e) { next(e); }
}
async function handleAdminListProviders(req, res, next) {
  try { res.json(await adminListProvidersService(req.query.status)); } catch (e) { next(e); }
}
async function handleAdminApprove(req, res, next) {
  try { res.json(await adminApproveService(req.params.pid, req.user)); } catch (e) { next(e); }
}
async function handleAdminReject(req, res, next) {
  try { res.json(await adminRejectService(req.params.pid)); } catch (e) { next(e); }
}
async function handleAdminSuspend(req, res, next) {
  try { res.json(await adminSuspendService(req.params.pid)); } catch (e) { next(e); }
}
async function handleAdminServiceNeeders(req, res, next) {
  try { res.json(await adminServiceNeedersService()); } catch (e) { next(e); }
}
async function handleAdminEarningsSummary(req, res, next) {
  try { res.json(await adminEarningsSummaryService()); } catch (e) { next(e); }
}
async function handleAdminCreateService(req, res, next) {
  try {
    const body = serviceSchema.parse(req.body);
    res.json(await adminCreateServiceService(body, req.user));
  } catch (e) { next(e); }
}
async function handleAdminUpdateService(req, res, next) {
  try {
    const body = serviceSchema.parse(req.body);
    res.json(await adminUpdateServiceService(req.params.sid, body, req.user));
  } catch (e) { next(e); }
}
async function handleAdminDeleteService(req, res, next) {
  try { res.json(await adminDeleteServiceService(req.params.sid)); } catch (e) { next(e); }
}
async function handleAdminGetSettings(req, res, next) {
  try { res.json(await adminGetSettingsService()); } catch (e) { next(e); }
}
async function handleAdminUpdateSetting(req, res, next) {
  try {
    const body = settingsSchema.parse(req.body);
    res.json(await adminUpdateSettingService(body, req.user));
  } catch (e) { next(e); }
}

module.exports = {
  handleAdminDashboard, handleAdminListBookings, handleAdminBookingDetail,
  handleAdminListProviders, handleAdminApprove, handleAdminReject, handleAdminSuspend,
  handleAdminServiceNeeders, handleAdminEarningsSummary,
  handleAdminCreateService, handleAdminUpdateService, handleAdminDeleteService,
  handleAdminGetSettings, handleAdminUpdateSetting,
};
