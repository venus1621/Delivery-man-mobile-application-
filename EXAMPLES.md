# Configuration Usage Examples

## Common Use Cases

### 1. Making API Calls

```javascript
import { API_CONFIG } from '../config';

// Using fetch
async function fetchOrders() {
  const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.orders}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) throw new Error('Failed to fetch orders');
    return await response.json();
  } catch (error) {
    console.error('Error fetching orders:', error);
  }
}
```

### 2. Using Location Services

```javascript
import { LOCATION_CONFIG } from '../config';
import * as Location from 'expo-location';

async function startLocationTracking() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  
  if (status !== 'granted') {
    console.error('Permission denied');
    return;
  }

  Location.watchPositionAsync(
    {
      accuracy: LOCATION_CONFIG.accuracy,
      timeInterval: LOCATION_CONFIG.updateInterval,
      distanceInterval: LOCATION_CONFIG.distanceThreshold,
    },
    (location) => {
      console.log('Location:', location);
    }
  );
}
```

### 3. Conditional Feature Rendering

```javascript
import { FEATURE_FLAGS } from '../config';

export default function CameraScreen() {
  if (!FEATURE_FLAGS.enableBarcodeScanning) {
    return <Text>Barcode scanning is disabled</Text>;
  }

  return (
    <View>
      <QRScanner />
    </View>
  );
}
```

### 4. Firebase Database Operations

```javascript
import { database } from '../firebase';
import { ref, set, get } from 'firebase/database';

async function saveDeliveryLocation(deliveryId, location) {
  const dbRef = ref(database, `deliveries/${deliveryId}`);
  
  try {
    await set(dbRef, {
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: Date.now(),
    });
    console.log('Location saved to Firebase');
  } catch (error) {
    console.error('Failed to save location:', error);
  }
}
```

### 5. Debug Mode Logging

```javascript
import { ERROR_CONFIG, FEATURE_FLAGS } from '../config';

function debugLog(message, data) {
  if (ERROR_CONFIG.enableDetailedErrors || FEATURE_FLAGS.enableDebugMode) {
    console.log(`[DEBUG] ${message}`, data);
  }
}

// Usage
debugLog('Order received:', orderData);
```

### 6. Dynamic Notification Setup

```javascript
import { MESSAGING_CONFIG, PERMISSIONS } from '../config';
import * as Notifications from 'expo-notifications';

async function setupNotifications() {
  // Set notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Configure sound
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: MESSAGING_CONFIG.notificationChannelName,
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: MESSAGING_CONFIG.vibrationPattern,
      sound: MESSAGING_CONFIG.defaultNotificationSound,
    });
  }
}
```

### 7. UI Theming

```javascript
import { UI_CONFIG } from '../config';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    // Apply theme
    const theme = UI_CONFIG.theme === 'dark' ? darkTheme : lightTheme;
    applyTheme(theme);

    // Set animation durations
    setAnimationDuration(UI_CONFIG.animationDuration);
  }, []);

  return <YourApp />;
}
```

### 8. App Info Display

```javascript
import { APP_CONFIG } from '../config';

function AppInfoScreen() {
  return (
    <View>
      <Text>App: {APP_CONFIG.appName}</Text>
      <Text>Version: {APP_CONFIG.appVersion}</Text>
      <Text>Package: {APP_CONFIG.packageName}</Text>
    </View>
  );
}
```

### 9. Environment-Specific Logic

```javascript
import { FEATURE_FLAGS, ERROR_CONFIG } from '../config';

// Development-only features
if (FEATURE_FLAGS.enableDebugMode) {
  // Show debug menu, performance monitor, etc.
  console.log('Debug mode enabled');
}

// Production error reporting
if (ERROR_CONFIG.errorReportingEnabled) {
  // Send errors to Sentry, Firebase Crashlytics, etc.
  enableErrorReporting();
}
```

### 10. API Request with Error Handling

```javascript
import { API_CONFIG, ERROR_CONFIG } from '../config';

async function apiRequest(endpoint, options = {}, retryCount = 0) {
  const url = `${API_CONFIG.baseURL}${endpoint}`;

  try {
    const response = await fetch(url, {
      timeout: API_CONFIG.timeout,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (ERROR_CONFIG.enableDetailedErrors) {
      console.error(`Request to ${endpoint} failed:`, error);
    }

    // Retry logic
    if (retryCount < API_CONFIG.retryAttempts) {
      await new Promise(resolve =>
        setTimeout(resolve, API_CONFIG.retryDelay)
      );
      return apiRequest(endpoint, options, retryCount + 1);
    }

    throw error;
  }
}

// Usage
const orders = await apiRequest(API_CONFIG.endpoints.orders);
```

## Real-World Scenarios

### Scenario 1: Order Tracking with Location Updates

```javascript
import { LOCATION_CONFIG, API_CONFIG, FEATURE_FLAGS } from '../config';
import { database } from '../firebase';

async function trackOrderDelivery(orderId) {
  if (!FEATURE_FLAGS.enableLocationTracking) {
    console.warn('Location tracking is disabled');
    return;
  }

  // Start tracking location
  const subscription = await Location.watchPositionAsync(
    {
      accuracy: LOCATION_CONFIG.accuracy,
      timeInterval: LOCATION_CONFIG.updateInterval,
    },
    async (location) => {
      // Save to Firebase
      await saveDeliveryLocation(orderId, location);

      // Send to backend API
      await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.location}`,
        {
          method: 'POST',
          body: JSON.stringify({
            orderId,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }),
        }
      );
    }
  );

  return subscription;
}
```

### Scenario 2: QR Code Scanner with Error Handling

```javascript
import { Camera } from 'expo-camera';
import { FEATURE_FLAGS, ERROR_CONFIG } from '../config';

export default function QRScannerScreen() {
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(async () => {
    if (!FEATURE_FLAGS.enableBarcodeScanning) {
      return;
    }

    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  }, []);

  const handleBarCodeScanned = async (data) => {
    try {
      // Validate QR code
      if (!data.data) {
        throw new Error('Invalid QR code');
      }

      // Process barcode
      await processQRCode(data.data);
    } catch (error) {
      if (ERROR_CONFIG.showErrorAlerts) {
        alert('Error scanning QR code: ' + error.message);
      }
      if (ERROR_CONFIG.enableDetailedErrors) {
        console.error('QR scan error:', error);
      }
    }
  };

  return (
    <Camera
      onBarCodeScanned={handleBarCodeScanned}
      barCodeScannerSettings={{
        barCodeTypes: ['qr'], // From FEATURE_FLAGS could be expanded
      }}
    />
  );
}
```

### Scenario 3: Notification Management

```javascript
import * as Notifications from 'expo-notifications';
import { MESSAGING_CONFIG, PERMISSIONS } from '../config';

async function initializeNotifications() {
  // Request permissions based on config
  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== 'granted') {
    console.warn('Notification permission denied');
    return;
  }

  // Set up notification channel for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(
      MESSAGING_CONFIG.notificationChannelId,
      {
        name: MESSAGING_CONFIG.notificationChannelName,
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: MESSAGING_CONFIG.vibrationPattern,
        sound: MESSAGING_CONFIG.defaultNotificationSound,
        enableVibrate: MESSAGING_CONFIG.enableVibration,
      }
    );
  }

  // Listen for notifications
  const subscription = Notifications.addNotificationResponseListener(
    (response) => {
      const data = response.notification.request.content.data;
      handleNotificationResponse(data);
    }
  );

  return subscription;
}
```

## Tips & Best Practices

### ✅ DO

- Import config at the top of your files
- Use named imports for better tree-shaking
- Organize related config in the appropriate sections
- Use feature flags for gradual rollouts
- Cache config values if used frequently

### ❌ DON'T

- Modify config during runtime
- Commit sensitive data to public repositories
- Use config values directly in loops without caching
- Create circular dependencies between config and other modules
- Ignore the validation warnings

## Performance Optimization

For frequently used config values, cache them:

```javascript
// In your component
const API_BASE_URL = useMemo(() => API_CONFIG.baseURL, []);
const TIMEOUT = useMemo(() => API_CONFIG.timeout, []);

// In repeated operations
const LOCATION_INTERVAL = LOCATION_CONFIG.updateInterval; // Cache this
```

## More Help

For more information, see:
- `CONFIG_USAGE.md` - Complete configuration reference
- `ENVIRONMENT_SETUP.md` - Setup and architecture guide
- `config.js` - Full configuration source code

