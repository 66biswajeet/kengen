'use strict';
/** Review routes — POST /bookings/:bid/review [authenticate] */
const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { handleSubmitReview } = require('./review.controller');

const router = Router();
router.post('/bookings/:bid/review', authenticate, handleSubmitReview);
module.exports = router;
