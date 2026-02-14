# Phase 1: Data Model & Active/Inactive Toggle

## 🎯 Objective

Implement the foundation: update data model and add Active/Inactive toggle functionality.

## 📝 Requirements from Master Spec

### Data Model
```typescript
{
  "scheduledDate": "YYYY-MM-DD",
  "scheduledTime": "HH:mm",
  "timezone": "IANA timezone",
  "isActive": true
}
```

### Behavior Rules
- **Active (true)**: Task participates in scheduling
- **Inactive (false)**: Task is fully paused, all triggers cancelled
- **Default**: `true` on creation
- **Toggle OFF**: Cancel all triggers, preserve configuration
- **Toggle ON**: Resume from next valid future occurrence

---

## 🔧 Implementation Steps

### Step 1: Update Task Interface

**File:** `cronos-app/core/store/useTaskStore.ts`

**Changes:**
```typescript
export interface Task {
    id: string;
    user_id?: string;
    title: string;
    dueDate?: string; // Keep for backward compatibility
    
    // NEW: Scheduling fields
    scheduledDate?: string;  // "YYYY-MM-DD"
    scheduledTime?: string;  // "HH:mm"
    timezone?: string;       // IANA timezone
    isActive: boolean;       // Default: true
    
    priority?: TaskPriority;
    description?: string;
    status: TaskStatus;
    createdAt: string;
    updatedAt?: string;
    isSynced?: boolean;
}
```

**Migration Strategy:**
- Keep `dueDate` for backward compatibility
- New tasks use `scheduledDate` + `scheduledTime` + `timezone`
- Old tasks continue to work with `dueDate`


### Step 2: Update Task Store Actions

**File:** `cronos-app/core/store/useTaskStore.ts`

**Add new action:**
```typescript
toggleTaskActive: (id: string) => void;
```

**Implementation:**
```typescript
toggleTaskActive: (id: string) =>
    set((state) => ({
        tasks: state.tasks.map((task) =>
            task.id === id
                ? {
                    ...task,
                    isActive: !task.isActive,
                    updatedAt: new Date().toISOString(),
                    isSynced: false,
                }
                : task
        ),
    })),
```

### Step 3: Update Notification Manager

**File:** `cronos-app/core/notifications/NotificationManager.ts`

**Add function to cancel all task notifications:**
```typescript
export async function cancelTaskNotifications(taskId: string): Promise<void> {
    try {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        const taskNotifications = scheduled.filter(
            notif => notif.content.data?.taskId === taskId
        );
        
        for (const notif of taskNotifications) {
            await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
        
        console.log(`[Notifications] Cancelled ${taskNotifications.length} notifications for task ${taskId}`);
    } catch (error) {
        console.error('[Notifications] Error cancelling task notifications:', error);
    }
}
```

**Update scheduleTaskNotification:**
```typescript
export async function scheduleTaskNotification(task: Task): Promise<string | null> {
    // Check if task is active
    if (task.isActive === false) {
        console.log('[Notifications] Task is inactive, skipping notification');
        return null;
    }
    
    // ... rest of existing logic
}
```

### Step 4: Create Active/Inactive Toggle Component

**File:** `cronos-app/components/ActiveToggle.tsx`

```typescript
import { View, Text, Switch } from 'react-native';
import { Task, useTaskStore } from '../core/store/useTaskStore';
import { cancelTaskNotifications, scheduleTaskNotification } from '../core/notifications/NotificationManager';
import * as Haptics from 'expo-haptics';

interface ActiveToggleProps {
    task: Task;
}

export function ActiveToggle({ task }: ActiveToggleProps) {
    const { toggleTaskActive } = useTaskStore();
    
    const handleToggle = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        const newActiveState = !task.isActive;
        
        // Toggle in store
        toggleTaskActive(task.id);
        
        if (newActiveState === false) {
            // Deactivating: Cancel all notifications
            await cancelTaskNotifications(task.id);
        } else {
            // Activating: Reschedule if future date
            if (task.dueDate) {
                const dueDate = new Date(task.dueDate);
                const now = new Date();
                
                if (dueDate > now) {
                    await scheduleTaskNotification({
                        ...task,
                        isActive: true
                    });
                }
            }
        }
    };
    
    return (
        <View className="flex-row items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
            <View className="flex-1">
                <Text className="text-sm font-medium text-zinc-900 dark:text-white">
                    Active
                </Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {task.isActive 
                        ? 'Task will trigger notifications' 
                        : 'Task is paused'}
                </Text>
            </View>
            <Switch
                value={task.isActive}
                onValueChange={handleToggle}
                trackColor={{ false: '#d4d4d8', true: '#3b82f6' }}
                thumbColor={task.isActive ? '#ffffff' : '#f4f4f5'}
            />
        </View>
    );
}
```

### Step 5: Update TaskItem to Show Active Status

**File:** `cronos-app/components/ui/TaskItem.tsx`

**Add visual indicator:**
```typescript
// Add after the priority badge
{!task.isActive && (
    <View className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700">
        <Text className="text-xs text-zinc-500 dark:text-zinc-400">
            Paused
        </Text>
    </View>
)}
```

### Step 6: Update EditTaskModal

**File:** `cronos-app/components/EditTaskModal.tsx`

**Add ActiveToggle component:**
```typescript
import { ActiveToggle } from './ActiveToggle';

// Add in the modal content, after description field
{task && <ActiveToggle task={task} />}
```

### Step 7: Database Migration (Supabase)

**File:** `cronos-app/supabase-migration-active-toggle.sql`

```sql
-- Add new columns to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS scheduled_date DATE,
ADD COLUMN IF NOT EXISTS scheduled_time TIME,
ADD COLUMN IF NOT EXISTS timezone TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for active tasks
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(is_active) WHERE is_active = true;

-- Migrate existing dueDate to new format (optional, for future use)
-- This keeps dueDate as primary field for now
```

### Step 8: Update SyncService

**File:** `cronos-app/services/SyncService.ts`

**Update taskToSupabaseRow:**
```typescript
function taskToSupabaseRow(task: Task): any {
    return {
        id: task.id,
        user_id: task.user_id,
        title: task.title,
        due_date: task.dueDate || null,
        scheduled_date: task.scheduledDate || null,
        scheduled_time: task.scheduledTime || null,
        timezone: task.timezone || null,
        is_active: task.isActive ?? true,
        priority: task.priority || 'medium',
        description: task.description || null,
        status: task.status,
        updated_at: task.updatedAt || new Date().toISOString(),
        created_at: task.createdAt,
    };
}
```

**Update supabaseRowToTask:**
```typescript
function supabaseRowToTask(row: any): Task {
    return {
        id: row.id,
        user_id: row.user_id,
        title: row.title,
        dueDate: row.due_date,
        scheduledDate: row.scheduled_date,
        scheduledTime: row.scheduled_time,
        timezone: row.timezone,
        isActive: row.is_active ?? true,
        priority: row.priority || 'medium',
        description: row.description,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isSynced: true,
    };
}
```

---

## ✅ Testing Checklist

### Test Case 1: Create New Task
- [ ] New task has `isActive: true` by default
- [ ] Notification is scheduled
- [ ] Task appears in list

### Test Case 2: Toggle Active → Inactive
- [ ] Toggle switches to OFF
- [ ] "Paused" badge appears
- [ ] All notifications are cancelled
- [ ] Task configuration is preserved

### Test Case 3: Toggle Inactive → Active
- [ ] Toggle switches to ON
- [ ] "Paused" badge disappears
- [ ] Notification is rescheduled (if future date)
- [ ] No notification if past date

### Test Case 4: Inactive Task Behavior
- [ ] No notification fires
- [ ] Task remains in list
- [ ] Can still edit task
- [ ] Can delete task

### Test Case 5: Sync with Supabase
- [ ] Active state syncs to database
- [ ] Active state syncs from database
- [ ] Backward compatibility with old tasks

### Test Case 6: Backward Compatibility
- [ ] Existing tasks without `isActive` default to `true`
- [ ] Old tasks continue to work
- [ ] No breaking changes

---

## 🚨 Critical Rules

1. **Never modify** `scheduledDate`, `scheduledTime`, `timezone` when toggling
2. **Always cancel** all notifications when deactivating
3. **Default to** `true` for new tasks
4. **Preserve** all task configuration when toggling
5. **Check** `isActive` before scheduling any notification

---

## 📦 Files to Create/Modify

### New Files
- `cronos-app/components/ActiveToggle.tsx`
- `cronos-app/supabase-migration-active-toggle.sql`

### Modified Files
- `cronos-app/core/store/useTaskStore.ts`
- `cronos-app/core/notifications/NotificationManager.ts`
- `cronos-app/components/ui/TaskItem.tsx`
- `cronos-app/components/EditTaskModal.tsx`
- `cronos-app/services/SyncService.ts`

---

## 🎯 Success Criteria

Phase 1 is complete when:
1. ✅ Task interface includes all new fields
2. ✅ Active/Inactive toggle works in UI
3. ✅ Notifications are cancelled on deactivate
4. ✅ Notifications are rescheduled on activate
5. ✅ All tests pass
6. ✅ Backward compatibility maintained
7. ✅ Database migration applied

---

**Ready to implement Phase 1?**
