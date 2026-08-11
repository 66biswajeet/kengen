'use strict';
/**
 * Misc routes — health check, config, and upload signing.
 * Mounted at /api (not /api/v1) to preserve GET /api/ health check URL.
 * GET  /                    (health check)
 * GET  /v1/config/public
 * POST /v1/uploads/sign     [authenticate]
 */
const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { handleRoot, handlePublicConfig, handleCloudinarySign } = require('./misc.controller');

const router = Router();
router.get('/', handleRoot);
router.get('/v1/config/public', handlePublicConfig);
router.post('/v1/uploads/sign', authenticate, handleCloudinarySign);

module.exports = router;
