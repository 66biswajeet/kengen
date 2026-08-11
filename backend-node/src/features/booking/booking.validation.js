'use strict';
const { z } = require('zod');

const bookingCreateSchema = z.object({
  address_id: z.string().min(1),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  scheduled_time_slot: z.string().min(1),
  notes: z.string().optional().nullable(),
  payment_method: z.enum(['cod', 'upi']).default('cod'),
});

const bookingCancelSchema = z.object({
  reason: z.string().optional(),
});

const bookingRescheduleSchema = z.object({
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  scheduled_time_slot: z.string().optional(),
});

module.exports = { bookingCreateSchema, bookingCancelSchema, bookingRescheduleSchema };
