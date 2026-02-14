# Refreshing Loop Fix

**Issue:** "Refreshing..." indicator stuck and keeps appearing  
**Date:** January 31, 2026  
**Status:** ✅ Fixed

---

## Problem

The "Refreshing..." indicator was appearing repeatedly and getting stuck, making the app feel unresponsive. This was caused by:

1. **Concurrent Syncs:** Multiple sync operations running at the same time
2. **Rapid Realtime Events:** Real-time subscription triggering syncs too frequently
3. **No Sync Guard:** No protection against starting a new sync while one is already running

---

## Root Cause

### Issue 1: No Concurrent Sync Protection
```typescript
// OLD CODE - No protection
export async function syncAll(userId: string) {
    store.setIsSyncing(true);
    // ... sync logic
    store.setIsSyncing(false);
}
```

If `syncAll()` was called while already syncing, it would:
- Set `isSyncing = true` again
- Start another sync operation
- Create a loop of syncs

### Issue 2: Realtime Triggering Too Fast
```typescript
// OLD CODE - 100ms debounce (too fast)
const REALTIME_DEBOUNCE_MS = 100;
```

With 100ms debounce, rapid changes could trigger multiple syncs before the first one completed.

### Issue 3: No Sync Check in Realtime Handler
```typescript
// OLD CODE - Always syncs
subscribeToTasks(userId, () => {
    syncAll(userId); // No check if already syncing
});
```

---

## Solution

### Fix 1: Prevent Concurrent Syncs

**File:** `services/SyncService.ts`

```typescript
export async function syncAll(userId: string) {
    const store = useTaskStore.getState();

    // NEW: Prevent concurrent syncs
    if (store.isSyncing) {
        console.log('[SyncService] Sync already in progress, skipping');
        return { pulled: 0, pushed: 0, errors: [] };
    }

    store.setIsSyncing(true);
    try {
        // ... sync logic
    } finally {
        store.setIsSyncing(false);
    }
}
```

**Benefits:**
- ✅ Only one sync at a time
- ✅ Prevents sync loops
- ✅ Returns immediately if already syncing

### Fix 2: Increased Debounce Time

**File:** `services/SyncService.ts`

```typescript
// NEW: 500ms debounce (balanced)
const REALTIME_DEBOUNCE_MS = 500;
```

**Benefits:**
- ✅ Prevents rapid-fire syncs
- ✅ Still fast enough for good UX
- ✅ Reduces server load

### Fix 3: Check Sync State in Realtime Handler

**File:** `app/index.tsx`

```typescript
subscribeToTasks(userId, async () => {
    // NEW: Check if already syncing
    const { isSyncing } = useTaskStore.getState();
    if (!isSyncing) {
        await syncAll(userId);
    } else {
        console.log('Sync already in progress, skipping');
    }
});
```

**Benefits:**
- ✅ Double protection against concurrent syncs
- ✅ Cleaner logs
- ✅ Better performance

### Fix 4: Removed Annoying Error Alerts

**File:** `services/SyncService.ts`

```typescript
// OLD: Alert on every error
Alert.alert('Sync Failed', err.message);

// NEW: Just log errors
console.error('[SyncService] Sync failed:', err.message);
```

**Benefits:**
- ✅ No alert spam
- ✅ Errors still logged for debugging
- ✅ Better user experience

---

## How It Works Now

### Sync Flow (After Fix)

```
User Action (pull-to-refresh, voice input, etc.)
    ↓
syncAll() called
    ↓
Check: Is sync already running?
    ├─ YES → Return immediately (skip)
    └─ NO → Continue
        ↓
    Set isSyncing = true
        ↓
    Pull changes from Supabase
        ↓
    Push local changes to Supabase
        ↓
    Set isSyncing = false
        ↓
    "Refreshing..." indicator disappears
```

### Realtime Event Flow (After Fix)

```
Realtime event received
    ↓
Debounce 500ms (wait for more events)
    ↓
Check: Is sync already running?
    ├─ YES → Skip sync
    └─ NO → Trigger sync
```

---

## Testing

### Before Fix (❌ Broken):
- Pull to refresh → "Refreshing..." appears
- Realtime event triggers → Another "Refreshing..." appears
- Multiple syncs running → Indicator stuck
- App feels unresponsive

### After Fix (✅ Working):
- Pull to refresh → "Refreshing..." appears
- Sync completes → Indicator disappears
- Realtime event during sync → Skipped (no duplicate)
- App feels responsive

---

## Performance Improvements

### Before:
- Multiple concurrent syncs possible
- 100ms debounce (too fast)
- No sync protection
- Alert spam on errors

### After:
- ✅ Only one sync at a time
- ✅ 500ms debounce (balanced)
- ✅ Double sync protection
- ✅ No alert spam

---

## Technical Changes

### Files Modified:

1. **`services/SyncService.ts`**
   - Added concurrent sync protection
   - Increased debounce to 500ms
   - Removed error alert spam

2. **`app/index.tsx`**
   - Added sync state check in realtime handler
   - Better logging

---

## Status

✅ **Fixed** - "Refreshing..." indicator now works correctly  
✅ **No more loops** - Sync protection prevents concurrent operations  
✅ **Better UX** - No alert spam, responsive app  

---

**Result:** The app now syncs smoothly without getting stuck in refresh loops!