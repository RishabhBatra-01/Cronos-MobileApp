# Phase 4: Snooze - Implementation Spec

## 📋 Master Spec Requirements

From `NewFeatureImplementation.md` Section 5:

### 5.1 Purpose
> "Snooze allows the user to temporarily postpone a triggered alert."

### 5.2 Data Model
```typescript
"snoozeEnabled": true,
"snoozeDuration": "PT5M | PT10M | PT30M"
```

### 5.3 Snooze Rule
> "When user taps Snooze: snoozedTrigger = now + snoozeDuration"

### 5.4 Rules
1. Snooze affects only the current occurrence
2. Snooze must not modify:
   - main trigger
   - repeat schedule
   - future occurrences
3. Snooze disabled when task is inactive

### From Section 4.5 (Notify Before Interaction)
> "Pre-notifications are NOT replayed on snooze"

### From Section 6 (Feature Interaction)
> "No feature may mutate another feature's configuration"

---

## 🎯 Implementation Goals

1. Add snooze fields to Task interface
2. Implement snooze action in task store
3. Add snooze button to notifications
4. Create snooze duration picker UI
5. Handle snooze state correctly
6. Respect active/inactive toggle
7. Do NOT replay pre-notifications
8. Do NOT modify repeat schedule
9. Database migration

---

## 📊 Data Model Changes

### Task Interface Update

```typescript
interface Task {
    // ... existing fields
    
    // Phase 4: Snooze
    snoozeEnabled?: boolean;      // Whether snooze is enabled for this task
    snoozeDuration?: string;      // ISO 8601 duration (PT5M, PT10M, PT30M)
    snoozedUntil?: string;        // ISO timestamp when snoozed notification should fire
    snoozeCount?: number;         // Track how many times snoozed (optional, for analytics)
}
```

### Snooze Duration Options

```typescript
"PT5M"   = 5 minutes
"PT10M"  = 10 minutes
"PT30M"  = 30 minutes
"PT1H"   = 1 hour
```

---

## 🔔 Notification Integration

### Notification Actions

Already defined in NotificationManager:
```typescript
export const ACTION_SNOOZE = 'SNOOZE_SHORT';
export const ACTION_COMPLETE = 'MARK_DONE';
```

### Notification Response Handler

Need to implement:
```typescript
Notifications.addNotificationResponseReceivedListener((response) => {
    const { actionIdentifier, notification } = response;
    const taskId = notification.request.content.data?.taskId;
    
    if (actionIdentifier === ACTION_SNOOZE) {
        // Handle snooze
        snoozeTask(taskId);
    } else if (actionIdentifier === ACTION_COMPLETE) {
        // Handle complete
        toggleTaskStatus(taskId);
    }
});
```

---

## 🎨 UI Components

### 1. SnoozePicker Component

**Purpose:** Allow user to configure snooze settings for a task

**Design:**
```
┌─────────────────────────────────────┐
│ Snooze                              │
│ ┌─────────────────────────────────┐ │
│ │ Disabled                      ▼ │ │ ← Dropdown
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

When enabled:
┌─────────────────────────────────────┐
│ Snooze                              │
│ ┌─────────────────────────────────┐ │
│ │ 10 minutes                    ▼ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Options:**
- Disabled (snoozeEnabled: false)
- 5 minutes (PT5M)
- 10 minutes (PT10M)
- 30 minutes (PT30M)
- 1 hour (PT1H)

### 2. Notification Actions

Already configured in NotificationManager:
```typescript
{
    identifier: ACTION_SNOOZE,
    buttonTitle: 'Snooze 22m',  // Will update dynamically
    options: {
        opensAppToForeground: false,
    },
}
```

---

## 🔄 Snooze Flow

### User Taps Snooze Button

```
1. Notification appears
   ↓
2. User taps "Snooze" button
   ↓
3. Notification response handler triggered
   ↓
4. Get task from store
   ↓
5. Check if snooze enabled
   ↓
6. Calculate: snoozedUntil = now + snoozeDuration
   ↓
7. Update task with snoozedUntil
   ↓
8. Cancel existing notification
   ↓
9. Schedule new notification at snoozedUntil
   ↓
10. Do NOT reschedule pre-notifications
    ↓
11. Sync to database
```

### Technical Implementation

```typescript
snoozeTask: (id: string) => {
    const task = get().tasks.find(t => t.id === id);
    
    if (!task) return;
    if (!task.snoozeEnabled) return;
    if (!task.isActive) return;  // Respect active toggle
    if (!task.snoozeDuration) return;
    
    const now = new Date();
    const snoozeDuration = parseDuration(task.snoozeDuration);
    const snoozedUntil = new Date(now.getTime() + snoozeDuration);
    
    set((state) => ({
        tasks: state.tasks.map((t) =>
            t.id === id
                ? {
                    ...t,
                    snoozedUntil: snoozedUntil.toISOString(),
                    snoozeCount: (t.snoozeCount || 0) + 1,
                    updatedAt: new Date().toISOString(),
                    isSynced: false,
                }
                : t
        ),
    }));
    
    // Schedule snoozed notification
    scheduleTaskNotification({
        ...task,
        dueDate: snoozedUntil.toISOString(),
        // Do NOT include preNotifyOffsets - they should not replay
    });
}
```

---

## 🚨 Critical Rules (From Master Spec)

### Rule 1: Snooze Affects Only Current Occurrence
```typescript
// ✅ CORRECT: Only reschedule current notification
snoozeTask: (id) => {
    const snoozedUntil = now + snoozeDuration;
    updateTask({ snoozedUntil });
    scheduleNotification(snoozedUntil);
}

// ❌ WRONG: Don't modify main trigger
snoozeTask: (id) => {
    task.dueDate = now + snoozeDuration;  // DON'T DO THIS!
}
```

### Rule 2: Don't Modify Other Features
```typescript
// ✅ CORRECT: Only update snooze fields
snoozeTask: (id) => {
    updateTask({
        snoozedUntil: newTime,
        snoozeCount: count + 1
    });
}

// ❌ WRONG: Don't modify repeat, pre-notify, etc.
snoozeTask: (id) => {
    task.repeatType = 'NONE';  // DON'T DO THIS!
    task.preNotifyOffsets = [];  // DON'T DO THIS!
}
```

### Rule 3: Respect Active Toggle
```typescript
// ✅ CORRECT: Check if active
snoozeTask: (id) => {
    if (!task.isActive) return;  // Don't snooze inactive tasks
    // ... proceed with snooze
}
```

### Rule 4: Don't Replay Pre-Notifications
```typescript
// ✅ CORRECT: Schedule only main notification
scheduleTaskNotification({
    ...task,
    dueDate: snoozedUntil,
    // preNotifyOffsets intentionally omitted
});

// ❌ WRONG: Don't include pre-notifications
scheduleTaskNotification({
    ...task,
    dueDate: snoozedUntil,
    preNotifyOffsets: task.preNotifyOffsets  // DON'T DO THIS!
});
```

---

## 🔄 Integration Points

### 1. Task Store (useTaskStore.ts)

**Update Task Interface:**
```typescript
export interface Task {
    // ... existing fields
    snoozeEnabled?: boolean;
    snoozeDuration?: string;
    snoozedUntil?: string;
    snoozeCount?: number;
}
```

**Add snoozeTask Action:**
```typescript
snoozeTask: (id: string) => void;
```

**Update addTask (optional snooze params):**
```typescript
addTask: (
    title: string,
    dueDate?: string,
    priority?: TaskPriority,
    description?: string,
    repeatType?: RepeatType,
    repeatConfig?: RepeatConfig,
    preNotifyOffsets?: string[],
    snoozeEnabled?: boolean,
    snoozeDuration?: string
) => string;
```

### 2. Notification Observer

**Create useNotificationObserver hook:**
```typescript
// core/notifications/useNotificationObserver.ts

export function useNotificationObserver() {
    useEffect(() => {
        const subscription = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                const { actionIdentifier, notification } = response;
                const taskId = notification.request.content.data?.taskId;
                
                if (!taskId) return;
                
                if (actionIdentifier === ACTION_SNOOZE) {
                    useTaskStore.getState().snoozeTask(taskId);
                } else if (actionIdentifier === ACTION_COMPLETE) {
                    useTaskStore.getState().toggleTaskStatus(taskId);
                }
            }
        );
        
        return () => subscription.remove();
    }, []);
}
```

### 3. App Integration

**In app/_layout.tsx:**
```typescript
import { useNotificationObserver } from '../core/notifications/useNotificationObserver';

export default function RootLayout() {
    useNotificationObserver();  // Add this
    // ... rest of layout
}
```

### 4. AddTaskModal & EditTaskModal

**Add SnoozePicker:**
```typescript
<SnoozePicker
    enabled={snoozeEnabled}
    duration={snoozeDuration}
    onChange={(enabled, duration) => {
        setSnoozeEnabled(enabled);
        setSnoozeDuration(duration);
    }}
/>
```

### 5. SyncService

**Update TaskRow Interface:**
```typescript
interface TaskRow {
    // ... existing fields
    snooze_enabled: boolean | null;
    snooze_duration: string | null;
    snoozed_until: string | null;
    snooze_count: number | null;
}
```

---

## 🗄️ Database Migration

```sql
-- Phase 4: Snooze
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS snooze_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS snooze_duration TEXT,
ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS snooze_count INTEGER DEFAULT 0;

-- Index for querying snoozed tasks
CREATE INDEX IF NOT EXISTS idx_tasks_snoozed 
ON tasks(snoozed_until) 
WHERE snoozed_until IS NOT NULL;

-- Comments
COMMENT ON COLUMN tasks.snooze_enabled IS 'Whether snooze is enabled for this task';
COMMENT ON COLUMN tasks.snooze_duration IS 'ISO 8601 duration for snooze (e.g., PT5M, PT10M, PT30M)';
COMMENT ON COLUMN tasks.snoozed_until IS 'Timestamp when snoozed notification should fire';
COMMENT ON COLUMN tasks.snooze_count IS 'Number of times task has been snoozed';
```

---

## 🧪 Testing Scenarios

### Test 1: Basic Snooze
```
1. Create task with snooze enabled (10 min)
2. Set due: 2 minutes from now
3. Wait for notification
4. Tap "Snooze" button
5. Verify: Notification reappears in 10 minutes
6. Verify: No pre-notifications replay
```

### Test 2: Snooze Disabled
```
1. Create task with snooze disabled
2. Wait for notification
3. Verify: No "Snooze" button appears
```

### Test 3: Snooze with Repeat
```
1. Create daily repeating task with snooze
2. Notification appears
3. Tap "Snooze"
4. Wait for snoozed notification
5. Complete task
6. Verify: Task reschedules to next day (repeat works)
7. Verify: Snooze didn't affect repeat schedule
```

### Test 4: Snooze with Inactive Toggle
```
1. Create task with snooze enabled
2. Notification appears
3. Toggle task inactive
4. Try to snooze
5. Verify: Snooze doesn't work (task is inactive)
```

### Test 5: Multiple Snoozes
```
1. Create task with snooze enabled
2. Notification appears
3. Snooze (1st time)
4. Wait for snoozed notification
5. Snooze again (2nd time)
6. Verify: snoozeCount = 2
7. Verify: Each snooze works correctly
```

---

## ✅ Implementation Checklist

### Step 1: Data Model
- [ ] Update Task interface with snooze fields
- [ ] Update TaskState interface
- [ ] Add migration to persist config

### Step 2: Store Actions
- [ ] Implement snoozeTask action
- [ ] Update addTask signature (optional)
- [ ] Update updateTask signature (optional)
- [ ] Test state updates

### Step 3: Notification Observer
- [ ] Create useNotificationObserver hook
- [ ] Handle ACTION_SNOOZE
- [ ] Handle ACTION_COMPLETE
- [ ] Integrate in app layout

### Step 4: UI Component
- [ ] Create SnoozePicker.tsx
- [ ] Dropdown with enable/disable
- [ ] Duration selection
- [ ] Style for dark mode

### Step 5: Modal Integration
- [ ] Update AddTaskModal
- [ ] Update EditTaskModal
- [ ] Add state management
- [ ] Update function calls

### Step 6: Notification Scheduling
- [ ] Update scheduleTaskNotification for snooze
- [ ] Ensure pre-notifications don't replay
- [ ] Update notification button text
- [ ] Test notification actions

### Step 7: Sync Integration
- [ ] Update SyncService TaskRow
- [ ] Update toDbRow
- [ ] Update fromDbRow
- [ ] Test database sync

### Step 8: Database
- [ ] Create migration SQL
- [ ] Run migration in Supabase
- [ ] Verify columns added
- [ ] Test data storage

### Step 9: Testing
- [ ] Test basic snooze
- [ ] Test with repeat
- [ ] Test with inactive toggle
- [ ] Test multiple snoozes
- [ ] Verify no regressions

---

## 🎯 Success Criteria

Phase 4 is complete when:
- ✅ Can enable/disable snooze for tasks
- ✅ Can select snooze duration
- ✅ Snooze button appears in notifications
- ✅ Tapping snooze reschedules notification
- ✅ Pre-notifications don't replay
- ✅ Works with active/inactive toggle
- ✅ Works with repeat logic
- ✅ Doesn't modify other features
- ✅ Database sync works
- ✅ No regressions

---

**Estimated Time:** 2-3 hours  
**Complexity:** Medium  
**Dependencies:** Phase 1 (Active/Inactive), Phase 3 (Notify Before)

---

**Ready to implement following Master Spec exactly!**
