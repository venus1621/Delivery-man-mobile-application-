# Backend Location Integration Guide

## Overview

This document explains how the app integrates with the backend API which returns all location data in **[lng, lat]** format (GeoJSON standard).

## Backend Location Format

The backend API follows the **GeoJSON standard** where coordinates are always in **[longitude, latitude]** order:

```javascript
// Backend Response Format
{
  "restaurantLocation": {
    "coordinates": [38.7600, 9.0100],  // [longitude, latitude]
    "address": "Addis Ababa, Ethiopia",
    "name": "Restaurant Name"
  },
  "deliveryLocation": {
    "coordinates": [38.7650, 9.0150],  // [longitude, latitude]
    "address": "Customer Address"
  }
}
```

## App Location Format

The app internally uses **{lat, lng}** object format for easier handling:

```javascript
// App Internal Format
{
  restaurantLocation: {
    lat: 9.0100,      // latitude
    lng: 38.7600,     // longitude
    address: "Addis Ababa, Ethiopia",
    name: "Restaurant Name"
  }
}
```

## Location Transformation Utilities

All transformation logic is centralized in `utils/location-utils.js`:

### Key Functions

#### `transformLocationFromBackend(location)`
Transforms backend location to app format:
- **Input**: Backend location ([lng, lat] array or object with coordinates)
- **Output**: App location ({lat, lng} object)

```javascript
import { transformLocationFromBackend } from '../utils/location-utils';

// Example 1: Array format
const backendLocation = [38.7600, 9.0100]; // [lng, lat]
const appLocation = transformLocationFromBackend(backendLocation);
// Result: { lat: 9.0100, lng: 38.7600 }

// Example 2: Object with coordinates
const backendLocation = {
  coordinates: [38.7600, 9.0100],
  address: "Addis Ababa"
};
const appLocation = transformLocationFromBackend(backendLocation);
// Result: { lat: 9.0100, lng: 38.7600, address: "Addis Ababa" }
```

#### `transformOrderLocations(order)`
Transforms all location fields in an order object:

```javascript
import { transformOrderLocations } from '../utils/location-utils';

const backendOrder = {
  orderId: "123",
  restaurantLocation: {
    coordinates: [38.7600, 9.0100]
  },
  deliveryLocation: {
    coordinates: [38.7650, 9.0150]
  }
};

const transformedOrder = transformOrderLocations(backendOrder);
// Result: All location fields converted to {lat, lng} format
```

#### `getCoordinatesForBackend(location)`
Converts app format back to backend format for API requests:

```javascript
import { getCoordinatesForBackend } from '../utils/location-utils';

const appLocation = { lat: 9.0100, lng: 38.7600 };
const backendCoords = getCoordinatesForBackend(appLocation);
// Result: [38.7600, 9.0100] - ready for backend API
```

#### `calculateDistance(location1, location2)`
Calculate distance between two locations:

```javascript
import { calculateDistance } from '../utils/location-utils';

const distance = calculateDistance(
  { lat: 9.0100, lng: 38.7600 },
  { lat: 9.0150, lng: 38.7650 }
);
// Result: distance in kilometers
```

## Integration Points

### 1. API Response Handling (`providers/delivery-provider.js`)

All API responses are transformed when received:

```javascript
import { transformOrderLocations, transformOrdersLocations } from '../utils/location-utils';

// Single order
const response = await fetch('/api/orders/123');
const data = await response.json();
const transformedOrder = transformOrderLocations(data);

// Multiple orders
const response = await fetch('/api/orders/available');
const data = await response.json();
const transformedOrders = transformOrdersLocations(data.data);
```

#### Transformed API Endpoints:
- ✅ **Socket Events**: `deliveryMessage`, `order:cooked`
- ✅ **GET** `/api/v1/orders/get-orders-by-DeliveryMan` (Active orders)
- ✅ **GET** `/api/v1/orders/available-cooked` (Available orders)
- ✅ **GET** `/api/v1/orders/get-orders-by-DeliveryMan?status=Completed` (History)
- ✅ **Socket** `acceptOrder` response

### 2. Location Display (`app/tabs/orders.js`, `app/order/[orderId].js`)

Components automatically handle both formats for backward compatibility:

```javascript
// Handles both transformed {lat, lng} and raw coordinates array
const getLocation = (order) => {
  let lat, lng;
  
  // Check transformed format first
  if (order.restaurantLocation?.lat && order.restaurantLocation?.lng) {
    lat = order.restaurantLocation.lat;
    lng = order.restaurantLocation.lng;
  } 
  // Fallback to coordinates array [lng, lat]
  else if (order.restaurantLocation?.coordinates?.length >= 2) {
    lng = order.restaurantLocation.coordinates[0]; // longitude first
    lat = order.restaurantLocation.coordinates[1]; // latitude second
  }
  
  return { lat, lng };
};
```

### 3. Map Navigation

Map screen receives locations in app format:

```javascript
// Navigate to map with proper format
const restaurantLocation = JSON.stringify({
  lat: Number(lat),
  lng: Number(lng),
  name: 'Restaurant Name',
  address: 'Restaurant Address'
});

router.push({
  pathname: '/map',
  params: { restaurantLocation }
});
```

## Backend Field Names

The backend may use different field names for locations. All are handled:

| Backend Field | Purpose | Transformed To |
|--------------|---------|----------------|
| `restaurantLocation` | Restaurant/pickup location | `restaurantLocation` |
| `deliveryLocation` | Customer delivery location | `deliveryLocation` |
| `deliverLocation` | Alternative delivery field | `deliveryLocation` |
| `destinationLocation` | Alternative delivery field | `destinationLocation` |
| `customerLocation` | Customer location | `customerLocation` |

## Validation

Use `isValidLocation()` to validate coordinates:

```javascript
import { isValidLocation } from '../utils/location-utils';

if (isValidLocation(location)) {
  // Location is valid and has proper lat/lng
  navigateToLocation(location);
} else {
  Alert.alert('Error', 'Invalid location data');
}
```

## Display Formatting

Use `formatLocationDisplay()` for user-friendly display:

```javascript
import { formatLocationDisplay } from '../utils/location-utils';

const displayText = formatLocationDisplay(location);
// Returns: "Address" or "Lat: 9.0100, Lng: 38.7600"
```

## Important Notes

### ⚠️ Coordinate Order
- **Backend**: Always `[longitude, latitude]` (GeoJSON standard)
- **App**: Always `{lat, lng}` for clarity and consistency

### ⚠️ Transformation Points
All transformations happen at these entry points:
1. **Socket events** - When receiving real-time order updates
2. **API responses** - When fetching orders from REST endpoints
3. **Navigation** - When preparing data for map screen

### ⚠️ Firebase Integration
Locations sent to Firebase use the app format (`{lat, lng}`) for real-time tracking:

```javascript
const locationData = {
  deliveryLocation: {
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    accuracy: currentLocation.accuracy,
    timestamp: currentLocation.timestamp
  }
};
```

## Testing

To verify correct integration:

1. **Check console logs** when receiving orders:
   ```
   📍 Restaurant Location (raw): {coordinates: [38.76, 9.01], ...}
   📍 Transformed: {lat: 9.01, lng: 38.76, ...}
   ```

2. **Test navigation** - Maps should show correct locations
3. **Test distance calculation** - Should return reasonable values
4. **Test order acceptance** - Location data should persist correctly

## Troubleshooting

### Issue: Locations are swapped (latitude and longitude reversed)
**Solution**: Check if transformation is being applied. Locations from backend should always pass through `transformLocationFromBackend()`.

### Issue: Map shows wrong location
**Solution**: Verify the order of coordinates. Backend sends [lng, lat], map expects {lat, lng}.

### Issue: Distance calculation is incorrect
**Solution**: Ensure both locations use the same format (both should be {lat, lng}).

### Issue: Location not available
**Solution**: Check console logs for raw backend response. Verify backend is sending coordinates in the expected format.

## Summary

✅ **All backend location data** in [lng, lat] format is automatically transformed
✅ **All app components** use {lat, lng} format internally
✅ **Backward compatibility** maintained with fallback handling
✅ **Type safety** with proper validation and error handling
✅ **Centralized logic** in `utils/location-utils.js` for easy maintenance

For any location-related features, always use the utilities in `utils/location-utils.js` to ensure consistent handling of coordinate data.

