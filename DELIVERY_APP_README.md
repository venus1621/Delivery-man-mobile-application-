# Gebeta Delivery Driver Mobile App

A modern React Native mobile application for delivery drivers to manage orders, track deliveries, and communicate with the backend system via WebSocket connections.

## 🚀 Features

### Core Functionality
- **Real-time Order Management**: Receive new orders instantly via WebSocket connections
- **Order Acceptance**: Accept or decline available delivery orders
- **Order Tracking**: Track active orders from pickup to delivery
- **Verification System**: Verify pickups and deliveries with customer codes
- **Delivery History**: View completed deliveries with earnings analytics
- **User Profile**: Manage personal information and delivery preferences

### Technical Features
- **WebSocket Integration**: Real-time communication with backend server
- **JWT Authentication**: Secure login and session management
- **Offline Support**: Works with cached data when connection is lost
- **Push Notifications**: Receive order alerts and updates
- **Location Services**: Navigation to restaurants and delivery addresses
- **Modern UI/UX**: Beautiful, intuitive interface with smooth animations

## 📱 App Structure

```
app/
├── _layout.js              # Root layout with providers
├── index.js                # Authentication routing
├── login.js                # Login screen
├── order/
│   └── [orderId].js        # Order details screen
└── tabs/
    ├── _layout.js          # Tab navigation layout
    ├── dashboard.js        # Main dashboard
    ├── orders.js           # Available orders list
    ├── history.js          # Delivery history
    └── profile.js          # User profile
```

## 🔧 Backend Integration

### Authentication
- **Endpoint**: `https://gebeta-delivery1.onrender.com/api/v1/users/login`
- **Method**: POST
- **Payload**: `{ "phone": "+251911111111", "password": "+251911111111" }`
- **Response**: JWT token and user data including `deliveryMethod`

### WebSocket Connection
- **Server**: `https://gebeta-delivery1.onrender.com`
- **Authentication**: JWT token sent in `auth.token`
- **Auto-join**: Automatically joins delivery group based on user's `deliveryMethod`

### Key API Endpoints
- `GET /api/v1/orders/get-orders-by-DeliveryMan` - Fetch delivery person's orders
- `POST /api/v1/orders/accept-for-delivery` - Accept an order
- `POST /api/v1/orders/verify-delivery` - Verify delivery completion
- `GET /api/v1/orders/available-cooked` - Get available orders

## 🔌 WebSocket Events

### Incoming Events (from server)
- `deliveryMessage` - New order notification with order data
- `order:cooked` - Order is ready for pickup
- `order:accepted` - Order accepted by another driver
- `message` - General delivery messages
- `errorMessage` - Error notifications

### Outgoing Events (to server)
- Socket connection automatically authenticates with JWT token
- Delivery person joins appropriate delivery method room (Car, Motor, Bicycle)

## 📊 Order Data Structure

```javascript
{
  orderId: "string",
  order_id: "string", 
  orderCode: "string",
  restaurantLocation: {
    name: "string",
    address: "string",
    lat: number,
    lng: number
  },
  deliveryLocation: {
    address: "string",
    lat: number,
    lng: number
  },
  deliveryFee: number,
  tip: number,
  grandTotal: number,
  orderStatus: "Cooked" | "Delivering" | "Completed",
  verificationCode: "string",
  userPhone: "string",
  createdAt: "ISO string",
  customer: {
    name: "string",
    phone: "string"
  },
  items: [{ name: "string", quantity: number }],
  specialInstructions: "string"
}
```

## 🎨 UI Components

### Dashboard
- **Status Toggle**: Online/Offline status for receiving orders
- **Connection Status**: Real-time server connection indicator
- **Stats Cards**: Available orders, today's earnings, deliveries count
- **Active Order**: Current order being delivered
- **Quick Actions**: Navigate to orders, history, profile

### Orders Screen
- **Available Orders**: List of orders ready for acceptance
- **Order Cards**: Detailed order information with earnings
- **Accept Button**: One-tap order acceptance
- **Filter Options**: Filter by distance, value, etc.

### History Screen
- **Completed Deliveries**: Chronological list of past deliveries
- **Earnings Analytics**: Total earnings, averages, performance metrics
- **Time Filters**: View by today, week, month, or all time
- **Sort Options**: Sort by date, earnings, etc.

### Profile Screen
- **User Information**: Name, phone, email, delivery method
- **Work Settings**: Notifications, preferences, working areas
- **Account Actions**: Edit profile, help, about, logout

## 🔐 Security Features

- **JWT Token Storage**: Secure token storage in AsyncStorage
- **Token Validation**: Automatic token validation on app start
- **Session Management**: Automatic logout on token expiry
- **Secure WebSocket**: Authenticated WebSocket connections
- **Data Encryption**: Sensitive data encrypted in storage

## 📱 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project_structure
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web (for testing)
   npm run web
   ```

## 🧪 Testing

### Demo Account
- **Phone**: `+251911111111`
- **Password**: `+251911111111`
- **Role**: Delivery_Person
- **Delivery Method**: Car

### Test Features
- Use the debug buttons on the dashboard to test various features
- Test socket connection with different delivery methods
- Test order acceptance and verification flows

## 🚀 Deployment

### Development Build
```bash
expo build:android
expo build:ios
```

### Production Build
```bash
expo build:android --release-channel production
expo build:ios --release-channel production
```

## 📝 Configuration

### Environment Variables
The app connects to the production backend by default. To change the server URL, update the WebSocket connection in `providers/delivery-provider.js`:

```javascript
const socket = io("https://gebeta-delivery1.onrender.com", {
  transports: ["websocket"],
  auth: { token: token }
});
```

### Backend Configuration
Ensure your backend server is configured to:
- Accept JWT tokens for WebSocket authentication
- Join delivery persons to appropriate delivery method rooms
- Send order notifications via `deliveryMessage` events
- Handle order acceptance and verification API calls

## 🔄 Data Flow

1. **Login**: User logs in with phone/password
2. **Authentication**: JWT token stored and used for API calls
3. **WebSocket Connection**: Authenticated connection established
4. **Room Joining**: Automatically joined to delivery method room
5. **Order Reception**: Receive real-time order notifications
6. **Order Acceptance**: Accept orders via API call
7. **Order Tracking**: Track order status and location
8. **Delivery Verification**: Verify delivery with customer code
9. **History Storage**: Completed deliveries stored locally

## 🐛 Troubleshooting

### Common Issues

1. **Socket Connection Failed**
   - Check internet connection
   - Verify server URL is correct
   - Ensure JWT token is valid

2. **Orders Not Loading**
   - Verify user is online
   - Check authentication status
   - Refresh orders manually

3. **Order Acceptance Failed**
   - Ensure user has no active orders
   - Check order availability
   - Verify API endpoint is accessible

### Debug Tools
- Use debug buttons on dashboard for testing
- Check console logs for detailed error information
- Use network inspector to monitor API calls

## 📞 Support

For technical support or questions:
- Check the debug information in the app
- Review console logs for error details
- Contact the development team with specific error messages

## 🔄 Updates

### Version 1.0.0
- Initial release with core delivery functionality
- WebSocket integration with backend
- Real-time order management
- Delivery history and analytics
- User profile management

---

**Built with ❤️ for Gebeta Delivery**
