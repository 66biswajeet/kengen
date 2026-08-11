'use strict';
/**
 * AquaServe Express application.
 * Configures middleware and mounts all feature routers.
 */
const express = require('express');
const cors = require('cors');
const { ZodError } = require('zod');
const { errorMiddleware } = require('./middleware/error.middleware');

// Feature routers
const authRouter         = require('./features/auth/auth.routes');
const userRouter         = require('./features/user/user.routes');
const serviceRouter      = require('./features/service/service.routes');
const providerRouter     = require('./features/provider/provider.routes');
const cartRouter         = require('./features/cart/cart.routes');
const bookingRouter      = require('./features/booking/booking.routes');
const jobRouter          = require('./features/job/job.routes');
const paymentRouter      = require('./features/payment/payment.routes');
const reviewRouter       = require('./features/review/review.routes');
const notificationRouter = require('./features/notification/notification.routes');
const adminRouter        = require('./features/admin/admin.routes');
const miscRouter         = require('./features/misc/misc.routes');

const app = express();

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ── API v1 routers ────────────────────────────────────────────────────────────
const V1 = '/api/v1';

app.use(`${V1}/auth`,          authRouter);
app.use(V1,                    userRouter);
app.use(V1,                    serviceRouter);
app.use(V1,                    providerRouter);
app.use(V1,                    cartRouter);
app.use(V1,                    bookingRouter);
app.use(V1,                    jobRouter);
app.use(V1,                    paymentRouter);
app.use(V1,                    reviewRouter);
app.use(V1,                    notificationRouter);
app.use(`${V1}/admin`,         adminRouter);

// Misc mounted at /api (health check keeps GET /api/)
app.use('/api',                miscRouter);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ detail: 'Not found' });
});

// ── Zod validation error formatter ───────────────────────────────────────────
// Converts ZodError into the same shape as FastAPI's 422 detail array
app.use((err, req, res, next) => {
  if (err instanceof ZodError) {
    return res.status(422).json({
      detail: err.errors.map((e) => ({
        loc: e.path,
        msg: e.message,
        type: e.code,
      })),
    });
  }
  next(err);
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
