# 🚀 Order Tracking Quick Start

## For Delivery Guy App

### What Happens When You Accept an Order:

1. ✅ Order data saved to `state.activeOrder`
2. ✅ Firebase path created: `deliveryOrders/{orderId}/`
3. ✅ Location sent every 3 seconds to BOTH:
   - `deliveryGuys/{userId}/` (your general location)
   - `deliveryOrders/{orderId}/` (order-specific tracking)

### Expected Logs:

```
📦 Accepting order via socket: {orderId}
✅ Order accepted successfully
🚀 Initializing Firebase tracking for order: {orderId}
✅ Order tracking initialized successfully in Firebase
📍 Firebase Path: deliveryOrders/{orderId}
🔥 Customer can now track this order in real-time

[Every 3 seconds:]
🔥 Delivery guy location sent to Firebase: {userId}
🔍 Active Order Check: { hasActiveOrder: true, orderId: "...", status: "Accepted" }
📦 Sending location to order tracking: {orderId}
✅ Order location updated successfully in Firebase
```

---

## For Customer App

### How to Track an Order:

```typescript
import { ref, onValue } from 'firebase/database';
import { database } from './firebase';

// Replace with actual order ID
const orderId = "YOUR_ORDER_ID_HERE";
const orderRef = ref(database, `deliveryOrders/${orderId}`);

onValue(orderRef, (snapshot) => {
  const data = snapshot.val();
  
  if (data && data.deliveryLocation) {
    console.log('Delivery Guy Location:', data.deliveryLocation);
    console.log('Status:', data.status);
    console.log('Delivery Person:', data.deliveryPerson.name);
    
    // Update your map marker here
    updateMap(
      data.deliveryLocation.latitude,
      data.deliveryLocation.longitude
    );
  }
});
```

### Expected Data:

```javascript
{
  orderId: "67ad123...",
  orderCode: "ORD-123456",
  status: "Accepted",
  deliveryLocation: {
    latitude: 8.9899716,
    longitude: 38.7540354,
    accuracy: 39.6,
    timestamp: 1760960414385
  },
  deliveryPerson: {
    id: "68ac61f8...",
    name: "John Doe",
    phone: "+251912345678",
    deliveryMethod: "Bicycle"
  },
  lastLocationUpdate: "2025-01-20T10:30:45.123Z",
  restaurantLocation: {...},
  customerLocation: {...}
}
```

---

## Firebase Paths

### Path 1: General Delivery Guy Tracking
```
deliveryGuys/{userId}/
├── currentLocation
├── deliveryPerson
├── activeOrderId  ← Links to active order
└── locationHistory/
```

### Path 2: Order-Specific Tracking (Use this for customer app!)
```
deliveryOrders/{orderId}/
├── deliveryLocation  ← Current delivery guy position
├── deliveryPerson
├── status
├── restaurantLocation
├── customerLocation
└── locationHistory/
```

---

## Quick Debug Commands

### Check if order tracking is working:

**Delivery Guy App Console:**
```javascript
// Check active order
console.log('Active Order:', state.activeOrder);

// Should show order ID
console.log('Order ID:', state.activeOrder?.orderId);
```

**Firebase Console:**
```
1. Go to Firebase Console
2. Realtime Database → Data
3. Look for: deliveryOrders/{your-order-id}
4. Should see deliveryLocation updating every 3 seconds
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| "No active order" in logs | Accept an order first |
| `orderId: undefined` | Check order acceptance flow |
| Customer can't see location | Verify order ID matches |
| Location not updating | Check internet connection |
| Firebase permission error | Update security rules |

---

## Status Flow

```
Order Accepted → PickedUp → InTransit → Delivered
     ↓              ↓           ↓          ↓
  10 sec        5 sec        3 sec     Stop
 (interval)   (interval)   (interval)  (tracking)
```

---

## Test Checklist

- [ ] Accept an order in delivery guy app
- [ ] See "Order tracking initialized" log
- [ ] Check Firebase Console for `deliveryOrders/{orderId}`
- [ ] Verify location updates every 3 seconds
- [ ] Customer app can read the data
- [ ] Map marker moves with delivery guy

---

## 🎯 Ready to Use!

Your system is now configured for real-time order tracking by order ID! 

**Delivery Guy Side:** ✅ Automatically sends location to order path
**Customer Side:** ✅ Can track order using the order ID

🚀 Happy Tracking!

