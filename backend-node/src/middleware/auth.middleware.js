'use strict';
/**
 * AquaServe — Authentication middleware.
 * Extracts and validates Bearer JWT, populates req.user.
 * Equivalent to Python's app/core/dependencies.py
 */
const { decodeToken, clean } = require('../utils/security');
const { getDb } = require('../db/connection');

/**
 * authenticate — require a valid Bearer access token.
 * Populates req.user with the clean user document.
 */
async function authenticate(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Not authenticated' });
  }
  const token = auth.slice(7);
  let payload;
  try {
    payload = decodeToken(token);
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ detail: 'Token expired' });
    }
    return res.status(401).json({ detail: 'Invalid token' });
  }

  if (payload.type !== 'access') {
    return res.status(401).json({ detail: 'Invalid token type' });
  }

  const db = getDb();
  const user = await db.collection('users').findOne({ id: payload.sub });
  if (!user) {
    return res.status(401).json({ detail: 'User not found' });
  }
  if (user.is_active === false) {
    return res.status(403).json({ detail: 'Account is disabled' });
  }

  req.user = clean(user);
  next();
}

/**
 * requireRole(...roles) — factory that returns middleware enforcing one of the given roles.
 * Must be used after authenticate.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ detail: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ detail: `Requires role: ${roles.join(', ')}` });
    }
    next();
  };
}

/**
 * optionalAuth — sets req.user if a valid Bearer token is present, but does not
 * reject requests without one. Useful for public routes that optionally personalize.
 */
async function optionalAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return next();
  const token = auth.slice(7);
  try {
    const payload = decodeToken(token);
    if (payload.type === 'access') {
      const db = getDb();
      const user = await db.collection('users').findOne({ id: payload.sub });
      if (user && user.is_active !== false) req.user = clean(user);
    }
  } catch { /* ignore token errors for optional auth */ }
  next();
}

module.exports = { authenticate, requireRole, optionalAuth };
