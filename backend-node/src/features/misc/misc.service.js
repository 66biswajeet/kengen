'use strict';
/**
 * Misc service — public config and Cloudinary signing.
 * Equivalent to Python's app/controllers/misc_controller.py
 */
const {
  FIREBASE_PROJECT_ID,
  RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET,
  CLOUDINARY_URL, CLOUDINARY_UPLOAD_PRESET,
} = require('../../config');
const { nowUtc } = require('../../utils/security');

function getPublicConfigService() {
  const cloudName = CLOUDINARY_URL ? CLOUDINARY_URL.split('@').pop() : null;
  return {
    firebase_enabled: Boolean(FIREBASE_PROJECT_ID),
    firebase_project_id: FIREBASE_PROJECT_ID || null,
    razorpay_enabled: Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET),
    razorpay_key_id: RAZORPAY_KEY_ID || null,
    cloudinary_enabled: Boolean(CLOUDINARY_URL),
    cloudinary_cloud_name: cloudName,
    cloudinary_upload_preset: CLOUDINARY_UPLOAD_PRESET || null,
  };
}

async function cloudinarySignService(body) {
  const folder = (body && body.folder) || 'aquaserve/uploads';
  if (!CLOUDINARY_URL) {
    return { mode: 'mock', folder, note: 'Cloudinary not configured — frontend should use a placeholder URL.' };
  }
  try {
    const cloudinary = require('cloudinary').v2;
    cloudinary.config();  // picks up CLOUDINARY_URL env automatically
    const ts = Math.floor(nowUtc().getTime() / 1000);
    const params = { timestamp: ts, folder };
    if (CLOUDINARY_UPLOAD_PRESET) params.upload_preset = CLOUDINARY_UPLOAD_PRESET;
    const signature = cloudinary.utils.api_sign_request(params, cloudinary.config().api_secret);
    return {
      mode: 'live',
      cloud_name: cloudinary.config().cloud_name,
      api_key: cloudinary.config().api_key,
      timestamp: ts,
      signature,
      folder,
      upload_preset: CLOUDINARY_UPLOAD_PRESET || null,
    };
  } catch (e) {
    const err = new Error('Cloudinary signing failed: ' + e.message);
    err.statusCode = 500;
    throw err;
  }
}

module.exports = { getPublicConfigService, cloudinarySignService };
