# Build Android App with EAS - Quick Start Guide

## 🚨 Why You Need This

**Expo Go doesn't support the Android audio configuration needed for voice input.**

You need to build a **custom development build** using EAS (Expo Application Services).

---

## ⏱️ Time Required

- **First time:** 15-20 minutes
- **Subsequent builds:** 10-15 minutes

---

## 📋 Prerequisites

1. **Expo account** (free) - Sign up at expo.dev
2. **Android device** with USB debugging enabled
3. **Terminal** access

---

## 🚀 Step-by-Step Instructions

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

**Expected output:**
```
added 1 package in 5s
```

---

### Step 2: Login to Expo

```bash
eas login
```

**You'll be prompted for:**
- Email or username
- Password

**Expected output:**
```
✔ Logged in as your-username
```

---

### Step 3: Configure EAS

```bash
cd cronos-app
eas build:configure
```

**You'll be asked:**
```
? Would you like to automatically create an EAS project for @your-username/cronos-app?
```
**Answer:** Yes

**This creates:** `eas.json` file in your project

---

### Step 4: Build Development APK

```bash
eas build --platform android --profile development
```

**You'll be asked:**
```
? Would you like to automatically create an Android project?
```
**Answer:** Yes

```
? Generate a new Android Keystore?
```
**Answer:** Yes

**Build process starts:**
```
✔ Build started
✔ Build in progress...
  This may take 10-15 minutes
```

**Wait for:**
```
✔ Build finished
✔ Download: https://expo.dev/accounts/...
```

---

### Step 5: Download and Install APK

**Option A: Direct Download**
1. Click the download link from terminal
2. Download .apk file to your computer
3. Transfer to Android device
4. Install the .apk

**Option B: QR Code**
1. Scan QR code shown in terminal
2. Download directly on Android device
3. Install the .apk

**Installation:**
- Open .apk file on Android
- Tap "Install"
- Allow "Install from unknown sources" if prompted
- Wait for installation to complete

---

### Step 6: Run the App

**On your computer:**
```bash
cd cronos-app
npx expo start --dev-client
```

**On your Android device:**
1. Open the installed app (Cronos)
2. It will connect to your development server
3. App loads with all your code changes

---

### Step 7: Test Voice Input

1. Tap the blue microphone button
2. Wait 1 second
3. Say: "Buy milk tomorrow"
4. Wait 1 second
5. Tap the button again

**Expected result:**
- ✅ Transcription: "Buy milk tomorrow"
- ✅ Task created successfully
- ✅ No more "BELL" error!

---

## 🔄 Making Code Changes

### After building once:

**You DON'T need to rebuild for most changes!**

1. Make code changes in your editor
2. Save the file
3. App automatically reloads (hot reload)

**You ONLY need to rebuild if:**
- You change native dependencies
- You modify `app.json` or `eas.json`
- You add new native modules

---

## 📱 Alternative: Expo Dev Client

If EAS Build is too slow, try Expo Dev Client:

```bash
# Install dev client
npx expo install expo-dev-client

# Build once
eas build --profile development --platform android

# Then use like Expo Go
npx expo start --dev-client
```

**Benefits:**
- Faster than rebuilding each time
- Hot reload works
- Supports native code
- Works like Expo Go but better

---

## ❓ Troubleshooting

### Issue: "eas: command not found"

**Solution:**
```bash
npm install -g eas-cli
# Or
yarn global add eas-cli
```

---

### Issue: "Not logged in"

**Solution:**
```bash
eas login
```

---

### Issue: "Build failed"

**Check:**
1. Internet connection stable?
2. Expo account active?
3. Check build logs for specific error

**Solution:**
```bash
# Try again
eas build --platform android --profile development
```

---

### Issue: "Can't install APK"

**Solution:**
1. Enable "Install from unknown sources"
2. Settings → Security → Unknown sources → Enable
3. Try installing again

---

### Issue: "App won't connect to dev server"

**Solution:**
1. Make sure computer and phone on same WiFi
2. Check firewall isn't blocking port 8081
3. Try: `npx expo start --dev-client --tunnel`

---

## 💡 Tips

### Tip 1: Use Development Profile

Always use `--profile development` for testing:
```bash
eas build --platform android --profile development
```

**Why?**
- Faster builds
- Includes dev tools
- Hot reload works
- Better debugging

---

### Tip 2: Build for Production Later

When ready to publish:
```bash
eas build --platform android --profile production
```

**This creates:**
- Optimized APK
- Smaller file size
- Better performance
- Ready for Google Play Store

---

### Tip 3: Build for Both Platforms

```bash
# Build for both iOS and Android
eas build --platform all --profile development
```

---

### Tip 4: Check Build Status

```bash
eas build:list
```

**Shows:**
- All your builds
- Build status
- Download links
- Build logs

---

## 📊 What Gets Fixed

After building with EAS, these will work:

| Feature | Expo Go | EAS Build |
|---------|---------|-----------|
| **Voice Input** | ❌ Broken | ✅ Works |
| **Audio Source Config** | ❌ Not supported | ✅ Supported |
| **System Sound Filtering** | ❌ No | ✅ Yes |
| **Voice Optimization** | ❌ No | ✅ Yes |
| **Hot Reload** | ✅ Yes | ✅ Yes |
| **Native Modules** | ⚠️ Limited | ✅ All |

---

## 🎯 Summary

### The Problem:
- Expo Go doesn't support Android audio source configuration
- Voice input captures "BELL" instead of voice
- iOS works because it doesn't need this config

### The Solution:
- Build custom development build with EAS
- Takes 15 minutes first time
- Voice input works perfectly after

### The Process:
1. Install EAS CLI (1 minute)
2. Login to Expo (1 minute)
3. Configure EAS (2 minutes)
4. Build APK (10-15 minutes)
5. Install on device (2 minutes)
6. Test voice input (1 minute)

**Total: ~20 minutes**

---

## 🚀 Quick Commands Reference

```bash
# Install EAS
npm install -g eas-cli

# Login
eas login

# Configure
cd cronos-app
eas build:configure

# Build
eas build --platform android --profile development

# Run after build
npx expo start --dev-client

# Check builds
eas build:list
```

---

## 📞 Need Help?

**Expo Documentation:**
- https://docs.expo.dev/build/introduction/
- https://docs.expo.dev/develop/development-builds/introduction/

**Expo Discord:**
- https://chat.expo.dev/

---

**Last Updated:** February 8, 2026  
**Status:** Ready to build  
**Next:** Run `eas build --platform android --profile development`

