'use strict';
const { z } = require('zod');

const userUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  profile_photo_url: z.string().url().optional().nullable(),
});

const addressSchema = z.object({
  label: z.string().min(1),
  address_line: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(1),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  is_default: z.boolean().default(false),
});

module.exports = { userUpdateSchema, addressSchema };
