/**
 * Embedded Configuration File
 * 
 * This file contains all environment variables and configuration
 * embedded directly in the code instead of using external .env files
 */

// ==================== FIREBASE CONFIGURATION ====================
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBOR6P6mCqgH5nleU09l9iQEk2K9Nq9OeA',
  authDomain: 'gebeta-9595d.firebaseapp.com',
  databaseURL: 'https://gebeta-9595d-default-rtdb.firebaseio.com',
  projectId: 'gebeta-9595d',
  storageBucket: 'gebeta-9595d.firebasestorage.app',
  messagingSenderId: '403014276965',
  appId: '1:403014276965:android:aead282e171f1d260ff38c',
};

// ==================== API CONFIGURATION ====================
const API_CONFIG = {
  // Base API URL - Update this to your actual backend
  baseURL: 'https://delivery.gebeta.com/api',
  
  // API Endpoints
  endpoints: {
    auth: '/auth',
    orders: '/orders',
    deliveries: '/deliveries',
    location: '/location',
    users: '/users',
    earnings: '/earnings',
    notifications: '/notifications',
  },
  
  // Request timeout in milliseconds
  timeout: 30000,
  
  // Retry configuration
  retryAttempts: 3,
  retryDelay: 1000,
};

// ==================== APP CONFIGURATION ====================
const APP_CONFIG = {
  // App name and version
  appName: 'Delivery Application for Gebeta Delivery Service',
  appVersion: '1.0.0',
  
  // Package name (must match app.json and Android manifest)
  packageName: 'com.delivery.gebeta',
  
  // Bundle identifier for iOS
  bundleIdentifier: 'com.venus1621.deliveryapp',
  
  // Minimum SDK versions
  minSdkVersion: 24,
  targetSdkVersion: 36,
  compileSdkVersion: 36,
  
  // Deep linking origin
  deepLinkOrigin: 'https://delivery.gebeta.com/',
  
  // EAS Project ID
  easProjectId: 'a1342bd9-7823-4284-9bc1-a70e0ce44fd9',
};

// ==================== FEATURE FLAGS ====================
const FEATURE_FLAGS = {
  // Enable/disable features
  enableBarcodeScanning: true,
  enableLocationTracking: true,
  enablePushNotifications: true,
  enableOfflineMode: false,
  enableDebugMode: __DEV__, // __DEV__ is true in development, false in production
};

// ==================== PERMISSIONS ====================
const PERMISSIONS = {
  android: [
    'android.permission.VIBRATE',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.CAMERA',
  ],
  ios: {
    NSCameraUsageDescription: 'This app requires camera access to scan QR codes for order verification.',
    NSMicrophoneUsageDescription: 'This app does not use the microphone.',
    NSLocationWhenInUseUsageDescription: 'We need your location to track deliveries and provide navigation.',
    NSLocationAlwaysAndWhenInUseUsageDescription: 'We need your location to track deliveries and provide navigation.',
  },
};

// ==================== MESSAGING AND NOTIFICATIONS ====================
const MESSAGING_CONFIG = {
  // Firebase Cloud Messaging
  fcmSenderId: '403014276965',
  
  // Notification settings
  notificationChannelId: 'delivery_notifications',
  notificationChannelName: 'Delivery Notifications',
  
  // Sound and vibration
  defaultNotificationSound: 'default',
  enableVibration: true,
  vibrationPattern: [0, 250, 250, 250],
};

// ==================== LOCATION SETTINGS ====================
const LOCATION_CONFIG = {
  // Accuracy in meters
  accuracy: 6, // High accuracy
  
  // Update interval in milliseconds
  updateInterval: 5000, // 5 seconds
  
  // Distance threshold before updating location (in meters)
  distanceThreshold: 10,
  
  // Timeout for location request in milliseconds
  timeout: 30000,
  
  // Enable background location updates
  enableBackgroundLocationUpdates: true,
};

// ==================== UI/UX SETTINGS ====================
const UI_CONFIG = {
  // App theme
  theme: 'light', // 'light' or 'dark'
  
  // Default map provider
  mapProvider: 'google', // 'google' or 'mapbox'
  
  // Animation durations (in milliseconds)
  animationDuration: 300,
  transitionDuration: 200,
  
  // Splash screen settings
  splashScreenDuration: 2000,
};

// ==================== ERROR HANDLING ====================
const ERROR_CONFIG = {
  // Enable detailed error logs
  enableDetailedErrors: __DEV__,
  
  // Error reporting service (optional)
  errorReportingEnabled: !__DEV__,
  
  // Show error alerts to user
  showErrorAlerts: true,
};

// ==================== VALIDATION ====================
// Validate that all required Firebase config values are present
const validateFirebaseConfig = () => {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'databaseURL',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  const missingFields = requiredFields.filter(
    field => !FIREBASE_CONFIG[field]
  );

  if (missingFields.length > 0) {
    console.error(
      '❌ Missing Firebase configuration fields:',
      missingFields
    );
    throw new Error(
      `Missing required Firebase config fields: ${missingFields.join(', ')}`
    );
  }

  console.log('✅ Firebase configuration validated successfully');
};

// Run validation on app startup
validateFirebaseConfig();

// ==================== EXPORTS ====================
export {
  FIREBASE_CONFIG,
  API_CONFIG,
  APP_CONFIG,
  FEATURE_FLAGS,
  PERMISSIONS,
  MESSAGING_CONFIG,
  LOCATION_CONFIG,
  UI_CONFIG,
  ERROR_CONFIG,
};

// Default export with all config grouped
export default {
  firebase: FIREBASE_CONFIG,
  api: API_CONFIG,
  app: APP_CONFIG,
  features: FEATURE_FLAGS,
  permissions: PERMISSIONS,
  messaging: MESSAGING_CONFIG,
  location: LOCATION_CONFIG,
  ui: UI_CONFIG,
  errors: ERROR_CONFIG,
};

