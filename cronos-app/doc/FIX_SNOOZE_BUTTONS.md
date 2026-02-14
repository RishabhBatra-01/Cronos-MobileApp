# 🔧 Fix: Still Seeing "Snooze 22m"?

## The Problem

Notification categories are registered when `registerForPushNotificationsAsync()` runs. This happens once when the app starts. The old category is cached.

---

## ✅ Solution: Force Complete App Restart

### Step 1: Kill the App Process

**Don't just minimize - FORCE CLOSE:**

#### iOS Simulator:
```bash
# Stop Metro bundler (Ctrl+C in terminal)
# Then close simulator completely
# Or run:
killall "Expo Go" 2>/dev/null
killall "Simulator" 2>/dev/null
```

#### Android Emulator:
```bash
# Stop Metro bundler (Ctrl+C in terminal)
# Then:
adb shell am force-stop host.exp.exponent
```

#### Physical Device:
- Swipe up to app switcher
- Swipe app away completely
- Wait 5 seconds

### Step 2: Clear Metro Cache

```bash
cd cronos-app
rm -rf .expo
npx expo start --clear
```

### Step 3: Reinstall App

Press **i** (iOS) or **a** (Android) to rebuild and install

---

## 🧪 Verify It Worked

1. Create a task with due time in 1 minute
2. Wait for notification
3. You should see **4 buttons:**
   - 5m
   - 10m
   - 30m
   - Done

---

## 🐛 Still Not Working?

### Check Console Logs

When app starts, you should see:
```
[Notifications] Categories registered with multiple snooze options
```

If you see old logs, the app didn't fully restart.

### Nuclear Option: Uninstall App

**iOS:**
```bash
# Delete app from simulator
# Then reinstall:
cd cronos-app
npx expo start
# Press 'i'
```

**Android:**
```bash
# Uninstall:
adb uninstall host.exp.exponent
# Reinstall:
cd cronos-app
npx expo start
# Press 'a'
```

---

## 📝 Why This Happens

The `registerForPushNotificationsAsync()` function runs in `app/index.tsx` or similar entry point. It registers notification categories with the OS. These categories are cached until the app process is completely killed and restarted.

Hot reload and fast refresh **do NOT** re-register notification categories.

---

## ✅ Success Checklist

After restart, verify:

- [ ] Console shows: "Categories registered with multiple snooze options"
- [ ] Notification shows 4 buttons (not 2)
- [ ] Buttons say: "5m", "10m", "30m", "Done"
- [ ] No "Snooze 22m" button

---

## 🚀 Commands Summary

```bash
# Stop everything
# Press Ctrl+C in terminal

# Clear cache
cd cronos-app
rm -rf .expo
rm -rf node_modules/.cache

# Restart fresh
npx expo start --clear

# Rebuild app (press 'i' or 'a')
```

---

**Try this and let me know if you still see "Snooze 22m"!**
