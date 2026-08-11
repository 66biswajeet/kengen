'use strict';
/**
 * Auth validation schemas — Zod equivalents of Python's Pydantic auth models.
 */
const { z } = require('zod');

/** Normalize phone to E.164 +91 format */
const phoneTransform = (v) => {
  v = v.trim();
  if (!v.startsWith('+')) v = '+91' + v.replace(/^0+/, '');
  return v;
};

const otpRequestSchema = z.object({
  phone: z.string().transform(phoneTransform),
  role: z.enum(['service_needer', 'provider']).default('service_needer'),
});

const otpVerifySchema = z.object({
  phone: z.string().transform(phoneTransform),
  otp: z.string().optional(),
  firebase_id_token: z.string().optional(),
  role: z.enum(['service_needer', 'provider']).default('service_needer'),
  name: z.string().optional(),
  email: z.string().email().optional(),
  service_area_locality: z.string().optional(),
  service_radius_km: z.number().optional(),
  category_ids: z.array(z.string()).optional(),
});

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

module.exports = { otpRequestSchema, otpVerifySchema, adminLoginSchema };
