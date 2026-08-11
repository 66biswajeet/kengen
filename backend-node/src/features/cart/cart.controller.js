'use strict';
const { cartResponse, addCartItemService, updateCartItemService, deleteCartItemService } = require('./cart.service');
const { cartItemSchema, cartItemUpdateSchema } = require('./cart.validation');

async function handleGetCart(req, res, next) {
  try { res.json(await cartResponse(req.user.id)); } catch (e) { next(e); }
}
async function handleAddCartItem(req, res, next) {
  try {
    const body = cartItemSchema.parse(req.body);
    res.json(await addCartItemService(body, req.user));
  } catch (e) { next(e); }
}
async function handleUpdateCartItem(req, res, next) {
  try {
    const body = cartItemUpdateSchema.parse(req.body);
    res.json(await updateCartItemService(req.params.item_id, body, req.user));
  } catch (e) { next(e); }
}
async function handleDeleteCartItem(req, res, next) {
  try { res.json(await deleteCartItemService(req.params.item_id, req.user)); } catch (e) { next(e); }
}

module.exports = { handleGetCart, handleAddCartItem, handleUpdateCartItem, handleDeleteCartItem };
