# 🔄 RESTART APP TO SEE NEW SNOOZE BUTTONS

## ⚠️ Important: Notification Categories are Cached

The old "Snooze 22m" button is still showing because notification categories are registered when the app starts.

---

## 🚀 How to Fix (2 Steps)

### Step 1: Stop the App Completely

**On iOS Simulator:**
```bash
# Stop the app
# Press Cmd+Q or close simulator
```

**On Android Emulator:**
```bash
# Stop the app
# Swipe up and close the app
```

**On Physical Device:**
```bash
# Force close the app
# Swipe up and close from app switcher
```

### Step 2: Restart the App

```bash
cd cronos-app
npx expo start
```

Then press:
- **i** for iOS
- **a** for Android

---

## ✅ After Restart

You should see the new buttons:

```
┌─────────────────────────────────┐
│ ⏰ Task Reminder                │
│ Buy groceries                   │
│                                 │
│  [5m] [10m] [30m] [Done]       │ ← New!
└─────────────────────────────────┘
```

---

## 🧪 Quick Test

1. **Create task** with due time in 2 minutes
2. **Wait for notification**
3. **See new buttons:** 5m, 10m, 30m, Done
4. **Tap any snooze button**
5. **Works!** ✅

---

## 🐛 Still Showing "Snooze 22m"?

If you still see the old button after restart:

### Option 1: Clear App Data (iOS)
```bash
# Delete app from device/simulator
# Reinstall by running: npx expo start
```

### Option 2: Clear App Data (Android)
```bash
# Settings → Apps → Your App → Storage → Clear Data
# Or uninstall and reinstall
```

### Option 3: Reset Expo Dev Client
```bash
cd cronos-app
rm -rf .expo
npx expo start --clear
```

---

## 📝 Why This Happens

Notification categories are registered in `registerForPushNotificationsAsync()` which runs once when the app starts. The system caches these categories, so you need to restart the app to see changes.

---

## ✅ Success

After restart, you'll see:
- ✅ 4 buttons instead of 2
- ✅ "5m", "10m", "30m", "Done"
- ✅ No more "Snooze 22m"

---

**Action Required:** Restart the app now! 🚀
