# 🔨 Build Commands - Gebeta Delivery App

## Prerequisites

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login to Expo Account
```bash
eas login
```

### 3. Configure Project (First Time Only)
```bash
eas build:configure
```

---

## 🚀 Build Commands

### Development Build
For testing with development features enabled:
```bash
# Android
eas build --platform android --profile development

# iOS (if needed)
eas build --platform ios --profile development
```

### Preview Build (APK)
For internal testing and sharing:
```bash
# Creates an APK file for direct installation
eas build --platform android --profile preview
```

### Production Build (Play Store)
For Play Store submission:
```bash
# Creates an Android App Bundle (AAB)
eas build --platform android --profile production

# Check build status
eas build:list

# Download latest build
eas build:download --platform android --latest
```

### Production APK (Alternative)
If you need APK instead of AAB:
```bash
# Creates release APK
eas build --platform android --profile production-apk
```

---

## 📱 Local Build Commands

### Run on Android Emulator/Device
```bash
# Development mode
npm run android

# Or using Expo
npx expo run:android
```

### Build Locally (Advanced)
```bash
# Navigate to android directory
cd android

# Clean build
./gradlew clean

# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Build release AAB (Play Store)
./gradlew bundleRelease
```

---

## 🔍 Build Status & Management

### Check Build Status
```bash
# List all builds
eas build:list

# Show specific build
eas build:view [build-id]

# Cancel running build
eas build:cancel [build-id]
```

### Download Builds
```bash
# Download latest build
eas build:download --platform android --latest

# Download specific build
eas build:download --platform android --id [build-id]
```

---

## 🎯 Submit to Play Store

### Automatic Submission (After Build)
```bash
# Submit latest production build
eas submit --platform android --latest

# Submit specific build
eas submit --platform android --id [build-id]
```

### Manual Submission
1. Build production AAB
2. Download AAB file
3. Upload to Play Console manually
4. Fill in store listing details
5. Submit for review

---

## 🧪 Testing Commands

### Install APK on Device
```bash
# Via ADB
adb install path/to/app.apk

# Force install (replace existing)
adb install -r path/to/app.apk

# Install on specific device
adb -s [device-id] install path/to/app.apk
```

### View App Logs
```bash
# View all logs
adb logcat

# Filter by app
adb logcat | grep "ReactNativeJS"

# Clear logs first
adb logcat -c && adb logcat
```

### Uninstall App
```bash
adb uninstall com.delivery.gebeta
```

---

## 🔐 Keystore Management

### Generate Production Keystore (ONE TIME ONLY!)
```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore gebeta-upload-key.keystore \
  -alias gebeta-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**IMPORTANT**: 
- Store keystore file securely (3+ backup locations)
- Save all passwords in password manager
- NEVER commit keystore to git
- Losing keystore means you cannot update the app!

### Configure EAS with Keystore
```bash
eas credentials

# Select: Android → Production → Upload new keystore
```

---

## 📊 Build Optimization

### Analyze APK Size
```bash
# Build with size analysis
cd android
./gradlew assembleRelease --scan

# Open generated URL to see detailed analysis
```

### Check Dependencies
```bash
# List all dependencies
npm list --depth=0

# Check for updates
npm outdated

# Audit for security
npm audit
```

---

## 🐛 Troubleshooting

### Clear Build Cache
```bash
# Clear Expo cache
npx expo start -c

# Clear npm cache
npm cache clean --force

# Clear Gradle cache
cd android
./gradlew clean
./gradlew cleanBuildCache

# Clear watchman cache
watchman watch-del-all
```

### Reset Everything
```bash
# Nuclear option - start fresh
rm -rf node_modules
rm -rf android/build
rm -rf android/.gradle
rm package-lock.json
npm install
```

### Common Issues

#### Issue: "Build failed with error"
**Solution**:
```bash
# Check EAS build logs
eas build:view [build-id]

# Try again with clean cache
eas build --platform android --profile production --clear-cache
```

#### Issue: "Keystore not found"
**Solution**:
```bash
# Configure credentials
eas credentials

# Or let EAS generate new keystore (NOT for published apps!)
eas build --platform android --profile production
```

#### Issue: "Version conflict"
**Solution**:
- Update version in `app.json`
- Increment versionCode for Android
- Run build again

---

## 📋 Pre-Build Checklist

Before running production build:
- [ ] Updated version number in app.json
- [ ] Updated versionCode for Android
- [ ] Tested app thoroughly
- [ ] Removed debug console.logs
- [ ] Updated changelog/release notes
- [ ] Backed up keystore (if you have one)
- [ ] Checked all API endpoints
- [ ] Verified Firebase configuration
- [ ] Created Play Store assets
- [ ] Updated app description

---

## 🚢 Deployment Workflow

### Complete Production Release Process

#### 1. Prepare
```bash
# Update version
# Edit app.json → version: "1.0.1"
# Edit app.json → android.versionCode: 2

# Test locally
npm run android
```

#### 2. Build
```bash
# Build production AAB
eas build --platform android --profile production

# Wait for build to complete (~15-30 minutes)
# Check status: eas build:list
```

#### 3. Download & Test
```bash
# Download APK version for testing
eas build --platform android --profile production-apk

# Install on test devices
adb install app.apk

# Test thoroughly
```

#### 4. Submit
```bash
# Option A: Automatic
eas submit --platform android --latest

# Option B: Manual
# 1. Download AAB
# 2. Go to Play Console
# 3. Upload to desired track
# 4. Fill in release notes
# 5. Submit for review
```

#### 5. Monitor
```bash
# Check for crashes
# Monitor Play Console
# Respond to user reviews
# Track installation metrics
```

---

## 📖 Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Play Store Publishing Guide](https://developer.android.com/studio/publish)
- [Android App Bundle Guide](https://developer.android.com/guide/app-bundle)

---

## 💡 Pro Tips

1. **Always test APK before submitting AAB**
   - Build production-apk profile
   - Install on real devices
   - Test all features

2. **Use internal testing track first**
   - Upload to internal track
   - Test with team
   - Promote to production after validation

3. **Keep build logs**
   - Save build URLs
   - Document any issues
   - Track version history

4. **Automate where possible**
   - Use EAS Submit for automatic uploads
   - Set up GitHub Actions for CI/CD
   - Automate version bumping

5. **Monitor builds**
   - Check build time trends
   - Monitor APK size over time
   - Optimize if builds get slow

---

**Last updated**: November 2024

