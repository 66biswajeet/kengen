'use strict';
/**
 * Service catalog routes
 * GET /categories
 * GET /services
 * GET /services/:sid
 */
const { Router } = require('express');
const { handleListCategories, handleListServices, handleGetService } = require('./service.controller');

const router = Router();
router.get('/categories', handleListCategories);
router.get('/services', handleListServices);
router.get('/services/:sid', handleGetService);

module.exports = router;
