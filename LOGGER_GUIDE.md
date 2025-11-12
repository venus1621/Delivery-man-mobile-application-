# Logger Guide - Environment-based Logging

## Overview

A custom logger utility has been implemented to automatically handle console logging based on the environment:

- **Development (`__DEV__` = true)**: All logs are displayed in the console
- **Production (`__DEV__` = false)**: All development logs are suppressed for performance

## Benefits

✅ **Performance**: Removes console logs from production builds  
✅ **Security**: Prevents sensitive information from being exposed in production logs  
✅ **Debugging**: Full logging in development for easier debugging  
✅ **Simple API**: Drop-in replacement for `console`  

## Quick Start

### Import the Logger

```javascript
import { logger } from './utils/logger';
```

### Use Instead of `console.log`

```javascript
// ❌ Old way
console.log('Loading data...');

// ✅ New way
logger.log('Loading data...');
```

## Logger Methods

### Development-only Methods

These methods **only log in development**, removed in production:

| Method | Usage | Example |
|--------|-------|---------|
| `logger.log()` | General logging | `logger.log('Data loaded')` |
| `logger.info()` | Info messages | `logger.info('Process started')` |
| `logger.debug()` | Debug messages | `logger.debug('Value:', value)` |
| `logger.table()` | Display data as table | `logger.table(data)` |
| `logger.group()` | Group related logs | `logger.group('API', () => {...})` |
| `logger.time()` | Start timer | `logger.time('api-call')` |
| `logger.timeEnd()` | End timer | `logger.timeEnd('api-call')` |
| `logger.trace()` | Show stack trace | `logger.trace()` |
| `logger.clear()` | Clear console | `logger.clear()` |

### Always-logged Methods (Dev & Production)

These methods **log in both environments** (use for errors/warnings):

| Method | Usage | Example |
|--------|-------|---------|
| `logger.error()` | Error logging | `logger.error('Failed to load:', err)` |
| `logger.warn()` | Warning logging | `logger.warn('Deprecated method')` |
| `logger.assert()` | Assertion checking | `logger.assert(condition, 'message')` |

## Usage Examples

### Basic Logging

```javascript
import { logger } from './utils/logger';

// These show in development, hidden in production
logger.log('User logged in');
logger.info('Starting process');
logger.debug('Variable value:', myVariable);

// These always show
logger.warn('This is deprecated');
logger.error('Failed to fetch data', error);
```

### With Data

```javascript
// Log objects and arrays
logger.log('User data:', {
  id: 123,
  name: 'John',
  email: 'john@example.com'
});

// Display data as table
const users = [
  { id: 1, name: 'John' },
  { id: 2, name: 'Jane' }
];
logger.table(users);
```

### Performance Tracking

```javascript
// Time an operation
logger.time('data-fetch');

// ... perform operation ...

logger.timeEnd('data-fetch');
// Output: "data-fetch: 1234.56ms" (development only)
```

### Grouped Logs

```javascript
logger.group('API Requests', () => {
  logger.log('Request 1: /api/users');
  logger.log('Request 2: /api/posts');
  logger.log('Request 3: /api/comments');
});
```

## Environment Detection

The logger automatically detects the environment:

```javascript
// __DEV__ is a global variable in React Native / Expo
// true during development
// false in production/release builds

if (__DEV__) {
  // Development-only code
}
```

## Migration from console.log

### Before

```javascript
console.log('Loading');
console.error('Failed', error);
console.debug('Debug info:', data);
console.table(array);
```

### After

```javascript
logger.log('Loading');
logger.error('Failed', error);
logger.debug('Debug info:', data);
logger.table(array);
```

## Best Practices

### ✅ DO

- Use `logger.log()` for informational messages
- Use `logger.error()` for actual errors
- Use `logger.warn()` for warnings
- Use `logger.debug()` for development debugging
- Keep logger imports at the top of files

### ❌ DON'T

- Don't use `console.log()` directly (use logger instead)
- Don't log sensitive data in production (use error/warn only)
- Don't create conditional logic around logger calls
- Don't use logger.error() for non-error messages

## Examples in Code

### Example 1: API Call Logging

```javascript
import { logger } from './utils/logger';

async function fetchUserData(userId) {
  try {
    logger.log('Fetching user:', userId);
    
    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();
    
    logger.log('User data fetched:', data);
    return data;
  } catch (error) {
    logger.error('Failed to fetch user data:', error);
    throw error;
  }
}
```

### Example 2: Location Tracking

```javascript
import { logger } from './utils/logger';

function startLocationTracking() {
  logger.log('📍 Location tracking started');
  
  watchLocation((position) => {
    logger.debug('Location update:', {
      lat: position.lat,
      lng: position.lng
    });
  });
}

function stopLocationTracking() {
  logger.log('📍 Location tracking stopped');
}
```

### Example 3: User Authentication

```javascript
import { logger } from './utils/logger';

async function login(phone) {
  try {
    logger.log('🔐 Attempting login for:', phone);
    
    const response = await authAPI.login(phone);
    
    logger.log('✅ Login successful');
    logger.info('User ID:', response.userId);
    
    return response;
  } catch (error) {
    logger.error('❌ Login failed:', error.message);
    throw error;
  }
}
```

### Example 4: Error Handling

```javascript
import { logger } from './utils/logger';

function processOrder(orderId) {
  try {
    logger.debug('Processing order:', orderId);
    
    // ... processing logic ...
    
    logger.log('✅ Order processed successfully');
  } catch (error) {
    // Always logs - even in production
    logger.error('Failed to process order:', error);
    
    // Additional context (dev only)
    logger.debug('Order details:', orderData);
  }
}
```

## Files Already Updated

The following files have been updated to use the new logger:

- ✅ `config.js` - Firebase config validation
- ✅ `firebase.js` - Firebase initialization
- ✅ `utils/notification-settings.js` - Notification logging
- ✅ `services/location-service.js` - Location tracking logs

## Bulk Update Other Files

For files that still use `console.log`, follow this pattern:

1. **Add import at top:**
   ```javascript
   import { logger } from './utils/logger';
   ```

2. **Replace console.log calls:**
   ```javascript
   // Replace
   console.log(...) → logger.log(...)
   console.debug(...) → logger.debug(...)
   console.info(...) → logger.info(...)
   
   // Keep as-is (important for errors)
   console.error(...) → console.error(...) [keep as-is]
   console.warn(...) → console.warn(...) [keep as-is]
   ```

## API Reference

### logger.log(...args)
Log general information (dev only)
```javascript
logger.log('User data:', userData);
```

### logger.info(...args)
Log info message (dev only)
```javascript
logger.info('Process completed');
```

### logger.debug(...args)
Log debug information (dev only)
```javascript
logger.debug('Debug info:', debugData);
```

### logger.warn(...args)
Log warning (always shown)
```javascript
logger.warn('Deprecated API usage');
```

### logger.error(...args)
Log error (always shown)
```javascript
logger.error('Request failed:', error);
```

### logger.table(data)
Display data as table (dev only)
```javascript
logger.table([{id: 1, name: 'John'}, {id: 2, name: 'Jane'}]);
```

### logger.time(label)
Start performance timer (dev only)
```javascript
logger.time('api-call');
```

### logger.timeEnd(label)
End performance timer (dev only)
```javascript
logger.timeEnd('api-call'); // Shows elapsed time
```

### logger.group(label, fn)
Group related logs (dev only)
```javascript
logger.group('API', () => {
  logger.log('Request 1');
  logger.log('Request 2');
});
```

### logger.trace(...args)
Show stack trace (dev only)
```javascript
logger.trace('Stack trace:', data);
```

### logger.assert(condition, message)
Assert condition (always shown if fails)
```javascript
logger.assert(value !== null, 'Value must not be null');
```

### logger.clear()
Clear console (dev only)
```javascript
logger.clear();
```

## Testing

### In Development
```javascript
npm run start
// You should see all logs in the console
```

### In Production Build
```javascript
eas build -p android --profile production
// Logs from logger.log() will NOT appear
// But logger.error() and logger.warn() WILL appear
```

## Environment Variables

The logger uses the global `__DEV__` variable:

- **Development:** `__DEV__ === true`
- **Production:** `__DEV__ === false`

This is automatically set by React Native / Expo.

## Troubleshooting

### Q: Logs aren't showing in development
**A:** Make sure you're using `npm start` or `expo start`, not a production build

### Q: Logs are showing in production
**A:** Make sure you're not using `console.log()` directly; use `logger.log()` instead

### Q: How do I force production behavior in development?
**A:** You can't with this logger by design. For testing, use `console.log()` directly if needed

## Summary

The logger utility provides:
- ✅ **Automatic environment detection** - No manual configuration needed
- ✅ **Production-safe logging** - Debug logs removed automatically
- ✅ **Easy migration** - Simple find-and-replace from console.log
- ✅ **Full API** - Includes all common logging methods
- ✅ **Type-safe** - Works with all data types

For more info on environment-based development, see `ENVIRONMENT_SETUP.md`.



