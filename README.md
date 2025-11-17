# 🚚 Gebeta Delivery - Driver Application

Professional delivery driver application for Gebeta Delivery Service. Track orders, navigate to destinations, and manage deliveries efficiently.

## 📱 Features

- ✅ Real-time order notifications
- ✅ GPS navigation to pickup and delivery locations
- ✅ Background location tracking during deliveries
- ✅ Earnings tracking and analytics
- ✅ QR code verification for orders
- ✅ Order history and performance metrics
- ✅ Firebase real-time synchronization
- ✅ Offline support
- ✅ Push notifications

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI
- EAS CLI (for building)
- Android Studio (for Android development)

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd Delivery-man-mobile-application-

# Install dependencies
npm install

# Start development server
npm start
```

### Running on Device

```bash
# Android
npm run android

# Or scan QR code with Expo Go app
```

## 🔨 Building for Production

### First Time Setup

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure
```

### Build Commands

```bash
# Build production AAB for Play Store
npm run build:android

# Build APK for testing
npm run build:android:apk

# Check build status
npm run build:status

# Submit to Play Store
npm run submit:android
```

## 📚 Documentation

### Production Preparation
- **[PRODUCTION_READY_SUMMARY.md](./PRODUCTION_READY_SUMMARY.md)** - Start here! Complete overview
- **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** - Detailed pre-launch checklist
- **[PLAY_STORE_ASSETS.md](./PLAY_STORE_ASSETS.md)** - Asset requirements and guidelines
- **[BUILD_COMMANDS.md](./BUILD_COMMANDS.md)** - All build and deployment commands
- **[PRIVACY_POLICY_TEMPLATE.md](./PRIVACY_POLICY_TEMPLATE.md)** - Privacy policy template

### Key Configuration Files
- **app.json** - App configuration and permissions
- **eas.json** - Build profiles
- **android/gradle.properties** - Android optimizations
- **firebase.js** - Firebase configuration

## 🎯 Project Structure

```
├── app/                    # Expo Router pages
│   ├── tabs/              # Tab navigation screens
│   ├── order/             # Order detail screens
│   └── ...
├── components/            # Reusable components
├── providers/             # Context providers (auth, delivery)
├── services/              # Business logic (location, balance)
├── utils/                 # Utility functions
├── assets/                # Images, fonts, sounds
├── android/               # Native Android project
└── docs/                  # Documentation (you're reading this!)
```

## 🔐 Environment Configuration

### Required API Keys

1. **Google Maps API Key**
   - Add to `app.json` at line 63
   - Enable Maps SDK for Android

2. **Firebase Configuration**
   - Fetched dynamically from backend API
   - Configured in `firebase.js`

## 🧪 Testing

```bash
# Run linter
npm run lint

# Test on emulator
npm run android

# Install specific APK
adb install path/to/app.apk
```

## 📦 Technologies

- **Framework**: React Native (Expo)
- **Navigation**: Expo Router
- **State Management**: React Context + Hooks
- **Maps**: React Native Maps / Google Maps
- **Real-time**: Socket.IO + Firebase Realtime Database
- **Location**: Expo Location
- **Camera**: Expo Camera (QR scanning)
- **Build**: EAS Build
- **Backend**: Node.js REST API

## 🌟 Key Features Implementation

### Location Tracking
- Foreground and background location updates
- Dynamic update intervals (configurable from backend)
- Real-time Firebase synchronization
- Efficient battery usage

### Order Management
- Real-time order notifications
- One-tap accept/decline
- QR code verification
- Proof of delivery

### Navigation
- Integrated Google Maps
- Turn-by-turn directions
- ETA calculations
- Proximity alerts

## 🔧 Configuration

### App Settings
- Package: `com.delivery.gebeta`
- Min SDK: 24 (Android 7.0)
- Target SDK: 36
- Version: 1.0.0

### Permissions
- Location (Foreground & Background)
- Camera (QR scanning)
- Vibration (Notifications)
- Foreground Service (Location tracking)
- Wake Lock (Keep app active)

## 🚨 Important Notes

### Before First Production Build

1. ✅ Update `app.json` - Add Google Maps API key
2. ✅ Create Play Store assets (screenshots, feature graphic)
3. ✅ Host privacy policy
4. ✅ Generate production keystore
5. ✅ Test thoroughly on real devices

### Security

- **Never commit**:
  - Keystore files (*.keystore)
  - API keys in code
  - Service account JSON
  - Private keys

- **Always backup**:
  - Production keystore
  - Keystore passwords
  - API credentials

## 📈 Performance Optimizations

- ✅ ProGuard/R8 enabled
- ✅ Resource shrinking enabled
- ✅ Hermes JavaScript engine
- ✅ New React Native architecture
- ✅ Build caching
- ✅ Code splitting

## 🐛 Troubleshooting

### Build fails
```bash
eas build --platform android --profile production --clear-cache
```

### Location not updating
- Check permissions granted
- Verify Firebase initialization
- Check background location permission

### Maps not showing
- Verify API key in app.json
- Enable Maps SDK in Google Cloud Console

## 📞 Support

- **Documentation**: See `/docs` folder
- **Issues**: Create GitHub issue
- **Email**: support@gebeta.com

## 📄 License

[Your License Here]

## 👥 Contributors

[Your Team Here]

---

## 🎯 Production Status

**Current Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: November 2024

### Ready for:
- ✅ Internal testing
- ✅ Beta testing
- ✅ Play Store submission

### TODO:
- [ ] Add Google Maps API key
- [ ] Create Play Store assets
- [ ] Host privacy policy
- [ ] Generate production keystore

---

## 🔗 Quick Links

- [Production Summary](./PRODUCTION_READY_SUMMARY.md)
- [Build Guide](./BUILD_COMMANDS.md)
- [Asset Guide](./PLAY_STORE_ASSETS.md)
- [Checklist](./PRODUCTION_CHECKLIST.md)

---

**Built with ❤️ for Gebeta Delivery**

