# Phase 1: Active/Inactive Toggle - Testing Guide

## 🧪 Quick Test Checklist

### Before Testing
- [ ] Run database migration in Supabase
- [ ] Restart the app to load new code
- [ ] Clear any existing notifications

### Test 1: New Task Default State (2 min)
**Expected:** New tasks are active by default

1. Create a new task with title "Test Active Default"
2. Set due date to 5 minutes from now
3. Save the task
4. Open edit modal
5. **Verify:** Active toggle is ON
6. **Verify:** No "Paused" badge in task list

### Test 2: Deactivate Task (3 min)
**Expected:** Deactivating cancels notifications and shows "Paused" badge

1. Open edit modal for "Test Active Default"
2. Toggle Active switch to OFF
3. Close modal
4. **Verify:** "Paused" badge appears next to task
5. Wait for original due time
6. **Verify:** No notification fires
7. **Verify:** Task still appears in list

### Test 3: Reactivate Task (3 min)
**Expected:** Reactivating reschedules notification

1. Open edit modal for paused task
2. Change due date to 2 minutes from now
3. Toggle Active switch to ON
4. Close modal
5. **Verify:** "Paused" badge disappears
6. Wait for due time
7. **Verify:** Notification fires

### Test 4: Reactivate Past Task (2 min)
**Expected:** Reactivating past task doesn't schedule notification

1. Create task with past due date (yesterday)
2. Deactivate it
3. Reactivate it
4. **Verify:** No notification scheduled
5. **Verify:** Task remains in list

### Test 5: Multiple Tasks (3 min)
**Expected:** Each task's active state is independent

1. Create 3 tasks with future due dates
2. Deactivate task 2
3. **Verify:** Tasks 1 and 3 show no badge
4. **Verify:** Task 2 shows "Paused" badge
5. **Verify:** Only tasks 1 and 3 fire notifications

### Test 6: Sync with Supabase (5 min)
**Expected:** Active state syncs correctly

1. Create task and deactivate it
2. Wait for sync (or trigger manually)
3. Check Supabase database
4. **Verify:** `is_active` column is `false`
5. Reactivate task
6. Wait for sync
7. **Verify:** `is_active` column is `true`

### Test 7: Backward Compatibility (3 min)
**Expected:** Old tasks work without issues

1. If you have old tasks (before Phase 1):
2. **Verify:** They appear active by default
3. **Verify:** They can be toggled
4. **Verify:** No errors in console

## 🐛 Common Issues & Solutions

### Issue: "Paused" badge doesn't appear
**Solution:** Check that TaskItem.tsx was updated correctly

### Issue: Notifications still fire when inactive
**Solution:** Check NotificationManager.ts has the `isActive` check

### Issue: Toggle doesn't work
**Solution:** Check that toggleTaskActive action exists in store

### Issue: Database sync fails
**Solution:** Run the migration SQL in Supabase

### Issue: Old tasks show errors
**Solution:** Check that default values are set (`?? true`)

## 📊 Success Metrics

Phase 1 is successful if:
- [ ] All 7 tests pass
- [ ] No console errors
- [ ] No breaking changes to existing features
- [ ] Database sync works correctly
- [ ] Backward compatibility maintained

## 🎯 Performance Check

- [ ] Toggle response is instant (< 100ms)
- [ ] No lag when opening edit modal
- [ ] Notification cancellation is fast
- [ ] No memory leaks

## 📝 Notes

- Test on both iOS and Android if possible
- Test with multiple tasks (10+)
- Test with tasks at different times
- Test sync with poor network connection

---

**Estimated Testing Time:** 20-25 minutes

**Ready to test?** Follow the checklist above and report any issues!
