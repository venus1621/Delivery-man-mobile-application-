# How to Build APK Manually

## Issue
The `JAVA_HOME` is set to an invalid directory: `C:\Program Files\Eclipse Adoptium\jdk-17.0.x`

## Solution Options

### Option 1: Fix Java Path and Build Locally

#### Step 1: Find Your Java Installation
Open PowerShell and run:
```powershell
Get-ChildItem "C:\Program Files\Eclipse Adoptium" -Directory
```

Or check other common locations:
```powershell
Get-ChildItem "C:\Program Files\Java" -Directory
Get-ChildItem "C:\Program Files\Android\Android Studio\jbr" -Directory
```

#### Step 2: Set JAVA_HOME Temporarily
Once you find the correct Java directory (e.g., `jdk-17.0.12+7`), set it temporarily:
```powershell
$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-17.0.12+7"
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
```

Or if using Android Studio's bundled JDK:
```powershell
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
```

#### Step 3: Verify Java
```powershell
java -version
```

#### Step 4: Build the APK
```powershell
cd C:\Users\venus\Videos\Delivery-man-mobile-application-
cd android
.\gradlew.bat assembleRelease
```

The APK will be generated at:
```
android\app\build\outputs\apk\release\app-release.apk
```

---

### Option 2: Use Android Studio (Recommended)

#### Step 1: Open Project in Android Studio
1. Launch Android Studio
2. Click **Open an Existing Project**
3. Navigate to: `C:\Users\venus\Videos\Delivery-man-mobile-application-\android`
4. Click **OK**

#### Step 2: Build the APK
1. Wait for Gradle sync to complete
2. Go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Wait for the build to complete
4. Click **locate** in the notification to find your APK

The APK will be at:
```
android\app\build\outputs\apk\release\app-release.apk
```

---

### Option 3: Build with Development Profile (Faster)

If you just need a test APK quickly:

```powershell
# Start Metro bundler in one terminal
cd C:\Users\venus\Videos\Delivery-man-mobile-application-
npm start

# In another terminal (after fixing JAVA_HOME)
npx expo run:android --variant release
```

---

### Option 4: Fix JAVA_HOME Permanently

To fix the environment variable permanently:

1. Press **Win + R**, type `sysdm.cpl`, press Enter
2. Click **Advanced** tab
3. Click **Environment Variables**
4. Under **System variables**, find `JAVA_HOME`
5. Click **Edit**
6. Change the value to the correct Java path (e.g., `C:\Program Files\Eclipse Adoptium\jdk-17.0.12+7`)
7. Click **OK** on all dialogs
8. **Restart PowerShell** or restart your computer

---

## Quick Test Build Command

After fixing JAVA_HOME, run this single command:

```powershell
cd C:\Users\venus\Videos\Delivery-man-mobile-application-\android; .\gradlew.bat clean assembleRelease
```

---

## Expected Output Location

After successful build, your APK will be at:
```
C:\Users\venus\Videos\Delivery-man-mobile-application-\android\app\build\outputs\apk\release\app-release.apk
```

You can then:
1. Copy it to your phone
2. Enable "Install from Unknown Sources" in Android settings
3. Install and test the app

---

## Troubleshooting

### If you get "SDK location not found"
Create a file `android/local.properties` with:
```properties
sdk.dir=C:\\Users\\venus\\AppData\\Local\\Android\\Sdk
```

### If you get memory errors
Edit `android/gradle.properties` and add:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

### If build fails with dependency errors
```powershell
cd android
.\gradlew.bat clean
.\gradlew.bat assembleRelease --refresh-dependencies
```

