'use strict';

/**
 * Geo Utilities for AquaServe
 * - Haversine distance calculation
 * - Provider distance filtering and sorting
 */

/**
 * Converts degrees to radians
 * @param {number} degrees
 * @returns {number} radians
 */
function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates straight-line great-circle distance in kilometers between two GPS coordinates
 * using the standard Haversine formula.
 *
 * @param {number} lat1 - Latitude of point 1 in decimal degrees
 * @param {number} lon1 - Longitude of point 1 in decimal degrees
 * @param {number} lat2 - Latitude of point 2 in decimal degrees
 * @param {number} lon2 - Longitude of point 2 in decimal degrees
 * @returns {number|null} Distance in kilometers rounded to 2 decimal places, or null if coordinates are invalid
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const pLat1 = parseFloat(lat1);
  const pLon1 = parseFloat(lon1);
  const pLat2 = parseFloat(lat2);
  const pLon2 = parseFloat(lon2);

  if (
    Number.isNaN(pLat1) ||
    Number.isNaN(pLon1) ||
    Number.isNaN(pLat2) ||
    Number.isNaN(pLon2)
  ) {
    return null;
  }

  // Exact same point
  if (pLat1 === pLat2 && pLon1 === pLon2) {
    return 0;
  }

  const R = 6371; // Earth radius in kilometers
  const dLat = toRadians(pLat2 - pLat1);
  const dLon = toRadians(pLon2 - pLon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(pLat1)) *
      Math.cos(toRadians(pLat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Filters a list of provider profiles by distance from client coordinates.
 * Only providers within their `service_radius_km` (default 10 km) are returned,
 * sorted by closest distance first.
 *
 * @param {Array<Object>} providers - Array of provider profile objects
 * @param {number} clientLat - Client's latitude
 * @param {number} clientLng - Client's longitude
 * @returns {Array<Object>} Filtered and sorted providers with `distance_km` attached
 */
function filterProvidersByDistance(providers, clientLat, clientLng) {
  if (!Array.isArray(providers)) return [];

  const cLat = parseFloat(clientLat);
  const cLng = parseFloat(clientLng);

  // If client coordinates are not provided, return providers as is with distance_km = null
  if (Number.isNaN(cLat) || Number.isNaN(cLng)) {
    return providers.map((p) => ({ ...p, distance_km: null }));
  }

  const matched = [];

  for (const prof of providers) {
    const pLat = prof.current_latitude != null ? prof.current_latitude : prof.latitude;
    const pLng = prof.current_longitude != null ? prof.current_longitude : prof.longitude;

    if (pLat == null || pLng == null) {
      // If provider has no coordinates recorded, include them with null distance
      matched.push({
        ...prof,
        distance_km: null,
      });
      continue;
    }

    const dist = haversineDistance(cLat, cLng, pLat, pLng);
    const radius = parseFloat(prof.service_radius_km) || 10.0;

    if (dist !== null && dist <= radius) {
      matched.push({
        ...prof,
        distance_km: dist,
      });
    }
  }

  // Sort matched providers: closest first, null distance at the end
  return matched.sort((a, b) => {
    if (a.distance_km === null && b.distance_km === null) return 0;
    if (a.distance_km === null) return 1;
    if (b.distance_km === null) return -1;
    return a.distance_km - b.distance_km;
  });
}

module.exports = {
  toRadians,
  haversineDistance,
  filterProvidersByDistance,
};
