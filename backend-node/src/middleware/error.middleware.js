'use strict';
/**
 * AquaServe — Global error handler middleware.
 * Maps thrown errors to appropriate HTTP responses.
 */

// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const detail = err.message || 'Internal server error';

  if (statusCode >= 500) {
    console.error('[Error]', err);
  }

  res.status(statusCode).json({ detail });
}

module.exports = { errorMiddleware };
