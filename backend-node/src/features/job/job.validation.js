'use strict';
const { z } = require('zod');

const statusUpdateSchema = z.object({
  status: z.enum(['on_the_way', 'arrived', 'in_progress', 'completed']),
});

const otpVerifySchema = z.object({
  otp: z.string().min(1),
});

module.exports = { statusUpdateSchema, otpVerifySchema };
