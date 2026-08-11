'use strict';
const {
  updateMeService, listAddressesService,
  addAddressService, updateAddressService, deleteAddressService,
} = require('./user.service');
const { userUpdateSchema, addressSchema } = require('./user.validation');

async function handleUpdateMe(req, res, next) {
  try {
    const body = userUpdateSchema.parse(req.body);
    res.json(await updateMeService(body, req.user));
  } catch (e) { next(e); }
}

async function handleListAddresses(req, res, next) {
  try { res.json(await listAddressesService(req.user)); }
  catch (e) { next(e); }
}

async function handleAddAddress(req, res, next) {
  try {
    const body = addressSchema.parse(req.body);
    res.json(await addAddressService(body, req.user));
  } catch (e) { next(e); }
}

async function handleUpdateAddress(req, res, next) {
  try {
    const body = addressSchema.parse(req.body);
    res.json(await updateAddressService(req.params.addr_id, body, req.user));
  } catch (e) { next(e); }
}

async function handleDeleteAddress(req, res, next) {
  try { res.json(await deleteAddressService(req.params.addr_id, req.user)); }
  catch (e) { next(e); }
}

module.exports = {
  handleUpdateMe, handleListAddresses, handleAddAddress,
  handleUpdateAddress, handleDeleteAddress,
};
