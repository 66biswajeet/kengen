'use strict';
const { z } = require('zod');

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  image_urls: z.array(z.string()).optional().default([]),
});

module.exports = { reviewSchema };
