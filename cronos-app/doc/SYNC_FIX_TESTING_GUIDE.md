# Cross-Platform Sync Fix - Testing Guide

## 🧪 How to Test the Fix

### Prerequisites
- Two devices (or emulators): one Android, one iOS
- Same user account logged in on both devices
- Network connectivity on both devices

### Test 1: Create Task on Android → Appears on iOS

**Steps:**
1. Open the app on Android
2. Create a new task (e.g., "Test Task from Android")
3. Wait 2 seconds
4. Open the app on iOS (or pull to refresh if already open)
5. **Expected:** Task appears on iOS with correct title, priority, and all fields

**Console Logs to Check (Android):**
```
[SyncService] 📤 Starting PUSH phase...
[SyncService] ✅ Task synced: abc12345... Test Task from Android
[SyncService] ✅ Push complete. Pushed: 1 tasks
```

**Console Logs to Check (iOS):**
```
[SyncService] Realtime change detected: INSERT task: abc12345
[SyncService] 📥 Starting PULL phase...
[SyncService] ✅ Pulling task: abc12345... Test Task from Android reason: new task
[SyncService] ✅ Pull complete. Pulled: 1
```

### Test 2: Create Task on iOS → Appears on Android

**Steps:**
1. Open the app on iOS
2. Create a new task (e.g., "Test Task from iOS")
3. Wait 2 seconds
4. Open the app on Android (or pull to refresh if already open)
5. **Expected:** Task appears on Android with correct title, priority, and all fields

**Console Logs to Check (iOS):**
```
[SyncService] 📤 Starting PUSH phase...
[SyncService] ✅ Task synced: def67890... Test Task from iOS
[SyncService] ✅ Push complete. Pushed: 1 tasks
```

**Console Logs to Check (Android):**
```
[SyncService] Realtime change detected: INSERT task: def67890
[SyncService] 📥 Starting PULL phase...
[SyncService] ✅ Pulling task: def67890... Test Task from iOS reason: new task
[SyncService] ✅ Pull complete. Pulled: 1
```

### Test 3: Update Task on Android → Changes Appear on iOS

**Steps:**
1. Open the app on Android
2. Edit an existing task (change title to "Updated Task Title")
3. Wait 2 seconds
4. Refresh iOS app
5. **Expected:** Task title updated on iOS

**Console Logs to Check (Android):**
```
[SyncService] 📤 Starting PUSH phase...
[SyncService] ✅ Task synced: ghi12345... Updated Task Title
```

**Console Logs to Check (iOS):**
```
[SyncService] Realtime change detected: UPDATE task: ghi12345
[SyncService] ✅ Pulling task: ghi12345... Updated Task Title reason: remote newer
```

### Test 4: Delete Task on iOS → Removed from Android

**Steps:**
1. Open the app on iOS
2. Delete a task
3. Wait 2 seconds
4. Refresh Android app
5. **Expected:** Task removed from Android

**Console Logs to Check (iOS):**
```
[SyncService] Deleting task from remote: jkl67890
[SyncService] Task deleted from remote: jkl67890
```

**Console Logs to Check (Android):**
```
[SyncService] Realtime change detected: DELETE task: jkl67890
[SyncService] 🗑️  Removing locally - deleted from remote: jkl67890...
```

### Test 5: Realtime Sync (Both Devices Open)

**Steps:**
1. Open the app on both Android and iOS
2. Keep both visible
3. Create a task on Android
4. **Expected:** Within 1-2 seconds, task appears on iOS automatically (no manual refresh)

**What to Look For:**
- Task appears on iOS within 2 seconds
- No need to pull-to-refresh
- Smooth animation as task appears

### Test 6: Offline → Online Sync

**Steps:**
1. Turn off WiFi on Android
2. Create 3 tasks on Android (offline)
3. Turn WiFi back on
4. Wait 2 seconds
5. Refresh iOS
6. **Expected:** All 3 tasks appear on iOS

**Console Logs to Check (Android after WiFi on):**
```
[SyncService] Unsynced tasks (getter): 3
[SyncService] ✅ Task synced: aaa11111... Task 1
[SyncService] ✅ Task synced: bbb22222... Task 2
[SyncService] ✅ Task synced: ccc33333... Task 3
[SyncService] ✅ Push complete. Pushed: 3 tasks
```

### Test 7: Conflict Resolution (Same Task Edited on Both)

**Steps:**
1. Turn off WiFi on both devices
2. Edit the same task on Android (change title to "Android Edit")
3. Edit the same task on iOS (change title to "iOS Edit")
4. Turn on WiFi on Android first, wait 2 seconds
5. Turn on WiFi on iOS
6. **Expected:** Last edit wins (iOS edit should win since it synced last)

**What to Look For:**
- No duplicate tasks
- Final title is "iOS Edit" on both devices
- No errors in console

## 🔍 Debugging Tips

### Check Realtime Subscription Status

Look for this log on app startup:
```
[SyncService] ✅ Successfully subscribed to realtime updates
```

If you see:
```
[SyncService] ❌ Realtime subscription error
```
Then realtime is not working. Check:
- Supabase project settings
- Realtime enabled in Supabase dashboard
- Network connectivity

### Check User ID Consistency

Both devices should show the same user ID:
```
[SyncService] 🔄 syncAll starting for user: abc12345...
```

If user IDs differ, tasks won't sync (different users).

### Check Sync Lock

If sync seems stuck, look for:
```
[SyncService] ⏭️  Sync already in progress, skipping
```

This is normal during active sync. If it persists for >30 seconds:
```
[SyncService] ⚠️  Sync lock timed out after 30000 ms. Resetting lock.
```

### Check for Errors

Look for error alerts or console errors:
```
[SyncService] ❌ syncAll error: ...
```

Common errors:
- Network timeout
- Invalid credentials
- Database permission issues

## ✅ Success Criteria

All tests should pass with:
- ✅ Tasks sync in both directions (Android ↔ iOS)
- ✅ Updates sync correctly
- ✅ Deletes sync correctly
- ✅ Realtime sync works (1-2 second latency)
- ✅ Offline changes sync when back online
- ✅ No duplicate tasks
- ✅ No data loss
- ✅ All task fields preserved (title, priority, description, dates, etc.)

## 🎯 Performance Benchmarks

Expected sync times:
- **Create task:** 1-2 seconds to appear on other device
- **Update task:** 1-2 seconds to reflect changes
- **Delete task:** 1-2 seconds to remove from other device
- **Offline sync:** 2-5 seconds after reconnecting (depends on number of tasks)

If sync takes longer than 5 seconds, check:
- Network speed
- Number of tasks being synced
- Console logs for bottlenecks
