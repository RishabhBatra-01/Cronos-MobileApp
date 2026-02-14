# Phase 2: UI Integration Guide

## 🎯 Quick Integration Steps

Phase 2 core is complete! Here's how to finish the UI integration:

---

## Step 1: Update AddTaskModal

**File:** `cronos-app/components/AddTaskModal.tsx`

### 1.1 Add Imports
```typescript
import { RepeatPicker } from './RepeatPicker';
import { RepeatType, RepeatConfig } from '../core/store/useTaskStore';
```

### 1.2 Add State
```typescript
const [repeatType, setRepeatType] = useState<RepeatType>('NONE');
const [repeatConfig, setRepeatConfig] = useState<RepeatConfig>(null);
```

### 1.3 Add RepeatPicker to UI (after PriorityPicker)
```typescript
{/* Repeat Picker */}
<View className="mb-4">
    <Text className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
        Repeat
    </Text>
    <RepeatPicker
        repeatType={repeatType}
        repeatConfig={repeatConfig}
        onChange={(type, config) => {
            setRepeatType(type);
            setRepeatConfig(config);
        }}
    />
</View>
```

### 1.4 Update addTask Call
Currently:
```typescript
const taskId = addTask(title.trim(), isoDate, priority, description.trim() || undefined);
```

Needs to be updated to pass repeat data (will need to update addTask signature first)

---

## Step 2: Update useTaskStore addTask Action

**File:** `cronos-app/core/store/useTaskStore.ts`

### 2.1 Update Function Signature
```typescript
addTask: (
    title: string, 
    dueDate?: string, 
    priority?: TaskPriority, 
    description?: string,
    repeatType?: RepeatType,
    repeatConfig?: RepeatConfig
) => string;
```

### 2.2 Update Implementation
```typescript
addTask: (
    title: string, 
    dueDate?: string, 
    priority: TaskPriority = 'medium', 
    description?: string,
    repeatType: RepeatType = 'NONE',
    repeatConfig: RepeatConfig = null
) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    set((state) => ({
        tasks: [
            ...state.tasks,
            {
                id,
                title,
                dueDate,
                priority,
                description,
                isActive: true,
                repeatType,        // NEW
                repeatConfig,      // NEW
                status: "pending",
                createdAt: now,
                updatedAt: now,
                isSynced: false,
            },
        ],
    }));
    return id;
},
```

---

## Step 3: Update EditTaskModal

**File:** `cronos-app/components/EditTaskModal.tsx`

### 3.1 Add Imports
```typescript
import { RepeatPicker } from './RepeatPicker';
import { RepeatType, RepeatConfig } from '../core/store/useTaskStore';
```

### 3.2 Add State
```typescript
const [repeatType, setRepeatType] = useState<RepeatType>('NONE');
const [repeatConfig, setRepeatConfig] = useState<RepeatConfig>(null);
```

### 3.3 Initialize from Task
```typescript
useEffect(() => {
    if (task) {
        setTitle(task.title);
        setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
        setPriority(task.priority || 'medium');
        setDescription(task.description || '');
        setRepeatType(task.repeatType || 'NONE');      // NEW
        setRepeatConfig(task.repeatConfig || null);    // NEW
    }
}, [task]);
```

### 3.4 Add RepeatPicker to UI
```typescript
{/* Repeat Picker */}
<View className="mb-4">
    <Text className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
        Repeat
    </Text>
    <RepeatPicker
        repeatType={repeatType}
        repeatConfig={repeatConfig}
        onChange={(type, config) => {
            setRepeatType(type);
            setRepeatConfig(config);
        }}
    />
</View>
```

### 3.5 Update updateTask Call
Need to update updateTask signature and pass repeat data

---

## Step 4: Update useTaskStore updateTask Action

**File:** `cronos-app/core/store/useTaskStore.ts`

### 4.1 Update Function Signature
```typescript
updateTask: (
    id: string, 
    title: string, 
    dueDate?: string, 
    priority?: TaskPriority, 
    description?: string,
    repeatType?: RepeatType,
    repeatConfig?: RepeatConfig
) => void;
```

### 4.2 Update Implementation
```typescript
updateTask: (
    id: string, 
    title: string, 
    dueDate?: string, 
    priority?: TaskPriority, 
    description?: string,
    repeatType?: RepeatType,
    repeatConfig?: RepeatConfig
) =>
    set((state) => ({
        tasks: state.tasks.map((task) =>
            task.id === id
                ? {
                    ...task,
                    title,
                    dueDate,
                    priority: priority !== undefined ? priority : task.priority,
                    description: description !== undefined ? description : task.description,
                    repeatType: repeatType !== undefined ? repeatType : task.repeatType,      // NEW
                    repeatConfig: repeatConfig !== undefined ? repeatConfig : task.repeatConfig, // NEW
                    updatedAt: new Date().toISOString(),
                    isSynced: false,
                }
                : task
        ),
    })),
```

---

## Step 5: Add Visual Indicators to TaskItem

**File:** `cronos-app/components/ui/TaskItem.tsx`

### 5.1 Add Import
```typescript
import { formatRepeatConfig } from '../../core/scheduling/RepeatCalculator';
```

### 5.2 Add Repeat Indicator (after due date)
```typescript
{task.repeatType && task.repeatType !== 'NONE' && (
    <View className="flex-row items-center gap-1 mt-1">
        <Text className="text-xs text-blue-500 dark:text-blue-400">
            🔁 {formatRepeatConfig(task)}
        </Text>
    </View>
)}
```

---

## Step 6: Run Database Migration

In Supabase SQL Editor, run:
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

## 🧪 Testing Checklist

### Test 1: Create Daily Repeating Task
1. Open Add Task modal
2. Enter title: "Take vitamins"
3. Set due date: Tomorrow at 9 AM
4. Set repeat: Daily, every 1 day
5. Save task
6. **Verify:** Task appears in list with 🔁 Daily indicator
7. Complete the task
8. **Verify:** Task reappears with next day's date
9. **Verify:** Status is "pending"

### Test 2: Create Weekly Repeating Task
1. Create task: "Team meeting"
2. Set repeat: Weekly on Mon, Wed, Fri
3. Set due date: Next Monday at 10 AM
4. Save and complete on Monday
5. **Verify:** Reschedules to Wednesday
6. Complete on Wednesday
7. **Verify:** Reschedules to Friday

### Test 3: Create Monthly Repeating Task
1. Create task: "Pay rent"
2. Set repeat: Monthly on day 1
3. Set due date: Next month, day 1 at 12 PM
4. Save task
5. **Verify:** Shows "Monthly on day 1"
6. Complete task
7. **Verify:** Reschedules to following month

### Test 4: Edit Repeat Configuration
1. Create non-repeating task
2. Edit task
3. Change to Daily repeat
4. Save
5. **Verify:** Task now shows repeat indicator
6. Complete task
7. **Verify:** Reschedules correctly

### Test 5: Inactive Repeating Task
1. Create daily repeating task
2. Toggle inactive
3. Complete task
4. **Verify:** Does NOT reschedule
5. Toggle active
6. Complete task
7. **Verify:** NOW reschedules

---

## 📊 Expected Behavior

### When Creating Repeating Task
- Repeat picker shows in modal
- Can select type and configure
- Task saves with repeat data
- Shows repeat indicator in list

### When Completing Repeating Task
- Task status briefly shows "completed"
- Immediately reschedules to next occurrence
- Status resets to "pending"
- Due date updates
- Notification rescheduled
- lastCompletedAt timestamp saved

### When Editing Repeating Task
- Current repeat config loads
- Can change repeat settings
- Changes save correctly
- Repeat indicator updates

---

## 🚨 Common Issues & Solutions

### Issue: Repeat picker not showing
**Solution:** Check imports and state initialization

### Issue: Task doesn't reschedule
**Solution:** Check isActive is true and repeatType is not 'NONE'

### Issue: Wrong next occurrence
**Solution:** Check RepeatCalculator logic and timezone

### Issue: Database sync fails
**Solution:** Run migration SQL in Supabase

---

## 🎯 Success Criteria

Phase 2 is complete when:
- ✅ Can create repeating tasks
- ✅ Can edit repeat configuration
- ✅ Tasks reschedule on completion
- ✅ Notifications reschedule automatically
- ✅ Visual indicators show repeat status
- ✅ Database sync works
- ✅ All repeat types work correctly
- ✅ Edge cases handled (Feb 31, DST, etc.)

---

**Estimated time to complete:** 1-2 hours  
**Complexity:** Medium  
**Dependencies:** Phase 1 must be working

---

**Ready to implement? Follow the steps above in order!**
