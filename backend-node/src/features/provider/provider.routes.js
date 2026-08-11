'use strict';
/**
 * Provider routes
 * GET   /providers/nearby
 * PATCH /providers/me/availability  [authenticate, requireRole('provider')]
 * GET   /providers/me/earnings      [authenticate, requireRole('provider')]
 * GET   /providers/me/reviews       [authenticate, requireRole('provider')]
 * GET   /providers/:pid/reviews
 */
const { Router } = require('express');
const { authenticate, requireRole } = require('../../middleware/auth.middleware');
const {
  handleProvidersNearby, handleToggleAvailability,
  handleProviderEarnings, handleProviderReviews, handlePublicProviderReviews,
} = require('./provider.controller');

const router = Router();

router.get('/providers/nearby', handleProvidersNearby);
router.patch('/providers/me/availability', authenticate, requireRole('provider'), handleToggleAvailability);
router.get('/providers/me/earnings', authenticate, requireRole('provider'), handleProviderEarnings);
router.get('/providers/me/reviews', authenticate, requireRole('provider'), handleProviderReviews);
router.get('/providers/:pid/reviews', handlePublicProviderReviews);

module.exports = router;
