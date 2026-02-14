# Testing Guide - iOS & Android

## Prerequisites

### For iOS Testing:
- ✅ macOS computer (required for iOS development)
- ✅ Xcode installed (from Mac App Store)
- ✅ iOS Simulator (comes with Xcode)
- ✅ CocoaPods installed: `sudo gem install cocoapods`

### For Android Testing:
- ✅ Android Studio installed
- ✅ Android SDK installed
- ✅ Android Emulator set up (or physical device)
- ✅ Java Development Kit (JDK) installed

### For Both:
- ✅ Node.js installed
- ✅ Expo CLI: `npm install -g expo-cli`
- ✅ OpenAI API key added to `cronos-app/core/constants.ts`

---

## Method 1: Using Expo Go (Easiest - Physical Device)

### iOS (iPhone/iPad):
1. **Install Expo Go** from the App Store on your iPhone
2. **Start the dev server:**
   ```bash
   cd cronos-app
   npx expo start
   ```
3. **Scan QR code** with your iPhone Camera app
4. App opens in Expo Go

### Android (Phone/Tablet):
1. **Install Expo Go** from Google Play Store
2. **Start the dev server:**
   ```bash
   cd cronos-app
   npx expo start
   ```
3. **Scan QR code** with Expo Go app (not camera)
4. App opens in Expo Go

### Limitations of Expo Go:
- ⚠️ Some native modules might not work
- ⚠️ Limited to Expo SDK features
- ⚠️ Cannot test custom native code

---

## Method 2: Development Build (Recommended - Full Features)

This method creates a native app with all features working.

### iOS Simulator:

**Step 1: Install dependencies**
```bash
cd cronos-app
npm install
```

**Step 2: Install iOS pods**
```bash
cd ios
pod install
cd ..
```

**Step 3: Build and run**
```bash
npx expo run:ios
```

This will:
- Build the native iOS app
- Launch iOS Simulator automatically
- Install the app
- Start Metro bundler

**Alternative - Specific simulator:**
```bash
# List available simulators
xcrun simctl list devices

# Run on specific device
npx expo run:ios --device "iPhone 15 Pro"
```

**Step 4: Reload changes**
- Press `r` in terminal to reload
- Or shake device (Cmd+Ctrl+Z) → "Reload"

### Android Emulator:

**Step 1: Start Android Emulator**
- Open Android Studio
- Click "Device Manager" (phone icon)
- Click ▶️ on an emulator (or create one)
- Wait for emulator to boot

**Step 2: Build and run**
```bash
cd cronos-app
npx expo run:android
```

This will:
- Build the native Android app
- Install on running emulator
- Start Metro bundler

**Alternative - Physical device:**
```bash
# Enable USB debugging on your Android phone
# Connect via USB
npx expo run:android --device
```

**Step 3: Reload changes**
- Press `r` in terminal to reload
- Or press `R` twice on device

---

## Method 3: Physical Device (Development Build)

### iOS (Physical iPhone):

**Step 1: Set up Apple Developer account**
- Free account works for testing
- Sign in to Xcode with Apple ID

**Step 2: Connect iPhone**
- Connect iPhone via USB
- Trust computer on iPhone

**Step 3: Build and run**
```bash
cd cronos-app
npx expo run:ios --device
```

**Step 4: Trust developer certificate**
- Settings → General → VPN & Device Management
- Trust your developer certificate

### Android (Physical Phone):

**Step 1: Enable Developer Mode**
- Settings → About Phone
- Tap "Build Number" 7 times
- Developer options enabled

**Step 2: Enable USB Debugging**
- Settings → Developer Options
- Enable "USB Debugging"

**Step 3: Connect phone**
- Connect via USB
- Allow USB debugging on phone

**Step 4: Verify connection**
```bash
adb devices
# Should show your device
```

**Step 5: Build and run**
```bash
cd cronos-app
npx expo run:android --device
```

---

## Testing Both Platforms Simultaneously

### Option 1: Two terminals

**Terminal 1 (iOS):**
```bash
cd cronos-app
npx expo run:ios
```

**Terminal 2 (Android):**
```bash
cd cronos-app
npx expo run:android
```

Both will share the same Metro bundler.

### Option 2: Expo Dev Client

**Build dev clients once:**
```bash
# iOS
npx expo run:ios

# Android  
npx expo run:android
```

**Then use Expo start:**
```bash
npx expo start --dev-client
```

Now you can:
- Press `i` for iOS
- Press `a` for Android
- Both connect to same dev server

---

## Quick Testing Commands

### Start fresh (clean build):
```bash
# iOS
cd cronos-app
npx expo run:ios --clean

# Android
npx expo run:android --clean
```

### Specific device:
```bash
# iOS - specific simulator
npx expo run:ios --device "iPhone 15 Pro"

# Android - list devices first
adb devices
npx expo run:android --device <device-id>
```

### Production build (for testing):
```bash
# iOS
npx expo build:ios

# Android
npx expo build:android
```

---

## Troubleshooting

### iOS Issues:

**"No devices found"**
```bash
# Open simulator manually
open -a Simulator

# Then run
npx expo run:ios
```

**"Pod install failed"**
```bash
cd ios
pod deintegrate
pod install
cd ..
```

**"Build failed"**
```bash
# Clean build
cd ios
xcodebuild clean
cd ..
npx expo run:ios --clean
```

### Android Issues:

**"No devices found"**
```bash
# Check emulator is running
adb devices

# Start emulator from command line
emulator -avd <emulator-name>
```

**"Build failed"**
```bash
# Clean gradle
cd android
./gradlew clean
cd ..
npx expo run:android --clean
```

**"Metro bundler port in use"**
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Or use different port
npx expo start --port 8082
```

---

## Testing Voice Input Feature

### Test Cases:

**1. Single Task:**
- Say: "Remind me tomorrow at 10 AM to call mom"
- Check: 1 task created with correct date/time

**2. Multiple Tasks:**
- Say: "Call John at 9 AM, buy groceries at 5 PM, and go to gym at 7 PM"
- Check: 3 tasks created with correct times

**3. Today vs Tomorrow:**
- Say: "Remind me today at 5 PM"
- Check: Uses today's date (Feb 1)
- Say: "Remind me tomorrow at 10 AM"
- Check: Uses tomorrow's date (Feb 2)

**4. Relative Time:**
- Say: "Remind me in 20 minutes to check email"
- Check: Time is 20 minutes from now

**5. No Time:**
- Say: "Water plants, feed cat, and take out trash"
- Check: 3 tasks created without due dates

### Check Logs:

**iOS:**
- Xcode → Window → Devices and Simulators → Open Console
- Or check terminal output

**Android:**
- Android Studio → Logcat
- Or use: `adb logcat | grep OpenAI`

### Verify:
- ✅ Transcription works (Whisper API)
- ✅ Task parsing works (GPT-4o-mini)
- ✅ Correct dates (Feb 1 for today, Feb 2 for tomorrow)
- ✅ Notifications scheduled
- ✅ Tasks sync to Supabase

---

## Performance Testing

### Test on Both Platforms:

1. **Recording duration** - Should auto-stop at 45 seconds
2. **Processing time** - Should complete within 10 seconds
3. **Multiple tasks** - Should handle 5+ tasks
4. **Network issues** - Should show clear error messages
5. **Permissions** - Should request microphone access

### Compare iOS vs Android:

| Feature | iOS | Android |
|---------|-----|---------|
| Audio format | M4A/AAC | M4A/AAC |
| Recording quality | High | High |
| Transcription | Same API | Same API |
| Notifications | Native | Native |
| Sync | Same | Same |

---

## Debugging Tips

### Enable Debug Mode:
```bash
# iOS
npx expo run:ios --configuration Debug

# Android
npx expo run:android --variant debug
```

### View Network Requests:
- Install React Native Debugger
- Or use Chrome DevTools (press `j` in terminal)

### Check API Calls:
```bash
# Watch console logs
# Look for [OpenAI] prefix
```

### Test Without Device:
```bash
# Use web version for quick testing
npx expo start --web
# Note: Voice input won't work on web
```

---

## CI/CD Testing (Optional)

### GitHub Actions:
```yaml
# .github/workflows/test.yml
name: Test
on: [push]
jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npx expo run:ios --simulator
```

### EAS Build (Expo Application Services):
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build for both platforms
eas build --platform all
```

---

## Summary

**Easiest:** Expo Go on physical device (limited features)
**Recommended:** Development build on simulator/emulator (full features)
**Production:** Build and test on physical devices

**Quick Start:**
```bash
# iOS
cd cronos-app
npx expo run:ios

# Android
cd cronos-app
npx expo run:android
```

Both platforms will work identically with your voice input feature! 🎤✅
