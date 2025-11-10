# Configuration Guide

## Overview

All environment variables and configuration have been **embedded directly in the code** using `config.js`. This eliminates the need for external `.env` files.

## Configuration Structure

### 1. **Firebase Configuration** (`FIREBASE_CONFIG`)
Contains all Firebase credentials:
- `apiKey` - Firebase API key
- `authDomain` - Firebase authentication domain
- `databaseURL` - Realtime Database URL
- `projectId` - Firebase project ID
- `storageBucket` - Firebase storage bucket
- `messagingSenderId` - Firebase messaging sender ID
- `appId` - Firebase app ID

**Location:** `config.js` lines 7-14

### 2. **API Configuration** (`API_CONFIG`)
API endpoints and settings:
- `baseURL` - Base API URL
- `endpoints` - All API route endpoints
- `timeout` - Request timeout (30 seconds)
- `retryAttempts` - Number of retry attempts
- `retryDelay` - Delay between retries

**Location:** `config.js` lines 16-31

### 3. **App Configuration** (`APP_CONFIG`)
General app settings:
- `appName` - Application name
- `appVersion` - Version number
- `packageName` - Android package name
- `bundleIdentifier` - iOS bundle ID
- SDK versions for Android

**Location:** `config.js` lines 33-53

### 4. **Feature Flags** (`FEATURE_FLAGS`)
Enable/disable features:
- `enableBarcodeScanning` - QR code scanning
- `enableLocationTracking` - GPS tracking
- `enablePushNotifications` - Push notifications
- `enableDebugMode` - Debug logging

**Location:** `config.js` lines 55-62

### 5. **Other Configurations**
- `PERMISSIONS` - Android and iOS permissions
- `MESSAGING_CONFIG` - Push notification settings
- `LOCATION_CONFIG` - GPS/location settings
- `UI_CONFIG` - Theme and animation settings
- `ERROR_CONFIG` - Error handling settings

## Usage Examples

### Import Single Config
```javascript
import { FIREBASE_CONFIG } from './config';

const db = initializeApp(FIREBASE_CONFIG);
```

### Import Multiple Configs
```javascript
import { 
  FIREBASE_CONFIG, 
  API_CONFIG, 
  FEATURE_FLAGS 
} from './config';

console.log(API_CONFIG.baseURL);
console.log(FEATURE_FLAGS.enableLocationTracking);
```

### Import All Config (Default Export)
```javascript
import config from './config';

console.log(config.firebase.projectId);
console.log(config.api.endpoints.orders);
console.log(config.features.enableBarcodeScanning);
```

### Using in Components
```javascript
import React from 'react';
import { API_CONFIG, FEATURE_FLAGS } from '../config';

export default function MyComponent() {
  const apiUrl = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.orders}`;
  
  const shouldShowScanner = FEATURE_FLAGS.enableBarcodeScanning;
  
  return (
    <View>
      {shouldShowScanner && <QRScanner />}
    </View>
  );
}
```

## Modifying Configuration

To change any configuration:

1. Open `config.js`
2. Find the section you need to modify
3. Update the values
4. Save the file
5. The app will automatically use the new configuration on next run

### Example: Change API Base URL
```javascript
// Before
const API_CONFIG = {
  baseURL: 'https://delivery.gebeta.com/api',
  ...
};

// After
const API_CONFIG = {
  baseURL: 'https://api.yourdomain.com/v1',
  ...
};
```

## Benefits

✅ **No .env files needed** - Configuration is embedded in code
✅ **Type safety** - Easy to see what config is available
✅ **Centralized** - All settings in one file
✅ **Version control friendly** - Changes are tracked in git
✅ **Build friendly** - Works with EAS Build without env setup
✅ **Easy debugging** - Can easily log config values

## Security Note

⚠️ **Important:** Since these are now embedded in the code:
- Never commit API keys or secrets to public repositories
- For sensitive data (passwords, tokens), consider using:
  - Firebase Realtime Database rules
  - Backend API authentication
  - OAuth/JWT tokens
  - Environment-specific builds via EAS Build secrets

## Files Modified

- ✅ `config.js` - New embedded configuration file
- ✅ `firebase.js` - Updated to use embedded config
- ✅ Removed dependency on `.env` files

## Next Steps

1. Review the configuration in `config.js`
2. Update API endpoints to match your backend
3. Adjust feature flags based on your needs
4. Remove any `.env` files from your project
5. Update `.gitignore` to remove `.env` entries

