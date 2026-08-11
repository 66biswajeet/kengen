'use strict';
const { getPublicConfigService, cloudinarySignService } = require('./misc.service');

async function handleRoot(req, res) {
  res.json({ service: 'aquaserve', version: '1.0.0', status: 'ok' });
}

async function handlePublicConfig(req, res, next) {
  try { res.json(getPublicConfigService()); } catch (e) { next(e); }
}

async function handleCloudinarySign(req, res, next) {
  try { res.json(await cloudinarySignService(req.body)); } catch (e) { next(e); }
}

module.exports = { handleRoot, handlePublicConfig, handleCloudinarySign };
