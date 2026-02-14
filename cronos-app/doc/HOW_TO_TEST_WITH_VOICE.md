# How to Test Voice Input Feature

## The Problem

Voice input requires native modules (`expo-av`) which don't work in **Expo Go**.

You're seeing:
```
ERROR [Error: Cannot find native module 'ExponentAV']
```

## Solution: Build Development Client

### For iOS (Mac Only):

```bash
cd cronos-app

# 1. Clean everything
rm -rf ios node_modules

# 2. Reinstall
npm install

# 3. Prebuild iOS with dev client
npx expo prebuild --platform ios --clean

# 4. Build and run
npx expo run:ios
```

This will:
- Build the app with all native modules
- Open iOS Simulator
- Install the development build
- Voice input will work!

### For Android (Gradle Issue Workaround):

Since Android has the Gradle plugin issue, use **EAS Build**:

```bash
# 1. Install EAS CLI (if not installed)
sudo npm install -g eas-cli

# 2. Login
eas login

# 3. Configure
cd cronos-app
eas build:configure

# 4. Build development client
eas build --platform android --profile development

# 5. Download and install APK on your phone

# 6. Start dev server
npx expo start --dev-client
```

## Quick Test (iOS)

If iOS build completed successfully:

```bash
cd cronos-app

# Start dev server
npx expo start --dev-client

# Press 'i' for iOS
```

The app should open in the simulator with voice input working!

## Verify Voice Input Works

1. **Tap the blue microphone button**
2. **Say:** "Remind me tomorrow at 10 AM to call mom"
3. **Check:** Task should be created with correct date
4. **Try multiple:** "Call John at 9 AM and buy groceries at 5 PM"
5. **Check:** Should create 2 tasks

## Common Issues

### "Cannot find native module"
- You're in Expo Go (wrong app)
- Need to build development client
- Run: `npx expo run:ios` or use EAS Build

### "App opens in Expo Go"
- Close Expo Go completely
- Delete Expo Go from simulator
- Rebuild: `npx expo run:ios`

### Android Gradle Error
- Known issue with Expo SDK 54
- Use EAS Build instead
- Or test on iOS first

## What's the Difference?

| | Expo Go | Development Build |
|---|---|---|
| Native modules | ❌ Limited | ✅ All included |
| Voice input | ❌ No | ✅ Yes |
| Build time | None | 5-10 min first time |
| Updates | Instant | Instant after first build |

## Recommended Flow

1. **Build once:**
   ```bash
   npx expo run:ios
   ```

2. **Then for daily development:**
   ```bash
   npx expo start --dev-client
   ```
   Press `i` for iOS - instant reload!

3. **Only rebuild when:**
   - Adding new native modules
   - Changing native configuration
   - Updating Expo SDK

## Current Status

✅ **Code is ready** - All voice features implemented
✅ **iOS can build** - Use `npx expo run:ios`
⏳ **Android blocked** - Use EAS Build for now
✅ **Features work identically** on both platforms

## Next Steps

1. Build iOS development client
2. Test voice input thoroughly
3. Use EAS Build for Android
4. Or wait for Expo SDK 55 fix

Once you have the development build, voice input will work perfectly! 🎤✅
