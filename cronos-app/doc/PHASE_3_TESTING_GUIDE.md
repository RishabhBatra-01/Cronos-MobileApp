# Phase 3: Notify Before - Testing Guide

## 🚀 Quick Start

Phase 3 is complete! Here's how to test it:

---

## Step 1: Run Database Migration (2 minutes)

Open Supabase SQL Editor and run:

```sql
-- Phase 3: Notify Before Migration
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS pre_notify_offsets TEXT[];

CREATE INDEX IF NOT EXISTS idx_tasks_pre_notify 
ON tasks(pre_notify_offsets) 
WHERE pre_notify_offsets IS NOT NULL AND array_length(pre_notify_offsets, 1) > 0;

COMMENT ON COLUMN tasks.pre_notify_offsets IS 'ISO 8601 duration offsets for pre-notifications (e.g., PT5M, PT1H, PT1D). Multiple notifications can be scheduled before the main trigger.';
```

---

## Step 2: Rebuild App (5 minutes)

```bash
cd cronos-app

# For iOS
npx expo run:ios

# For Android
npx expo run:android
```

---

## Step 3: Quick Tests (10 minutes)

### Test 1: Single Pre-Notification (3 minutes)

**Setup:**
1. Tap "+" to add task
2. Title: "Test notification"
3. Set due date: **2 minutes from now**
4. Scroll to "Notify Before"
5. Check "☑ 5 minutes before" (will be skipped - in past)
6. Save task

**Expected:**
- Task created
- Only main notification scheduled (5 min offset is in past)
- In 2 minutes: Notification appears

**Now try with future offset:**
1. Edit the task
2. Set due date: **10 minutes from now**
3. Check "☑ 5 minutes before"
4. Save

**Expected:**
- In 5 minutes: "Reminder: Test notification - Due in 5 minutes"
- In 10 minutes: "Test notification - Task is due now"

---

### Test 2: Multiple Pre-Notifications (4 minutes)

**Setup:**
1. Create new task: "Multiple alerts"
2. Set due date: **1 hour 30 minutes from now**
3. Scroll to "Notify Before"
4. Check:
   - ☑ 1 hour before
   - ☑ 15 minutes before
   - ☑ 5 minutes before
5. Save task

**Expected:**
- In 30 minutes: "Reminder: Multiple alerts - Due in 1 hour"
- In 1 hour 15 min: "Reminder: Multiple alerts - Due in 15 minutes"
- In 1 hour 25 min: "Reminder: Multiple alerts - Due in 5 minutes"
- In 1 hour 30 min: "Multiple alerts - Task is due now"

**Total: 4 notifications**

---

### Test 3: Past Notification Skip (2 minutes)

**Setup:**
1. Create task: "Quick test"
2. Set due date: **3 minutes from now**
3. Check:
   - ☑ 15 minutes before (will skip - past)
   - ☑ 5 minutes before (will skip - past)
4. Save task

**Expected:**
- 15 min and 5 min notifications skipped (in the past)
- In 3 minutes: Main notification only

**Verify in console:**
```
[Notifications] Pre-notification PT15M is in the past, skipping
[Notifications] Pre-notification PT5M is in the past, skipping
[Notifications] Scheduling main notification in 180 seconds
```

---

### Test 4: With Inactive Toggle (1 minute)

**Setup:**
1. Create task with pre-notifications
2. Toggle task to INACTIVE (OFF)

**Expected:**
- No notifications scheduled
- Console: "Task is inactive, skipping notification"

**Then:**
1. Toggle back to ACTIVE (ON)

**Expected:**
- All notifications rescheduled (main + pre-notifications)

---

### Test 5: With Repeat (3 minutes)

**Setup:**
1. Create task: "Daily reminder"
2. Set due date: **5 minutes from now**
3. Set repeat: Daily
4. Check: ☑ 5 minutes before (will skip first time)
5. Save task

**Expected:**
- In 5 minutes: Main notification
- Complete task
- Task reschedules to tomorrow
- Tomorrow: Both pre-notification AND main notification

**This tests that pre-notifications work with repeat logic**

---

## 🎯 What to Look For

### ✅ Success Indicators

1. **UI:**
   - "Notify Before" section appears in Add/Edit modals
   - Can select multiple checkboxes
   - Selected items show blue highlight
   - Checkboxes work smoothly

2. **Notifications:**
   - Pre-notifications arrive at correct times
   - Pre-notification text: "Reminder: [Task] - Due in [duration]"
   - Main notification text: "[Task] - Task is due now"
   - Past notifications are skipped

3. **Console Logs:**
   ```
   [Notifications] Scheduling 2 pre-notifications
   [Notifications] Scheduling pre-notification PT1H in 3600 seconds
   [Notifications] Scheduling pre-notification PT15M in 900 seconds
   [Notifications] Scheduling main notification in 5400 seconds
   ```

4. **Integration:**
   - Works with active/inactive toggle
   - Works with repeat logic
   - Notifications cancel when task deactivated
   - Notifications reschedule when task edited

---

## ❌ Potential Issues

### Issue: Pre-notifications not appearing
**Check:**
1. Notification permissions granted?
2. Due date is in the future?
3. Pre-notification time is in the future?
4. Task is active (toggle ON)?
5. Check console logs for errors

### Issue: Wrong notification times
**Check:**
1. Device timezone settings
2. Due date/time set correctly
3. Console logs show correct calculation

### Issue: Too many/few notifications
**Check:**
1. How many offsets selected?
2. Are some offsets in the past (skipped)?
3. Check console for skip messages

### Issue: Notifications don't reschedule with repeat
**Check:**
1. Task has repeat configured?
2. Task is active?
3. Check console logs after completion

---

## 📊 Console Log Examples

### Successful Scheduling:
```
[Notifications] scheduleTaskNotification called for: Test task
[Notifications] Scheduling 2 pre-notifications
[Notifications] Scheduling pre-notification PT15M in 900 seconds
[Notifications] Pre-notification scheduled for 2026-02-02T14:45:00.000Z
[Notifications] Scheduling pre-notification PT5M in 300 seconds
[Notifications] Pre-notification scheduled for 2026-02-02T14:55:00.000Z
[Notifications] Scheduling main notification in 1200 seconds
[Notifications] Main notification scheduled! ID: ...
[Notifications] Total scheduled notifications: 3
```

### Past Notification Skip:
```
[Notifications] Scheduling 2 pre-notifications
[Notifications] Pre-notification PT1H is in the past, skipping
[Notifications] Scheduling pre-notification PT5M in 300 seconds
[Notifications] Pre-notification scheduled for 2026-02-02T14:55:00.000Z
[Notifications] Scheduling main notification in 600 seconds
```

### Inactive Task:
```
[Notifications] scheduleTaskNotification called for: Paused task
[Notifications] Task is inactive, skipping notification
```

---

## 🎉 Success Checklist

Phase 3 is working when:

- [ ] "Notify Before" section appears in modals
- [ ] Can select multiple offsets
- [ ] Pre-notifications arrive at correct times
- [ ] Past notifications are skipped
- [ ] Main notification always fires
- [ ] Works with active/inactive toggle
- [ ] Works with repeat logic
- [ ] Notifications cancel properly
- [ ] Console logs show correct scheduling
- [ ] No errors in console

---

## 🔍 Advanced Testing

### Test Notification Cancellation:
1. Create task with pre-notifications
2. Check scheduled notifications count
3. Toggle task inactive
4. Check scheduled notifications count (should be 0)
5. Toggle back active
6. Check scheduled notifications count (should be restored)

### Test Edit Behavior:
1. Create task without pre-notifications
2. Edit task, add pre-notifications
3. Verify notifications rescheduled
4. Edit again, remove some offsets
5. Verify correct notifications scheduled

### Test Repeat Rescheduling:
1. Create daily task with pre-notifications
2. Complete task
3. Check console for reschedule logs
4. Verify both pre-notifications and main rescheduled

---

## 📱 Testing Tips

1. **Use Short Durations:** Test with 2-5 minute delays for quick feedback
2. **Check Notification Center:** Minimize app to see notifications
3. **Watch Console:** Logs show exactly what's happening
4. **Test on Device:** Simulator notifications may behave differently
5. **Clear Notifications:** Clear notification center between tests

---

## 🚨 Common Mistakes

1. **Forgetting to minimize app:** Notifications only show when app is backgrounded
2. **Setting due date in past:** No notifications will schedule
3. **Not checking console:** Console shows why notifications aren't scheduling
4. **Testing with very short times:** May miss notifications if timing is tight
5. **Not waiting long enough:** Give notifications time to arrive

---

**Estimated Testing Time:** 15-20 minutes for all scenarios

**Ready to test? Start with Test 1!** 🚀
