/**
 * Location Utility Functions
 * 
 * The backend API returns all location data in [lng, lat] format (GeoJSON standard).
 * These utilities help transform backend location data to the format expected by the app.
 */

/**
 * Transform location from backend [lng, lat] format to app {lat, lng} format
 * @param {Array|Object} location - Location from backend (can be array or object with coordinates)
 * @returns {Object|null} - Transformed location with {lat, lng} or null if invalid
 */
export const transformLocationFromBackend = (location) => {
  if (!location) return null;

  // If location is already an object with lat/lng properties, return as-is
  if (location.lat !== undefined && location.lng !== undefined) {
    return {
      lat: Number(location.lat),
      lng: Number(location.lng),
      address: location.address || undefined,
      name: location.name || undefined,
    };
  }

  // If location has coordinates array [lng, lat]
  if (location.coordinates && Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
    return {
      lat: Number(location.coordinates[1]), // latitude is second in [lng, lat]
      lng: Number(location.coordinates[0]), // longitude is first in [lng, lat]
      address: location.address || undefined,
      name: location.name || undefined,
    };
  }

  // If location is a plain array [lng, lat]
  if (Array.isArray(location) && location.length >= 2) {
    return {
      lat: Number(location[1]), // latitude is second in [lng, lat]
      lng: Number(location[0]), // longitude is first in [lng, lat]
    };
  }

  console.warn('⚠️ Invalid location format:', location);
  return null;
};

/**
 * Transform order data from backend to app format
 * Handles all location fields in the order object
 * @param {Object} order - Order object from backend
 * @returns {Object} - Order with transformed locations
 */
export const transformOrderLocations = (order) => {
  if (!order) return null;

  const transformedOrder = { ...order };

  // Transform restaurant location
  if (order.restaurantLocation) {
    transformedOrder.restaurantLocation = transformLocationFromBackend(order.restaurantLocation);
  }

  // Transform delivery/destination location (backend may use different field names)
  if (order.deliveryLocation) {
    transformedOrder.deliveryLocation = transformLocationFromBackend(order.deliveryLocation);
  }

  if (order.destinationLocation) {
    transformedOrder.destinationLocation = transformLocationFromBackend(order.destinationLocation);
  }

  if (order.deliverLocation) {
    transformedOrder.deliverLocation = transformLocationFromBackend(order.deliverLocation);
  }

  // Transform customer location
  if (order.customerLocation) {
    transformedOrder.customerLocation = transformLocationFromBackend(order.customerLocation);
  }

  return transformedOrder;
};

/**
 * Transform multiple orders from backend
 * @param {Array} orders - Array of order objects from backend
 * @returns {Array} - Array of orders with transformed locations
 */
export const transformOrdersLocations = (orders) => {
  if (!Array.isArray(orders)) return [];
  return orders.map(order => transformOrderLocations(order));
};

/**
 * Get location coordinates as [lng, lat] for backend requests
 * Converts from app format {lat, lng} to backend format [lng, lat]
 * @param {Object} location - Location object with lat/lng
 * @returns {Array|null} - [lng, lat] array or null if invalid
 */
export const getCoordinatesForBackend = (location) => {
  if (!location) return null;
  
  if (location.lat !== undefined && location.lng !== undefined) {
    return [Number(location.lng), Number(location.lat)]; // [lng, lat] for backend
  }

  if (location.latitude !== undefined && location.longitude !== undefined) {
    return [Number(location.longitude), Number(location.latitude)]; // [lng, lat] for backend
  }

  console.warn('⚠️ Invalid location for backend conversion:', location);
  return null;
};

/**
 * Calculate distance between two locations using Haversine formula
 * @param {Object} location1 - First location {lat, lng}
 * @param {Object} location2 - Second location {lat, lng}
 * @returns {number} - Distance in kilometers
 */
export const calculateDistance = (location1, location2) => {
  if (!location1 || !location2) return 0;

  const lat1 = location1.lat || location1.latitude;
  const lng1 = location1.lng || location1.longitude;
  const lat2 = location2.lat || location2.latitude;
  const lng2 = location2.lng || location2.longitude;

  if (!lat1 || !lng1 || !lat2 || !lng2) return 0;

  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Format location for display
 * @param {Object} location - Location object
 * @returns {string} - Formatted location string
 */
export const formatLocationDisplay = (location) => {
  if (!location) return 'Location not available';

  if (location.address) return location.address;
  
  const lat = location.lat || location.latitude;
  const lng = location.lng || location.longitude;
  
  if (lat && lng) {
    return `Lat: ${Number(lat).toFixed(4)}, Lng: ${Number(lng).toFixed(4)}`;
  }

  return 'Location not available';
};

/**
 * Validate location object
 * @param {Object} location - Location object to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidLocation = (location) => {
  if (!location) return false;

  const lat = location.lat || location.latitude;
  const lng = location.lng || location.longitude;

  if (lat === undefined || lng === undefined) return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;

  return true;
};

export default {
  transformLocationFromBackend,
  transformOrderLocations,
  transformOrdersLocations,
  getCoordinatesForBackend,
  calculateDistance,
  formatLocationDisplay,
  isValidLocation,
};

