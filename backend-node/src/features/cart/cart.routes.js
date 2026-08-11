'use strict';
/**
 * Cart routes
 * GET    /cart
 * POST   /cart/items
 * PATCH  /cart/items/:item_id
 * DELETE /cart/items/:item_id
 */
const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { handleGetCart, handleAddCartItem, handleUpdateCartItem, handleDeleteCartItem } = require('./cart.controller');

const router = Router();
router.get('/cart', authenticate, handleGetCart);
router.post('/cart/items', authenticate, handleAddCartItem);
router.patch('/cart/items/:item_id', authenticate, handleUpdateCartItem);
router.delete('/cart/items/:item_id', authenticate, handleDeleteCartItem);

module.exports = router;
