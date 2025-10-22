# Delivery Tracking System

This enhanced delivery tracking system provides real-time location updates to Firebase Realtime Database for comprehensive delivery monitoring.

## Features

### 🚀 Enhanced Location Tracking
- **Real-time location updates** sent to Firebase Realtime Database
- **Location history tracking** for complete delivery journey
- **Dynamic update intervals** based on delivery status
- **Automatic status management** with Firebase synchronization

### 📍 Location Update Intervals
- **Accepted**: 10 seconds (driver heading to restaurant)
- **PickedUp**: 5 seconds (driver heading to customer)  
- **InTransit**: 3 seconds (actively delivering)
- **Delivered**: Stops updates (delivery completed)

### 🔥 Firebase Database Structure
```
deliveryOrders/
  └── {orderId}/
      ├── orderId: string
      ├── orderCode: string
      ├── status: string
      ├── acceptedAt: timestamp
      ├── deliveryPerson: object
      ├── restaurantLocation: object
      ├── deliveryLocation: object
      ├── deliveryFee: number
      ├── tip: number
      ├── trackingEnabled: boolean
      ├── lastLocationUpdate: timestamp
      ├── deliveryLocation: object (current location)
      └── locationHistory/
          └── {timestamp}/
              ├── latitude: number
              ├── longitude: number
              ├── accuracy: number
              ├── timestamp: number
              ├── status: string
              └── recordedAt: timestamp
```

## Usage

### Basic Implementation

```javascript
import { useDelivery } from '../providers/delivery-provider';

const MyComponent = () => {
  const { 
    activeOrder, 
    updateDeliveryStatus, 
    sendLocationUpdate,
    initializeOrderTracking 
  } = useDelivery();

  // Update delivery status
  const handleStatusUpdate = async (newStatus) => {
    await updateDeliveryStatus(activeOrder.orderId, newStatus, {
      pickedUpAt: new Date().toISOString()
    });
  };

  // Send manual location update
  const handleLocationUpdate = async () => {
    await sendLocationUpdate(activeOrder.orderId);
  };
};
```

### Using DeliveryStatusManager Component

```javascript
import DeliveryStatusManager from '../components/DeliveryStatusManager';

<DeliveryStatusManager 
  orderId={activeOrder.orderId}
  currentStatus={activeOrder.status}
  onStatusUpdate={(newStatus) => {
    console.log(`Status updated to: ${newStatus}`);
  }}
/>
```

## API Reference

### Delivery Provider Functions

#### `updateDeliveryStatus(orderId, status, additionalData)`
Updates the delivery status in Firebase and adjusts location tracking interval.

**Parameters:**
- `orderId` (string): The order ID
- `status` (string): New status ('Accepted', 'PickedUp', 'InTransit', 'Delivered')
- `additionalData` (object): Additional data to store with status update

**Returns:** Promise<boolean>

#### `sendLocationUpdate(orderId)`
Sends a manual location update to Firebase.

**Parameters:**
- `orderId` (string): The order ID

**Returns:** Promise<boolean>

#### `initializeOrderTracking(orderData)`
Initializes Firebase tracking for a new order.

**Parameters:**
- `orderData` (object): Order information

**Returns:** Promise<boolean>

#### `getLocationUpdateInterval(status)`
Gets the optimal location update interval for a given status.

**Parameters:**
- `status` (string): Delivery status

**Returns:** number (interval in milliseconds)

#### `updateLocationTrackingInterval(status)`
Updates the location tracking interval based on delivery status.

**Parameters:**
- `status` (string): Delivery status

**Returns:** void

## Delivery Status Flow

1. **Order Accepted** → Firebase tracking initialized
2. **Picked Up** → Location updates every 5 seconds
3. **In Transit** → Location updates every 3 seconds  
4. **Delivered** → Tracking stops

## Firebase Security Rules

Ensure your Firebase Realtime Database has proper security rules:

```json
{
  "rules": {
    "deliveryOrders": {
      "$orderId": {
        ".read": "auth != null",
        ".write": "auth != null && 
                   (data.child('deliveryPerson/id').val() == auth.uid || 
                    !data.exists())"
      }
    }
  }
}
```

## Error Handling

The system includes comprehensive error handling:

- **Location permission errors**: Graceful fallback with user notifications
- **Firebase connection errors**: Automatic retry with exponential backoff
- **Network errors**: Offline queue with sync when connection restored
- **Invalid order data**: Validation with clear error messages

## Performance Considerations

- **Battery optimization**: Dynamic intervals reduce battery drain
- **Data efficiency**: Only essential location data sent
- **Background tracking**: Proper cleanup when app backgrounded
- **Memory management**: Automatic cleanup of completed orders

## Monitoring and Analytics

Track delivery performance with Firebase Analytics:

```javascript
// Example analytics events
analytics().logEvent('delivery_status_update', {
  order_id: orderId,
  status: newStatus,
  timestamp: new Date().toISOString()
});
```

## Troubleshooting

### Common Issues

1. **Location not updating**: Check location permissions
2. **Firebase errors**: Verify database rules and connection
3. **High battery usage**: Adjust location update intervals
4. **Missing location history**: Check Firebase write permissions

### Debug Mode

Enable debug logging:

```javascript
// In your app initialization
console.log('Delivery tracking debug mode enabled');
```

## Future Enhancements

- [ ] Geofencing for automatic status updates
- [ ] Route optimization integration
- [ ] Customer notification system
- [ ] Delivery analytics dashboard
- [ ] Offline mode with sync
