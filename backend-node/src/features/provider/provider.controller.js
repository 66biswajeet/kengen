'use strict';
const {
  providersNearbyService, toggleAvailabilityService,
  providerEarningsService, providerReviewsService, publicProviderReviewsService,
} = require('./provider.service');
const { availabilitySchema } = require('./provider.validation');

async function handleProvidersNearby(req, res, next) {
  try { res.json(await providersNearbyService(req.query)); } catch (e) { next(e); }
}

async function handleToggleAvailability(req, res, next) {
  try {
    const body = availabilitySchema.parse(req.body);
    res.json(await toggleAvailabilityService(body, req.user));
  } catch (e) { next(e); }
}

async function handleProviderEarnings(req, res, next) {
  try { res.json(await providerEarningsService(req.user)); } catch (e) { next(e); }
}

async function handleProviderReviews(req, res, next) {
  try { res.json(await providerReviewsService(req.user)); } catch (e) { next(e); }
}

async function handlePublicProviderReviews(req, res, next) {
  try { res.json(await publicProviderReviewsService(req.params.pid)); } catch (e) { next(e); }
}

module.exports = {
  handleProvidersNearby, handleToggleAvailability,
  handleProviderEarnings, handleProviderReviews, handlePublicProviderReviews,
};
