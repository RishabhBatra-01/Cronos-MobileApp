# Phase 3: Notify Before - Implementation Spec

## 📋 Master Spec Requirements

From `NewFeatureImplementation.md` Section 4:

### 4.1 Purpose
> "Notify Before provides early warnings before the main trigger without modifying it."

### 4.2 Data Model
```typescript
"preNotifyOffsets": ["PT5M", "PT15M", "PT1H"]
```

### 4.3 Trigger Rule
> "For each offset: preNotifyTrigger = mainTrigger - offset"

### 4.4 Rules
1. Each offset creates a separate notification
2. If calculated time is in the past → skip it
3. Main trigger must always fire
4. Applies to each repeat occurrence
5. Only active tasks schedule pre-notifications

### 4.5 Snooze Interaction
> "Pre-notifications are NOT replayed on snooze"

---

## 🎯 Implementation Goals

1. Add `preNotifyOffsets` field to Task interface
2. Create NotifyBeforePicker UI component
3. Update NotificationManager to schedule multiple notifications
4. Integrate with Add/Edit modals
5. Handle repeat occurrences correctly
6. Respect active/inactive toggle
7. Database migration

---

## 📊 Data Model Changes

### Task Interface Update

```typescript
interface Task {
    // ... existing fields
    
    // Phase 3: Notify Before
    preNotifyOffsets?: string[];  // ISO 8601 duration format
}
```

### Offset Format (ISO 8601 Duration)

```typescript
"PT5M"   = 5 minutes
"PT15M"  = 15 minutes
"PT30M"  = 30 minutes
"PT1H"   = 1 hour
"PT2H"   = 2 hours
"PT1D"   = 1 day
```

**Why ISO 8601?**
- Standard format
- Unambiguous
- Easy to parse
- Matches Master Spec

---

## 🎨 UI Component: NotifyBeforePicker

### Design

```
┌─────────────────────────────────────┐
│ Notify Before                       │
│                                     │
│ ☐ 5 minutes before                 │
│ ☐ 15 minutes before                │
│ ☐ 30 minutes before                │
│ ☐ 1 hour before                    │
│ ☐ 2 hours before                   │
│ ☐ 1 day before                     │
└─────────────────────────────────────┘
```

### Features
- Multiple selection (checkboxes)
- Pre-defined common intervals
- Clear visual feedback
- Dark mode support

### Props

```typescript
interface NotifyBeforePickerProps {
    value: string[];  // Selected offsets
    onChange: (offsets: string[]) => void;
}
```

---

## 🔔 Notification Scheduling Logic

### Current (Phase 1-2)
```typescript
scheduleTaskNotification(task) {
    // Schedule single notification at dueDate
    scheduleNotification({
        id: task.id,
        trigger: task.dueDate
    });
}
```

### New (Phase 3)
```typescript
scheduleTaskNotification(task) {
    const mainTrigger = new Date(task.dueDate);
    const now = new Date();
    
    // 1. Schedule pre-notifications
    if (task.isActive && task.preNotifyOffsets) {
        task.preNotifyOffsets.forEach((offset, index) => {
            const preNotifyTime = subtractDuration(mainTrigger, offset);
            
            // Skip if in the past
            if (preNotifyTime > now) {
                scheduleNotification({
                    id: `${task.id}-pre-${index}`,
                    trigger: preNotifyTime,
                    title: `Reminder: ${task.title}`,
                    body: `Due in ${formatDuration(offset)}`
                });
            }
        });
    }
    
    // 2. Schedule main notification (always)
    if (mainTrigger > now) {
        scheduleNotification({
            id: task.id,
            trigger: mainTrigger,
            title: task.title,
            body: 'Task is due now'
        });
    }
}
```

---

## 🔄 Integration Points

### 1. Task Store (useTaskStore.ts)

**Update Task Interface:**
```typescript
export interface Task {
    // ... existing fields
    preNotifyOffsets?: string[];  // Phase 3
}
```

**Update addTask:**
```typescript
addTask: (
    title: string,
    dueDate?: string,
    priority?: TaskPriority,
    description?: string,
    repeatType?: RepeatType,
    repeatConfig?: RepeatConfig,
    preNotifyOffsets?: string[]  // NEW
) => string;
```

**Update updateTask:**
```typescript
updateTask: (
    id: string,
    title: string,
    dueDate?: string,
    priority?: TaskPriority,
    description?: string,
    repeatType?: RepeatType,
    repeatConfig?: RepeatConfig,
    preNotifyOffsets?: string[]  // NEW
) => void;
```

### 2. AddTaskModal

**Add State:**
```typescript
const [preNotifyOffsets, setPreNotifyOffsets] = useState<string[]>([]);
```

**Add UI:**
```typescript
<NotifyBeforePicker
    value={preNotifyOffsets}
    onChange={setPreNotifyOffsets}
/>
```

**Update addTask Call:**
```typescript
addTask(
    title,
    isoDate,
    priority,
    description,
    repeatType,
    repeatConfig,
    preNotifyOffsets  // NEW
);
```

### 3. EditTaskModal

**Add State:**
```typescript
const [preNotifyOffsets, setPreNotifyOffsets] = useState<string[]>([]);
```

**Initialize from Task:**
```typescript
useEffect(() => {
    if (task) {
        // ... existing
        setPreNotifyOffsets(task.preNotifyOffsets || []);
    }
}, [task]);
```

**Update updateTask Call:**
```typescript
updateTask(
    task.id,
    title,
    isoDate,
    priority,
    description,
    repeatType,
    repeatConfig,
    preNotifyOffsets  // NEW
);
```

### 4. NotificationManager

**Update scheduleTaskNotification:**
```typescript
export async function scheduleTaskNotification(task: Task) {
    // Cancel existing notifications first
    await cancelTaskNotifications(task.id);
    
    // Only schedule if active
    if (!task.isActive) {
        return;
    }
    
    if (!task.dueDate) {
        return;
    }
    
    const mainTrigger = new Date(task.dueDate);
    const now = new Date();
    
    // Schedule pre-notifications
    if (task.preNotifyOffsets && task.preNotifyOffsets.length > 0) {
        for (let i = 0; i < task.preNotifyOffsets.length; i++) {
            const offset = task.preNotifyOffsets[i];
            const preNotifyTime = subtractDuration(mainTrigger, offset);
            
            if (preNotifyTime > now) {
                await Notifications.scheduleNotificationAsync({
                    identifier: `${task.id}-pre-${i}`,
                    content: {
                        title: `Reminder: ${task.title}`,
                        body: `Due in ${formatDuration(offset)}`,
                        data: { taskId: task.id, type: 'pre-notification' }
                    },
                    trigger: { date: preNotifyTime }
                });
            }
        }
    }
    
    // Schedule main notification
    if (mainTrigger > now) {
        await Notifications.scheduleNotificationAsync({
            identifier: task.id,
            content: {
                title: task.title,
                body: 'Task is due now',
                data: { taskId: task.id, type: 'main' }
            },
            trigger: { date: mainTrigger }
        });
    }
}
```

**Update cancelTaskNotifications:**
```typescript
export async function cancelTaskNotifications(taskId: string) {
    // Cancel main notification
    await Notifications.cancelScheduledNotificationAsync(taskId);
    
    // Cancel all pre-notifications (try common indices)
    for (let i = 0; i < 10; i++) {
        try {
            await Notifications.cancelScheduledNotificationAsync(`${taskId}-pre-${i}`);
        } catch (e) {
            // Notification doesn't exist, continue
        }
    }
}
```

### 5. SyncService

**Update TaskRow Interface:**
```typescript
interface TaskRow {
    // ... existing fields
    pre_notify_offsets: string[] | null;  // NEW
}
```

**Update toDbRow:**
```typescript
function toDbRow(task: Task): TaskRow {
    return {
        // ... existing fields
        pre_notify_offsets: task.preNotifyOffsets || null,
    };
}
```

**Update fromDbRow:**
```typescript
function fromDbRow(row: TaskRow): Task {
    return {
        // ... existing fields
        preNotifyOffsets: row.pre_notify_offsets || undefined,
    };
}
```

---

## 🗄️ Database Migration

```sql
-- Phase 3: Notify Before
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS pre_notify_offsets TEXT[];

-- Index for querying tasks with pre-notifications
CREATE INDEX IF NOT EXISTS idx_tasks_pre_notify 
ON tasks(pre_notify_offsets) 
WHERE pre_notify_offsets IS NOT NULL AND array_length(pre_notify_offsets, 1) > 0;

-- Add comment
COMMENT ON COLUMN tasks.pre_notify_offsets IS 'ISO 8601 duration offsets for pre-notifications (e.g., PT5M, PT1H)';
```

---

## 🛠️ Helper Functions

### Duration Utilities

```typescript
// core/scheduling/DurationUtils.ts

/**
 * Subtract ISO 8601 duration from date
 * @param date - Base date
 * @param duration - ISO 8601 duration (e.g., "PT5M", "PT1H")
 * @returns New date with duration subtracted
 */
export function subtractDuration(date: Date, duration: string): Date {
    const ms = parseDuration(duration);
    return new Date(date.getTime() - ms);
}

/**
 * Parse ISO 8601 duration to milliseconds
 * @param duration - ISO 8601 duration string
 * @returns Duration in milliseconds
 */
export function parseDuration(duration: string): number {
    // PT5M = 5 minutes
    // PT1H = 1 hour
    // PT1D = 1 day
    
    const regex = /PT(?:(\d+)D)?(?:(\d+)H)?(?:(\d+)M)?/;
    const match = duration.match(regex);
    
    if (!match) {
        throw new Error(`Invalid duration format: ${duration}`);
    }
    
    const days = parseInt(match[1] || '0');
    const hours = parseInt(match[2] || '0');
    const minutes = parseInt(match[3] || '0');
    
    return (days * 24 * 60 * 60 * 1000) +
           (hours * 60 * 60 * 1000) +
           (minutes * 60 * 1000);
}

/**
 * Format duration for display
 * @param duration - ISO 8601 duration string
 * @returns Human-readable string
 */
export function formatDuration(duration: string): string {
    const ms = parseDuration(duration);
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}
```

---

## 🧪 Testing Scenarios

### Test 1: Single Pre-Notification
```
Task: "Meeting"
Due: Tomorrow at 10:00 AM
Pre-notify: 15 minutes before

Expected:
- Notification at 9:45 AM: "Reminder: Meeting - Due in 15 minutes"
- Notification at 10:00 AM: "Meeting - Task is due now"
```

### Test 2: Multiple Pre-Notifications
```
Task: "Important call"
Due: Tomorrow at 3:00 PM
Pre-notify: 1 hour before, 15 minutes before

Expected:
- Notification at 2:00 PM: "Reminder: Important call - Due in 1 hour"
- Notification at 2:45 PM: "Reminder: Important call - Due in 15 minutes"
- Notification at 3:00 PM: "Important call - Task is due now"
```

### Test 3: Past Pre-Notification (Skip)
```
Task: "Quick task"
Due: In 5 minutes
Pre-notify: 15 minutes before, 5 minutes before

Expected:
- Skip 15-minute notification (in the past)
- Notification in 0 minutes: "Reminder: Quick task - Due in 5 minutes"
- Notification in 5 minutes: "Quick task - Task is due now"
```

### Test 4: Inactive Task (No Pre-Notifications)
```
Task: "Paused task"
Due: Tomorrow at 10:00 AM
Pre-notify: 15 minutes before
Active: OFF

Expected:
- No notifications scheduled
```

### Test 5: Repeating Task with Pre-Notifications
```
Task: "Daily standup"
Due: Tomorrow at 9:00 AM
Repeat: Daily
Pre-notify: 5 minutes before

Expected:
- Day 1: Notification at 8:55 AM, 9:00 AM
- Complete task
- Day 2: Notification at 8:55 AM, 9:00 AM (rescheduled)
- Complete task
- Day 3: Notification at 8:55 AM, 9:00 AM (rescheduled)
```

---

## ✅ Implementation Checklist

### Step 1: Data Model
- [ ] Update Task interface with preNotifyOffsets
- [ ] Update TaskState interface signatures
- [ ] Add migration to persist config

### Step 2: Helper Functions
- [ ] Create DurationUtils.ts
- [ ] Implement subtractDuration
- [ ] Implement parseDuration
- [ ] Implement formatDuration
- [ ] Add unit tests

### Step 3: NotificationManager
- [ ] Update scheduleTaskNotification
- [ ] Schedule multiple notifications
- [ ] Skip past pre-notifications
- [ ] Update cancelTaskNotifications
- [ ] Test notification IDs

### Step 4: UI Component
- [ ] Create NotifyBeforePicker.tsx
- [ ] Implement checkbox list
- [ ] Add pre-defined options
- [ ] Style for dark mode
- [ ] Test selection logic

### Step 5: Modal Integration
- [ ] Update AddTaskModal
- [ ] Update EditTaskModal
- [ ] Add state management
- [ ] Update function calls
- [ ] Test UI flow

### Step 6: Store Integration
- [ ] Update addTask implementation
- [ ] Update updateTask implementation
- [ ] Test state persistence
- [ ] Verify backward compatibility

### Step 7: Sync Integration
- [ ] Update SyncService TaskRow
- [ ] Update toDbRow
- [ ] Update fromDbRow
- [ ] Test database sync

### Step 8: Database
- [ ] Create migration SQL
- [ ] Run migration in Supabase
- [ ] Verify column added
- [ ] Test data storage

### Step 9: Testing
- [ ] Test single pre-notification
- [ ] Test multiple pre-notifications
- [ ] Test past notification skip
- [ ] Test with inactive toggle
- [ ] Test with repeat
- [ ] Test notification cancellation
- [ ] Verify no regressions

---

## 🎯 Success Criteria

Phase 3 is complete when:
- ✅ Can select pre-notification offsets
- ✅ Multiple notifications schedule correctly
- ✅ Past notifications are skipped
- ✅ Works with active/inactive toggle
- ✅ Works with repeat logic
- ✅ Notifications cancel properly
- ✅ Database sync works
- ✅ No regressions in existing features

---

**Estimated Time:** 2-3 hours  
**Complexity:** Medium  
**Dependencies:** Phase 1 (Active/Inactive), Phase 2 (Repeat)

---

**Ready to implement!**
