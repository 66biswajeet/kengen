'use strict';
const { z } = require('zod');

const availabilitySchema = z.object({
  is_online: z.boolean(),
});

module.exports = { availabilitySchema };
