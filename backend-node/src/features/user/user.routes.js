'use strict';
/**
 * User routes
 * PATCH  /users/me
 * GET    /addresses
 * POST   /addresses
 * PATCH  /addresses/:addr_id
 * DELETE /addresses/:addr_id
 */
const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const {
  handleUpdateMe, handleListAddresses, handleAddAddress,
  handleUpdateAddress, handleDeleteAddress,
} = require('./user.controller');

const router = Router();

router.patch('/users/me', authenticate, handleUpdateMe);
router.get('/addresses', authenticate, handleListAddresses);
router.post('/addresses', authenticate, handleAddAddress);
router.patch('/addresses/:addr_id', authenticate, handleUpdateAddress);
router.delete('/addresses/:addr_id', authenticate, handleDeleteAddress);

module.exports = router;
