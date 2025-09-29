import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, MapPin, Navigation, RefreshCw } from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Location from 'expo-location';
import { useLocationTracking } from '../services/location-service';
import MapView, { Marker, Polyline } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const { restaurantLocation } = useLocalSearchParams();

  console.log('🗺️ Map screen loaded with params:', { restaurantLocation });
  console.log('🗺️ Map component rendering...');

  // Use location tracking service
  const {
    location: currentLocation,
    isTracking,
    error: locationError,
    startTracking,
    calculateDistance,
  } = useLocationTracking();

  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [movementPath, setMovementPath] = useState([]);
  const movementPathRef = useRef([]);
  const [isTrackingMovement, setIsTrackingMovement] = useState(false);
  const mapRef = useRef(null);
  const isCalculatingRef = useRef(false);

  // Parse and validate restaurant location from params. Memoize so the object
  // identity is stable between renders and doesn't retrigger effects.
  const restaurant = React.useMemo(() => {
    if (!restaurantLocation) return null;
    try {
      const parsed = JSON.parse(restaurantLocation);
      if (typeof parsed.lat !== 'number' || typeof parsed.lng !== 'number') {
        throw new Error('Invalid latitude or longitude');
      }
      return parsed;
    } catch (error) {
      console.error('Error parsing restaurant location:', error);
      Alert.alert('Error', 'Invalid restaurant location data. Please try again.');
      return null;
    }
  }, [restaurantLocation]);

  console.log('🏪 Parsed restaurant data:', restaurant);

  useEffect(() => {
    initializeLocation();
  }, []);

  // Start route calculation and movement tracking when either the user's
  // location or the requested restaurant location changes. Use the raw
  // restaurantLocation string as the dependency so this effect doesn't run on
  // every render due to a new parsed-object identity.
  useEffect(() => {
    if (currentLocation && restaurant) {
      calculateRoute();
      startMovementTracking();
    }
  }, [currentLocation, restaurantLocation]);

  // Track movement when location changes
  useEffect(() => {
    if (currentLocation && isTrackingMovement) {
      movementPathRef.current = [
        ...movementPathRef.current,
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          timestamp: Date.now(),
        },
      ];
      setMovementPath(movementPathRef.current);
    }
  }, [currentLocation, isTrackingMovement]);

  useEffect(() => {
    if (locationError) {
      Alert.alert('Location Error', locationError);
    }
  }, [locationError]);

  // Fit map to route coordinates
  useEffect(() => {
    if (routeCoordinates.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(routeCoordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [routeCoordinates]);

  const initializeLocation = async () => {
    try {
      setIsInitializing(true);
      await startTracking();
      setLocationPermission(true);
    } catch (error) {
      console.error('Error initializing location:', error);
      Alert.alert(
        'Location Permission Required',
        'Please enable location access to use navigation features.',
        [
          { text: 'Cancel', onPress: () => router.back() },
          { text: 'Retry', onPress: initializeLocation },
        ]
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const calculateRoute = async () => {
    if (!currentLocation || !restaurant) return;
    if (isCalculatingRef.current) {
      // Avoid overlapping route requests
      return;
    }
    isCalculatingRef.current = true;

    try {
      setIsLoadingRoute(true);

      // Get route coordinates using OSRM
      const route = await getRouteCoordinates(
        currentLocation.latitude,
        currentLocation.longitude,
        restaurant.lat,
        restaurant.lng
      );

      if (route && route.length > 0) {
        setRouteCoordinates(route);
        console.log('🗺️ Route calculated with', route.length, 'points');
      } else {
        // Fallback: create simple straight line route
        const fallbackRoute = [
          { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
          { latitude: restaurant.lat, longitude: restaurant.lng },
        ];
        setRouteCoordinates(fallbackRoute);
        console.log('🗺️ Using fallback straight line route');
      }

      // Calculate distance
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        restaurant.lat,
        restaurant.lng
      );

      console.log('🗺️ Route calculated, distance:', distance.toFixed(2), 'km');
    } catch (error) {
      console.error('Error calculating route:', error);
      // Fallback route
      const fallbackRoute = [
        { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
        { latitude: restaurant.lat, longitude: restaurant.lng },
      ];
      setRouteCoordinates(fallbackRoute);
    } finally {
      setIsLoadingRoute(false);
      isCalculatingRef.current = false;
    }
  };

  // Get route coordinates using OSRM API
  const getRouteCoordinates = async (startLat, startLng, endLat, endLng) => {
    try {
      // Use OSRM's public demo server (no API key required)
      const url = `http://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`OSRM API request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.routes && data.routes[0] && data.routes[0].geometry) {
        const coordinates = data.routes[0].geometry.coordinates;
        return coordinates.map(coord => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
      }

      Alert.alert('Warning', 'No route found. Using fallback straight line route.');
      return null;
    } catch (error) {
      console.error('Error fetching route coordinates:', error);
      Alert.alert('Error', 'Failed to fetch route from OSRM. Please check your network connection.');
      return null;
    }
  };

  // Start movement tracking
  const startMovementTracking = () => {
    setIsTrackingMovement(true);
    movementPathRef.current = [];
    setMovementPath([]);
    console.log('🚶 Movement tracking started');
  };

  // Stop movement tracking
  const stopMovementTracking = () => {
    setIsTrackingMovement(false);
    console.log('🚶 Movement tracking stopped');
  };

  // Clear movement path
  const clearMovementPath = () => {
    movementPathRef.current = [];
    setMovementPath([]);
    console.log('🗑️ Movement path cleared');
  };

  const refreshLocation = async () => {
    try {
      await startTracking();
    } catch (error) {
      console.error('Error refreshing location:', error);
    }
  };

  const openInExternalMaps = async () => {
    if (!currentLocation || !restaurant) return;

    const url = `https://www.google.com/maps/dir/${currentLocation.latitude},${currentLocation.longitude}/${restaurant.lat},${restaurant.lng}`;

    try {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Cannot open maps application');
        }
      }
    } catch (error) {
      console.error('Error opening maps:', error);
      Alert.alert('Error', 'Failed to open maps application');
    }
  };

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color="#1F2937" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Navigation</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentLocation || !restaurant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color="#1F2937" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Navigation</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.errorContainer}>
          <MapPin color="#EF4444" size={48} />
          <Text style={styles.errorTitle}>Location Error</Text>
          <Text style={styles.errorMessage}>
            Unable to get your location or restaurant location. Please try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshLocation}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#1F2937" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Navigation</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshLocation}>
          <RefreshCw color="#1E40AF" size={20} />
        </TouchableOpacity>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <View style={styles.webMapContainer}>
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(currentLocation.longitude, restaurant.lng) - 0.01},${Math.min(currentLocation.latitude, restaurant.lat) - 0.01},${Math.max(currentLocation.longitude, restaurant.lng) + 0.01},${Math.max(currentLocation.latitude, restaurant.lat) + 0.01}&layer=mapnik&marker=${currentLocation.latitude},${currentLocation.longitude}&marker=${restaurant.lat},${restaurant.lng}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
            />
            {/* Route and Movement Overlay */}
            <View style={styles.mapOverlay}>
              <View style={styles.routeInfo}>
                <Text style={styles.routeInfoText}>Route: {routeCoordinates.length} points</Text>
                <Text style={styles.routeInfoText}>Movement: {movementPath.length} points</Text>
                <Text style={styles.routeInfoText}>Tracking: {isTrackingMovement ? 'ON' : 'OFF'}</Text>
              </View>
            </View>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.nativeMapContainer}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation
          >
            {/* Current Location Marker */}
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              title="Your Location"
              pinColor="#1E40AF"
            />
            {/* Restaurant Marker */}
            <Marker
              coordinate={{
                latitude: restaurant.lat,
                longitude: restaurant.lng,
              }}
              title={restaurant.name || 'Restaurant'}
              pinColor="#EF4444"
            />
            {/* Route Polyline */}
            {routeCoordinates.length > 0 && (
              <Polyline coordinates={routeCoordinates} strokeColor="#1E40AF" strokeWidth={3} />
            )}
            {/* Movement Path Polyline */}
            {movementPath.length > 0 && (
              <Polyline coordinates={movementPath} strokeColor="#10B981" strokeWidth={3} />
            )}
          </MapView>
        )}

        {/* Loading Overlay */}
        {isLoadingRoute && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#1E40AF" />
            <Text style={styles.loadingOverlayText}>Calculating route...</Text>
          </View>
        )}
      </View>

      {/* Bottom Info Panel */}
      <View style={styles.infoPanel}>
        <LinearGradient colors={['#FFFFFF', '#F8FAFC']} style={styles.infoGradient}>
          <View style={styles.infoContent}>
            <View style={styles.locationInfo}>
              <View style={styles.locationItem}>
                <View style={[styles.locationDot, styles.currentLocationDot]} />
                <Text style={styles.locationText}>Your Location</Text>
              </View>
              <View style={styles.locationItem}>
                <View style={[styles.locationDot, styles.restaurantLocationDot]} />
                <Text style={styles.locationText}>{restaurant.name || 'Restaurant'}</Text>
              </View>
            </View>

            <View style={styles.distanceInfo}>
              <Text style={styles.distanceLabel}>Distance to Restaurant:</Text>
              <Text style={styles.distanceValue}>
                {calculateDistance(
                  currentLocation.latitude,
                  currentLocation.longitude,
                  restaurant.lat,
                  restaurant.lng
                ).toFixed(2)}{' '}
                km
              </Text>
            </View>

            <TouchableOpacity style={styles.openMapsButton} onPress={openInExternalMaps}>
              <LinearGradient colors={['#1E40AF', '#1D4ED8']} style={styles.openMapsGradient}>
                <Navigation color="#FFFFFF" size={20} />
                <Text style={styles.openMapsText}>Open in Google Maps</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Movement Control Buttons */}
            <View style={styles.movementControls}>
              <TouchableOpacity
                style={[
                  styles.movementButton,
                  isTrackingMovement ? styles.movementButtonActive : styles.movementButtonInactive,
                ]}
                onPress={isTrackingMovement ? stopMovementTracking : startMovementTracking}
              >
                <Text style={styles.movementButtonText}>
                  {isTrackingMovement ? 'Stop Tracking' : 'Start Tracking'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.movementButton} onPress={clearMovementPath}>
                <Text style={styles.movementButtonText}>Clear Path</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  refreshButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  webMapContainer: {
    width: '100%',
    height: '100%',
  },
  nativeMapContainer: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlayText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '600',
  },
  infoPanel: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  infoGradient: {
    padding: 20,
  },
  infoContent: {
    gap: 16,
  },
  locationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  currentLocationDot: {
    backgroundColor: '#1E40AF',
  },
  restaurantLocationDot: {
    backgroundColor: '#EF4444',
  },
  locationText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  distanceInfo: {
    alignItems: 'center',
  },
  distanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  distanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  openMapsButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  openMapsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  openMapsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mapOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 8,
  },
  routeInfo: {
    gap: 4,
  },
  routeInfoText: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '600',
  },
  movementControls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  movementButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  movementButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  movementButtonInactive: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  movementButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
});