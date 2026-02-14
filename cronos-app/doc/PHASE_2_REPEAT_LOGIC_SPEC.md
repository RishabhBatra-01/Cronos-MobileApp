# Phase 2: Repeat Logic - Implementation Spec

## 🎯 Objective

Implement automatic task rescheduling with support for DAILY, WEEKLY, MONTHLY, and CUSTOM repeat patterns.

## 📝 Requirements from Master Spec

### Supported Repeat Types
1. **NONE** - Task fires once, then expires
2. **DAILY** - Repeats every N days
3. **WEEKLY** - Repeats on specific days of week
4. **MONTHLY** - Repeats on specific day of month
5. **CUSTOM** - Deterministic custom rules

### Critical Rules
- Repeat calculations based on stored ISO timestamp (absolute instant)
- Timezone-aware: uses stored timezone
- Wall-clock time remains constant in user's timezone
- Only active tasks participate in repeat scheduling
- After trigger fires, calculate next occurrence automatically

---

## 🔧 Implementation Steps

### Step 1: Update Data Model

**File:** `cronos-app/core/store/useTaskStore.ts`

**Add Types:**
```typescript
export type RepeatType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

export interface DailyRepeatConfig {
    intervalDays: number; // e.g., 1 = every day, 2 = every 2 days
}

export interface WeeklyRepeatConfig {
    daysOfWeek: string[]; // ['MON', 'WED', 'FRI']
    intervalWeeks: number; // e.g., 1 = every week, 2 = every 2 weeks
}

export interface MonthlyRepeatConfig {
    dayOfMonth: number; // 1-31
    intervalMonths: number; // e.g., 1 = every month, 3 = every 3 months
}

export type RepeatConfig = 
    | DailyRepeatConfig 
    | WeeklyRepeatConfig 
    | MonthlyRepeatConfig 
    | null;
```

**Update Task Interface:**
```typescript
export interface Task {
    // ... existing fields
    
    // NEW: Repeat fields (Phase 2)
    repeatType?: RepeatType;
    repeatConfig?: RepeatConfig;
    lastCompletedAt?: string; // ISO timestamp of last completion
    nextOccurrence?: string;  // ISO timestamp of next scheduled occurrence
}
```

### Step 2: Create Repeat Calculation Utility

**File:** `cronos-app/core/scheduling/RepeatCalculator.ts` (NEW)

**Functions:**
- `calculateNextOccurrence(task: Task): string | null`
- `calculateNextDaily(lastTrigger: Date, config: DailyRepeatConfig, timezone: string): Date`
- `calculateNextWeekly(lastTrigger: Date, config: WeeklyRepeatConfig, timezone: string): Date`
- `calculateNextMonthly(lastTrigger: Date, config: MonthlyRepeatConfig, timezone: string): Date`

**Key Logic:**
```typescript
// Example: Daily repeat
function calculateNextDaily(
    lastTrigger: Date, 
    config: DailyRepeatConfig,
    timezone: string
): Date {
    // Add intervalDays to lastTrigger
    const next = new Date(lastTrigger);
    next.setDate(next.getDate() + config.intervalDays);
    return next;
}
```

### Step 3: Create Repeat Picker UI Component

**File:** `cronos-app/components/RepeatPicker.tsx` (NEW)

**UI Structure:**
```
Repeat: [None ▼]

When "Daily" selected:
  Every [1] day(s)

When "Weekly" selected:
  Every [1] week(s) on:
  [Mon] [Tue] [Wed] [Thu] [Fri] [Sat] [Sun]

When "Monthly" selected:
  Every [1] month(s) on day [15]
```

### Step 4: Update Task Completion Logic

**File:** `cronos-app/core/store/useTaskStore.ts`

**Update `toggleTaskStatus`:**
```typescript
toggleTaskStatus: (id: string) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;
    
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    
    // If completing a repeating task
    if (newStatus === 'completed' && task.repeatType && task.repeatType !== 'NONE') {
        // Calculate next occurrence
        const nextOccurrence = calculateNextOccurrence(task);
        
        if (nextOccurrence) {
            // Create new task instance for next occurrence
            // OR update current task with new due date
            // (Decision: Update current task to maintain history)
            set((state) => ({
                tasks: state.tasks.map((t) =>
                    t.id === id
                        ? {
                            ...t,
                            status: 'pending', // Reset to pending
                            dueDate: nextOccurrence,
                            lastCompletedAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            isSynced: false,
                        }
                        : t
                ),
            }));
            
            // Schedule notification for next occurrence
            scheduleTaskNotification({
                ...task,
                dueDate: nextOccurrence,
                status: 'pending'
            });
            
            return;
        }
    }
    
    // Normal toggle (non-repeating or no next occurrence)
    set((state) => ({
        tasks: state.tasks.map((t) =>
            t.id === id
                ? {
                    ...t,
                    status: newStatus,
                    updatedAt: new Date().toISOString(),
                    isSynced: false,
                }
                : t
        ),
    }));
}
```

### Step 5: Update AddTaskModal

**File:** `cronos-app/components/AddTaskModal.tsx`

**Add:**
- Import RepeatPicker
- State for repeat type and config
- RepeatPicker component in UI
- Pass repeat data to addTask

### Step 6: Update EditTaskModal

**File:** `cronos-app/components/EditTaskModal.tsx`

**Add:**
- Import RepeatPicker
- State for repeat type and config
- RepeatPicker component in UI
- Pass repeat data to updateTask

### Step 7: Update Database Schema

**File:** `cronos-app/supabase-migration-phase2-repeat.sql` (NEW)

```sql
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS repeat_type TEXT,
ADD COLUMN IF NOT EXISTS repeat_config JSONB,
ADD COLUMN IF NOT EXISTS last_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_occurrence TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tasks_repeat 
ON tasks(repeat_type) 
WHERE repeat_type IS NOT NULL AND repeat_type != 'NONE';

CREATE INDEX IF NOT EXISTS idx_tasks_next_occurrence 
ON tasks(next_occurrence) 
WHERE next_occurrence IS NOT NULL;
```

### Step 8: Update SyncService

**File:** `cronos-app/services/SyncService.ts`

**Update:**
- `TaskRow` interface with new fields
- `toDbRow` to include repeat fields
- `fromDbRow` to parse repeat fields

---

## 🎨 UI Design

### Repeat Picker Component

```
┌─────────────────────────────────────┐
│ Repeat                              │
│ ┌─────────────────────────────────┐ │
│ │ None                          ▼ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

When "Daily" selected:
┌─────────────────────────────────────┐
│ Repeat                              │
│ ┌─────────────────────────────────┐ │
│ │ Daily                         ▼ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Every [1] day(s)                    │
└─────────────────────────────────────┘

When "Weekly" selected:
┌─────────────────────────────────────┐
│ Repeat                              │
│ ┌─────────────────────────────────┐ │
│ │ Weekly                        ▼ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Every [1] week(s) on:               │
│ [M] [T] [W] [T] [F] [S] [S]        │
│  ✓   ✓       ✓                     │
└─────────────────────────────────────┘

When "Monthly" selected:
┌─────────────────────────────────────┐
│ Repeat                              │
│ ┌─────────────────────────────────┐ │
│ │ Monthly                       ▼ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Every [1] month(s) on day [15]      │
└─────────────────────────────────────┘
```

---

## 🧪 Testing Scenarios

### Test 1: Daily Repeat
1. Create task "Take vitamins"
2. Set repeat: Daily, every 1 day
3. Set due date: Today at 9 AM
4. Complete the task
5. **Verify:** Task reappears with tomorrow 9 AM
6. **Verify:** Status is "pending"
7. **Verify:** Notification scheduled for tomorrow

### Test 2: Weekly Repeat
1. Create task "Team meeting"
2. Set repeat: Weekly, every 1 week on Mon, Wed, Fri
3. Set due date: Next Monday at 10 AM
4. Complete on Monday
5. **Verify:** Task reappears for Wednesday 10 AM
6. Complete on Wednesday
7. **Verify:** Task reappears for Friday 10 AM

### Test 3: Monthly Repeat
1. Create task "Pay rent"
2. Set repeat: Monthly, every 1 month on day 1
3. Set due date: Feb 1 at 12 PM
4. Complete the task
5. **Verify:** Task reappears for Mar 1 at 12 PM
6. **Verify:** Time remains 12 PM (wall-clock preserved)

### Test 4: Inactive Repeating Task
1. Create daily repeating task
2. Toggle inactive
3. Complete the task
4. **Verify:** Task does NOT reschedule
5. **Verify:** No notification scheduled

### Test 5: DST Transition
1. Create daily task before DST change
2. Complete task after DST change
3. **Verify:** Wall-clock time preserved (e.g., 9 AM stays 9 AM)
4. **Verify:** Timezone offset updated correctly

---

## 🚨 Critical Rules

1. **Only active tasks repeat** - Check `isActive` before rescheduling
2. **Preserve wall-clock time** - 9 AM stays 9 AM in user's timezone
3. **Use stored timezone** - Don't use device timezone
4. **Calculate from last trigger** - Not from completion time
5. **Handle edge cases** - Feb 31, DST transitions, etc.

---

## 📊 Complexity Assessment

| Component | Complexity | Time Estimate |
|-----------|-----------|---------------|
| Data Model | Low | 30 min |
| Repeat Calculator | High | 2 hours |
| Repeat Picker UI | Medium | 1.5 hours |
| Task Completion Logic | High | 1.5 hours |
| UI Integration | Medium | 1 hour |
| Database Migration | Low | 30 min |
| Testing | High | 1 hour |
| **TOTAL** | **High** | **~8 hours** |

---

## 🎯 Success Criteria

Phase 2 is complete when:
1. ✅ All repeat types work correctly
2. ✅ Next occurrence calculated accurately
3. ✅ Timezone handling is correct
4. ✅ Active state is respected
5. ✅ UI is intuitive and clear
6. ✅ Database sync works
7. ✅ All tests pass
8. ✅ No regression in Phase 1

---

**Ready to implement? This is a complex phase, so we'll go step by step.**
