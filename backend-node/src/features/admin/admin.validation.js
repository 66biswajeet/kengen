'use strict';
const { z } = require('zod');

const serviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  price: z.number().min(0),
  category_id: z.string().min(1),
  image_url: z.string().optional().nullable(),
  estimated_duration_minutes: z.number().int().optional().nullable(),
});

const settingsSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

module.exports = { serviceSchema, settingsSchema };
