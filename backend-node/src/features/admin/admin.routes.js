'use strict';
/**
 * Admin routes — all under /admin prefix, protected by requireRole('admin').
 * GET    /admin/dashboard/stats
 * GET    /admin/bookings
 * GET    /admin/bookings/:bid
 * GET    /admin/providers
 * PATCH  /admin/providers/:pid/approve
 * PATCH  /admin/providers/:pid/reject
 * PATCH  /admin/providers/:pid/suspend
 * GET    /admin/service-needers
 * GET    /admin/earnings/summary
 * POST   /admin/services
 * PATCH  /admin/services/:sid
 * DELETE /admin/services/:sid
 * GET    /admin/settings
 * PATCH  /admin/settings
 */
const { Router } = require('express');
const { authenticate, requireRole } = require('../../middleware/auth.middleware');
const {
  handleAdminDashboard, handleAdminListBookings, handleAdminBookingDetail,
  handleAdminListProviders, handleAdminApprove, handleAdminReject, handleAdminSuspend,
  handleAdminServiceNeeders, handleAdminEarningsSummary,
  handleAdminCreateService, handleAdminUpdateService, handleAdminDeleteService,
  handleAdminGetSettings, handleAdminUpdateSetting,
} = require('./admin.controller');

const router = Router();

// Apply admin auth to all routes in this router
router.use(authenticate, requireRole('admin'));

router.get('/dashboard/stats', handleAdminDashboard);
router.get('/bookings', handleAdminListBookings);
router.get('/bookings/:bid', handleAdminBookingDetail);
router.get('/providers', handleAdminListProviders);
router.patch('/providers/:pid/approve', handleAdminApprove);
router.patch('/providers/:pid/reject', handleAdminReject);
router.patch('/providers/:pid/suspend', handleAdminSuspend);
router.get('/service-needers', handleAdminServiceNeeders);
router.get('/earnings/summary', handleAdminEarningsSummary);
router.post('/services', handleAdminCreateService);
router.patch('/services/:sid', handleAdminUpdateService);
router.delete('/services/:sid', handleAdminDeleteService);
router.get('/settings', handleAdminGetSettings);
router.patch('/settings', handleAdminUpdateSetting);

module.exports = router;
