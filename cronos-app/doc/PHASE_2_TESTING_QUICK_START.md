# Phase 2: Quick Testing Guide

## 🚀 Ready to Test!

Phase 2 is complete and ready for testing. Follow these steps:

---

## Step 1: Run Database Migration

Open Supabase SQL Editor and run:

```sql
-- File: supabase-migration-phase2-repeat.sql

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS repeat_type TEXT,
ADD COLUMN IF NOT EXISTS repeat_config JSONB,
ADD COLUMN IF NOT EXISTS last_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_occurrence TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tasks_repeat_type 
ON tasks(repeat_type) 
WHERE repeat_type IS NOT NULL AND repeat_type != 'NONE';

CREATE INDEX IF NOT EXISTS idx_tasks_next_occurrence 
ON tasks(next_occurrence) 
WHERE next_occurrence IS NOT NULL;
```

---

## Step 2: Rebuild the App

```bash
cd cronos-app

# For iOS
npx expo run:ios

# For Android
npx expo run:android
```

---

## Step 3: Quick Test Scenarios

### Test 1: Create Daily Task (2 minutes)
1. Tap "+" to add task
2. Title: "Take vitamins"
3. Set due date: Tomorrow at 9 AM
4. Tap "Repeat" dropdown
5. Select "Daily"
6. Keep interval at 1 day
7. Save task
8. **Verify:** Task shows "🔁 Daily" indicator
9. Tap checkbox to complete
10. **Verify:** Task reappears with tomorrow's date
11. **Verify:** Status is pending (not completed)

### Test 2: Create Weekly Task (3 minutes)
1. Add new task
2. Title: "Team meeting"
3. Set due date: Next Monday at 10 AM
4. Tap "Repeat" dropdown
5. Select "Weekly"
6. Tap Mon, Wed, Fri buttons (should be blue)
7. Keep interval at 1 week
8. Save task
9. **Verify:** Shows "🔁 Mon, Wed, Fri"
10. Complete on Monday
11. **Verify:** Reschedules to Wednesday
12. Complete on Wednesday
13. **Verify:** Reschedules to Friday

### Test 3: Create Monthly Task (2 minutes)
1. Add new task
2. Title: "Pay rent"
3. Set due date: Next month, day 1 at 12 PM
4. Tap "Repeat" dropdown
5. Select "Monthly"
6. Set day to 1
7. Keep interval at 1 month
8. Save task
9. **Verify:** Shows "🔁 Monthly on day 1"
10. Complete task
11. **Verify:** Reschedules to day 1 of following month

### Test 4: Edit Repeat Config (2 minutes)
1. Create a non-repeating task
2. Tap task to edit
3. Scroll to "Repeat" section
4. Change from "None" to "Daily"
5. Set interval to 2 days
6. Save
7. **Verify:** Task now shows "🔁 Every 2 days"
8. Complete task
9. **Verify:** Reschedules 2 days ahead

### Test 5: Inactive Repeating Task (1 minute)
1. Create daily repeating task
2. Toggle switch to OFF (inactive)
3. Complete task
4. **Verify:** Task stays completed (does NOT reschedule)
5. Toggle switch to ON (active)
6. Complete task again
7. **Verify:** NOW it reschedules

---

## 🎯 What to Look For

### ✅ Success Indicators
- Repeat picker appears in Add/Edit modals
- Can select and configure repeat types
- Tasks show 🔁 icon with description
- Completing repeating tasks reschedules them
- Status resets to "pending" after reschedule
- Due date updates correctly
- Notifications reschedule (check notification center)
- Inactive tasks don't reschedule

### ❌ Potential Issues
- Repeat picker not showing → Check imports
- Task doesn't reschedule → Check isActive is true
- Wrong next date → Check RepeatCalculator logic
- No notification → Check notification permissions
- Sync fails → Check database migration ran

---

## 🐛 Troubleshooting

### Issue: Repeat picker not visible
**Solution:** Scroll down in the modal, it's after the Notes section

### Issue: Task doesn't reschedule
**Check:**
1. Is task active? (toggle should be ON)
2. Is repeatType set? (should show 🔁 icon)
3. Check console logs for errors

### Issue: Wrong next occurrence
**Check:**
1. Timezone settings
2. RepeatCalculator logic
3. Console logs for calculation details

### Issue: Database sync fails
**Solution:** Run the migration SQL in Supabase

---

## 📊 Expected Console Logs

When completing a repeating task, you should see:

```
[TaskStore] Completing repeating task, calculating next occurrence
[TaskStore] Next occurrence: 2026-02-03T09:00:00.000Z
[TaskItem] Rescheduling notification for repeating task
```

---

## 🎉 Success Criteria

Phase 2 is working correctly when:
- ✅ All 5 test scenarios pass
- ✅ Visual indicators show correctly
- ✅ Tasks reschedule on completion
- ✅ Notifications work
- ✅ Database sync works
- ✅ No console errors

---

## 📝 Notes

- All changes are backward compatible
- Existing tasks continue to work
- Non-repeating tasks unaffected
- Can convert non-repeating to repeating via edit
- Can disable repeating tasks with toggle

---

**Estimated Testing Time:** 15-20 minutes for all scenarios

**Ready to test? Start with Test 1!** 🚀
