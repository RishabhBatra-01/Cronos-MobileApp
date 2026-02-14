# 🚀 Snooze - Quick Start (Simplified)

## ⚡ No Setup Needed!

Snooze is already working! Every notification has a "Snooze 22m" button.

---

## ⚡ 2-Minute Test

### Quick Test: Basic Snooze

1. **Create Task:**
   - Tap "+" button
   - Title: "Test snooze"
   - Due: **2 minutes from now**
   - Tap "Add Task"

2. **Wait 2 minutes** ⏰

3. **Notification appears** 🔔
   - Shows two buttons:
     - "Snooze 22m" 😴
     - "Complete" ✅

4. **Tap "Snooze 22m"** 
   - Notification disappears

5. **Wait 22 minutes** ⏰

6. **Notification reappears** 🔔
   - Same notification fires again

7. **Success!** ✅

---

## 🔍 What to Watch

### In Console:
```
[NotificationObserver] Handling snooze for task: Test snooze
[NotificationObserver] Snoozing until: [timestamp]
[Notifications] Scheduling main notification in 1320 seconds
```

### In App:
- Task still shows in list
- Task is not marked complete
- Can snooze multiple times

---

## 🎯 How It Works

- **All notifications** have "Snooze 22m" button
- Tap it → reschedules for **22 minutes later**
- Works in background (no app opening needed)
- Pre-notifications don't replay

---

## ✅ Success Criteria

Snooze works if:

- ✅ Notification shows "Snooze 22m" button
- ✅ Tapping snooze makes notification disappear
- ✅ Notification reappears after 22 minutes
- ✅ No console errors

---

## 🎉 That's It!

No configuration, no setup, just works! 🚀

**Estimated Time:** 2 minutes to test  
**Status:** Ready to use!
