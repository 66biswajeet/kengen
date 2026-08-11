'use strict';
const { listCategoriesService, listServicesService, getServiceService } = require('./service.service');

async function handleListCategories(req, res, next) {
  try { res.json(await listCategoriesService()); } catch (e) { next(e); }
}

async function handleListServices(req, res, next) {
  try { res.json(await listServicesService(req.query.category_id)); } catch (e) { next(e); }
}

async function handleGetService(req, res, next) {
  try { res.json(await getServiceService(req.params.sid)); } catch (e) { next(e); }
}

module.exports = { handleListCategories, handleListServices, handleGetService };
