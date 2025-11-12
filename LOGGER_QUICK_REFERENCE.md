# Logger Quick Reference

## Import
```javascript
import { logger } from './utils/logger';
```

## Methods

### Development-Only (Hidden in Production)
```javascript
logger.log('message')           // General logging
logger.info('message')          // Info messages
logger.debug('msg', data)       // Debug info
logger.table(array)             // Display as table
logger.time('label')            // Start timer
logger.timeEnd('label')         // End timer
logger.trace()                  // Stack trace
logger.clear()                  // Clear console
logger.group('name', () => {})  // Group logs
```

### Always Shown (Dev & Production)
```javascript
logger.error('msg', error)      // Error messages
logger.warn('message')          // Warnings
logger.assert(condition, 'msg') // Assert
```

## Environment

```javascript
__DEV__  // true in development, false in production
```

## Examples

### Basic
```javascript
logger.log('User logged in');
logger.error('Login failed:', error);
logger.warn('Deprecated method');
```

### With Data
```javascript
logger.log('User:', { id: 1, name: 'John' });
logger.table([{id: 1, name: 'John'}, {id: 2, name: 'Jane'}]);
```

### Performance
```javascript
logger.time('fetch');
// ... code ...
logger.timeEnd('fetch'); // Shows elapsed time
```

### Grouped
```javascript
logger.group('API Calls', () => {
  logger.log('Request 1');
  logger.log('Request 2');
});
```

## Migration

```javascript
// OLD
console.log(x)    → logger.log(x)
console.info(x)   → logger.info(x)
console.debug(x)  → logger.debug(x)

// KEEP (don't change these)
console.error(x)  → console.error(x)
console.warn(x)   → console.warn(x)
```

## Files Already Updated

✅ config.js
✅ firebase.js
✅ services/location-service.js
✅ utils/notification-settings.js

## Files to Update

- providers/auth-provider.js
- providers/delivery-provider.js
- components/QRScanner.js
- components/VerificationModal.js
- components/OrderModal.js
- examples/DeliveryTrackingExample.js

## Behavior

| Context | Development | Production |
|---------|-------------|-----------|
| `logger.log()` | Shows | Hidden |
| `logger.error()` | Shows | Shows |
| `logger.warn()` | Shows | Shows |

## Documentation

- `LOGGER_GUIDE.md` - Complete documentation
- `LOGGER_SETUP_SUMMARY.md` - Setup overview
- `utils/logger.js` - Source code

---

**That's it!** Replace `console.log` with `logger.log` and you're done.



