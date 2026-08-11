'use strict';
const { z } = require('zod');

const cartItemSchema = z.object({
  service_id: z.string().min(1),
  quantity: z.number().int().min(1),
});

const cartItemUpdateSchema = z.object({
  quantity: z.number().int().min(0),
});

module.exports = { cartItemSchema, cartItemUpdateSchema };
