'use strict';
const { submitReviewService } = require('./review.service');
const { reviewSchema } = require('./review.validation');

async function handleSubmitReview(req, res, next) {
  try {
    const body = reviewSchema.parse(req.body);
    res.json(await submitReviewService(req.params.bid, body, req.user));
  } catch (e) { next(e); }
}

module.exports = { handleSubmitReview };
