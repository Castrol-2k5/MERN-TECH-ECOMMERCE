/**
 * Utilities for Geolocation, Distance Calculation, and Map Deep Links
 */

/**
 * Extract [latitude, longitude] from diverse branch location formats
 * @param {Object} branch
 * @returns {{ lat: number, lng: number } | null}
 */
export const extractBranchCoordinates = (branch) => {
  if (!branch) return null;

  // GeoJSON standard: coordinates = [longitude, latitude]
  if (branch.location && Array.isArray(branch.location.coordinates) && branch.location.coordinates.length >= 2) {
    const lng = Number(branch.location.coordinates[0]);
    const lat = Number(branch.location.coordinates[1]);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      return { lat, lng };
    }
  }

  // Direct properties
  if (branch.latitude !== undefined && branch.longitude !== undefined) {
    const lat = Number(branch.latitude);
    const lng = Number(branch.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  // Fallback defaults for known demo branches if coordinates are missing
  const code = (branch.branchCode || branch.code || branch.branchId || '').toUpperCase();
  if (code.includes('Q1') || code.includes('HQ')) {
    return { lat: 10.7725, lng: 106.6917 };
  }
  if (code.includes('TDUC') || code.includes('THUDUC')) {
    return { lat: 10.8512, lng: 106.7645 };
  }
  if (code.includes('Q5')) {
    return { lat: 10.7538, lng: 106.6662 };
  }

  return null;
};

/**
 * Calculate Great-Circle Distance between two coordinates in Kilometers (Haversine Formula)
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;

  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // Round to 1 decimal place (e.g. 2.4 km)
};

/**
 * Format distance in human-friendly Vietnamese
 * @param {number|null} distanceKm
 * @returns {string}
 */
export const formatDistance = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return '';
  }
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `Cách bạn ~${meters}m`;
  }
  return `Cách bạn ~${distanceKm.toFixed(1)} km`;
};

/**
 * Estimate urban travel time by motorbike (average ~25 km/h in city)
 */
export const estimateTravelTime = (distanceKm) => {
  if (!distanceKm || isNaN(distanceKm)) return null;
  const minutes = Math.max(3, Math.round((distanceKm / 25) * 60));
  if (minutes < 60) {
    return `~${minutes} phút đi xe`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `~${hours}h ${remainingMins}p đi xe`;
};

/**
 * Build Google Maps Navigation URL for Turn-by-Turn directions
 */
export const getGoogleMapsDirectionsUrl = ({ destLat, destLng, destAddress, userLat, userLng }) => {
  let originParam = '';
  if (userLat && userLng) {
    originParam = `&origin=${userLat},${userLng}`;
  }
  const destParam =
    destLat && destLng
      ? `${destLat},${destLng}`
      : encodeURIComponent(destAddress || 'TechOne Store');

  return `https://www.google.com/maps/dir/?api=1${originParam}&destination=${destParam}&travelmode=driving`;
};
