# Daily Development Workflow

## First Time Setup (Do This Once)

### Build iOS Development Client:
```bash
cd cronos-app
npx expo run:ios
```
Wait 5-10 minutes for build to complete.

### Build Android Development Client:
```bash
cd cronos-app
./run-android.sh
```
Wait 5-10 minutes for build to complete.

---

## Daily Development (Fast - No Rebuild Needed!)

After the initial build, you only need ONE command:

```bash
cd cronos-app
npx expo start --dev-client
```

Then:
- Press **`i`** for iOS
- Press **`a`** for Android

**Both apps will reload instantly!** No rebuild needed! ⚡

---

## Complete Workflow

### 1. Start Dev Server (Every Day):
```bash
cd cronos-app
npx expo start --dev-client
```

### 2. Open Apps:
- Press `i` → Opens iOS Simulator
- Press `a` → Opens Android Emulator
- Or scan QR code on physical device

### 3. Edit Code:
- Make changes to any `.ts`, `.tsx`, `.js` files
- Save the file
- App reloads automatically! ✨

### 4. Test on Both Platforms:
- Both iOS and Android connect to same dev server
- Changes appear on both instantly
- No rebuild needed!

---

## When to Rebuild

You ONLY need to rebuild when:

### ❌ Don't Rebuild For:
- Changing TypeScript/JavaScript code
- Updating UI components
- Modifying business logic
- Changing API calls
- Updating styles

### ✅ Rebuild Only When:
- Adding new native modules (like `expo-camera`)
- Changing `app.json` configuration
- Updating Expo SDK version
- Modifying native code (iOS/Android folders)

---

## Quick Commands Reference

### Daily Development:
```bash
# Start dev server (use this every day)
npx expo start --dev-client

# Then press:
# i = iOS
# a = Android
# r = Reload
# m = Toggle menu
```

### Rebuild (Rarely Needed):
```bash
# iOS rebuild
npx expo run:ios

# Android rebuild
./run-android.sh
```

### Clean Rebuild (If Issues):
```bash
# iOS clean rebuild
rm -rf ios
npx expo prebuild --platform ios --clean
npx expo run:ios

# Android clean rebuild
rm -rf android
npx expo prebuild --platform android --clean
./run-android.sh
```

---

## Example Daily Session

**Morning:**
```bash
cd cronos-app
npx expo start --dev-client
```

Press `i` and `a` to open both platforms.

**During Development:**
1. Edit `services/OpenAIService.ts`
2. Save file
3. Both iOS and Android reload automatically
4. Test feature on both platforms
5. Repeat!

**No rebuilding needed!** 🎉

---

## Testing Workflow

### Test on Both Platforms Simultaneously:

**Terminal 1:**
```bash
cd cronos-app
npx expo start --dev-client
```

**Your Screen:**
- iOS Simulator on left
- Android Emulator on right
- VS Code in middle
- Edit code → Both reload instantly!

---

## Hot Reload vs Full Reload

### Hot Reload (Automatic):
- Saves component state
- Instant updates
- Happens automatically on save

### Full Reload (Manual):
- Press `r` in terminal
- Or shake device → "Reload"
- Resets app state

---

## Physical Devices

### iOS (iPhone):
1. Connect iPhone via USB
2. Run: `npx expo start --dev-client`
3. Scan QR code with Camera app
4. App opens with dev client
5. Edit code → iPhone reloads automatically!

### Android (Phone):
1. Enable USB Debugging
2. Connect via USB
3. Run: `npx expo start --dev-client`
4. Scan QR code with dev client app
5. Edit code → Phone reloads automatically!

---

## Pro Tips

### 1. Keep Dev Server Running
Leave `npx expo start --dev-client` running all day. Just press `i` or `a` when you need to test.

### 2. Use Multiple Devices
Test on:
- iOS Simulator
- Android Emulator
- Physical iPhone
- Physical Android phone

All connect to same dev server!

### 3. Fast Refresh
Most changes reload in <1 second. No waiting!

### 4. Debug Menu
- iOS: Cmd+D in simulator
- Android: Cmd+M in emulator
- Physical: Shake device

### 5. Console Logs
All `console.log()` appear in terminal where you ran `npx expo start --dev-client`

---

## Common Issues

### "Cannot connect to dev server"
```bash
# Restart dev server
# Press Ctrl+C to stop
npx expo start --dev-client
```

### "App crashes on launch"
```bash
# Clear cache and restart
npx expo start --dev-client --clear
```

### "Changes not appearing"
- Press `r` in terminal to reload
- Or shake device → "Reload"

### "Need to rebuild"
Only if you:
- Added new native module
- Changed app.json
- Updated Expo SDK

---

## Summary

### Build Once (First Time):
```bash
# iOS
npx expo run:ios

# Android
./run-android.sh
```

### Use Daily (Every Time):
```bash
npx expo start --dev-client

# Press i for iOS
# Press a for Android
```

### Edit Code:
- Make changes
- Save file
- Both platforms reload automatically
- Test immediately!

**No rebuilding needed for 99% of development!** 🚀

---

## Your Typical Day

```bash
# Morning - Start dev server
cd cronos-app
npx expo start --dev-client

# Press 'i' and 'a' to open both platforms

# Edit code all day
# - Change OpenAIService.ts
# - Update VoiceInputButton.tsx
# - Modify any component
# - Save → Auto reload on both!

# Evening - Stop server
# Press Ctrl+C
```

That's it! Build once, develop forever! ⚡✨
