import { Alert } from 'react-native';
import { rescheduleNotificationsForTasks } from '../core/notifications/NotificationManager';
import { Task, useTaskStore } from '../core/store/useTaskStore';
import { supabase } from '../lib/supabase';

// Database row type from Supabase
interface TaskRow {
    id: string;
    local_id: string;  // Same as id - used for local reference
    user_id: string;
    title: string;
    due_date: string | null;
    scheduled_date: string | null;  // Phase 1
    scheduled_time: string | null;  // Phase 1
    timezone: string | null;        // Phase 1
    is_active: boolean;             // Phase 1
    repeat_type: string | null;     // Phase 2
    repeat_config: any | null;      // Phase 2 (JSONB)
    last_completed_at: string | null; // Phase 2
    next_occurrence: string | null;   // Phase 2
    pre_notify_offsets: string[] | null; // Phase 3
    snooze_enabled: boolean | null;  // Phase 4
    snooze_duration: string | null;  // Phase 4
    snoozed_until: string | null;    // Phase 4
    snooze_count: number | null;     // Phase 4
    priority: string | null;
    description: string | null;
    status: string;
    updated_at: string;
    created_at: string;
}

// Track last push timestamp to prevent self-triggering
let lastPushTimestamp = 0;
const SELF_TRIGGER_COOLDOWN_MS = 1000; // 1 second cooldown after pushing (reduced for faster cross-device sync)

// Sync timeout mechanism to prevent stuck sync locks
let syncStartedAt: number | null = null;
const SYNC_TIMEOUT_MS = 30000; // 30 second timeout for sync operations

// Convert local Task to database row format (is_synced is local-only, not stored in DB)
function toDbRow(task: Task, userId: string): Partial<TaskRow> {
    return {
        id: task.id,
        local_id: task.id,  // Use same value as id
        user_id: userId,
        title: task.title,
        due_date: task.dueDate || null,
        scheduled_date: task.scheduledDate || null,  // Phase 1
        scheduled_time: task.scheduledTime || null,  // Phase 1
        timezone: task.timezone || null,             // Phase 1
        is_active: task.isActive ?? true,            // Phase 1
        repeat_type: task.repeatType || null,        // Phase 2
        repeat_config: task.repeatConfig || null,    // Phase 2
        last_completed_at: task.lastCompletedAt || null, // Phase 2
        next_occurrence: task.nextOccurrence || null,    // Phase 2
        pre_notify_offsets: task.preNotifyOffsets || null, // Phase 3
        snooze_enabled: task.snoozeEnabled || null,  // Phase 4
        snooze_duration: task.snoozeDuration || null, // Phase 4
        snoozed_until: task.snoozedUntil || null,    // Phase 4
        snooze_count: task.snoozeCount || null,      // Phase 4
        priority: task.priority || null,
        description: task.description || null,
        status: task.status,
        updated_at: task.updatedAt || new Date().toISOString(),
        created_at: task.createdAt,
    };
}

// Convert database row to local Task format
function fromDbRow(row: TaskRow): Task {
    return {
        id: row.id,
        user_id: row.user_id,
        title: row.title,
        dueDate: row.due_date || undefined,
        scheduledDate: row.scheduled_date || undefined,  // Phase 1
        scheduledTime: row.scheduled_time || undefined,  // Phase 1
        timezone: row.timezone || undefined,             // Phase 1
        isActive: row.is_active ?? true,                 // Phase 1
        repeatType: (row.repeat_type as Task['repeatType']) || undefined, // Phase 2
        repeatConfig: row.repeat_config || undefined,    // Phase 2
        lastCompletedAt: row.last_completed_at || undefined, // Phase 2
        nextOccurrence: row.next_occurrence || undefined,    // Phase 2
        preNotifyOffsets: row.pre_notify_offsets || undefined, // Phase 3
        snoozeEnabled: row.snooze_enabled || undefined,  // Phase 4
        snoozeDuration: row.snooze_duration || undefined, // Phase 4
        snoozedUntil: row.snoozed_until || undefined,    // Phase 4
        snoozeCount: row.snooze_count || undefined,      // Phase 4
        priority: (row.priority as Task['priority']) || 'medium',
        description: row.description || undefined,
        status: row.status as Task['status'],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isSynced: true,
    };
}

// Validate if a string is a proper UUID
function isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
}

/**
 * Push local unsynced changes to Supabase
 */
export async function pushChanges(userId: string): Promise<{ pushed: number; errors: string[]; skipped: number }> {
    console.log('[SyncService] pushChanges starting for user:', userId);
    const store = useTaskStore.getState();

    // Debug: Log total tasks and sync status
    const allTasks = store.tasks;
    console.log('[SyncService] Total tasks in store:', allTasks.length);
    const unsyncedCount = allTasks.filter(t => !t.isSynced).length;
    console.log('[SyncService] Unsynced count (manual filter):', unsyncedCount);

    const unsyncedTasks = store.getUnsyncedTasks();
    console.log('[SyncService] Unsynced tasks (getter):', unsyncedTasks.length);
    if (unsyncedTasks.length > 0) {
        console.log('[SyncService] Unsynced task IDs:', unsyncedTasks.map(t => `${t.id.substring(0, 8)}... (${t.title})`).join(', '));
    }

    if (unsyncedTasks.length === 0) {
        console.log('[SyncService] No unsynced tasks to push');
        return { pushed: 0, errors: [], skipped: 0 };
    }

    const errors: string[] = [];
    let pushed = 0;
    let skipped = 0;

    for (const task of unsyncedTasks) {
        // Skip tasks with invalid UUIDs (legacy tasks)
        if (!isValidUUID(task.id)) {
            console.log('[SyncService] Skipping task with invalid UUID:', task.id);
            // Mark as synced to stop retrying, or delete it
            store.markTaskSynced(task.id);
            skipped++;
            continue;
        }

        try {
            const row = toDbRow(task, userId);
            console.log('[SyncService] Upserting task:', task.id.substring(0, 8) + '...', task.title);

            const { error } = await supabase
                .from('tasks')
                .upsert(row, { onConflict: 'id' });

            if (error) {
                console.error('[SyncService] Upsert error for task', task.id, ':', error);
                errors.push(`Task ${task.title}: ${error.message}`);
            } else {
                store.markTaskSynced(task.id);
                pushed++;
                console.log('[SyncService] ✅ Task synced:', task.id.substring(0, 8) + '...', task.title);
            }
        } catch (err: any) {
            console.error('[SyncService] Push error for task', task.id, ':', err);
            errors.push(`Task ${task.title}: ${err.message}`);
        }
    }

    // Mark push timestamp to prevent self-triggering from realtime
    if (pushed > 0) {
        lastPushTimestamp = Date.now();
        console.log('[SyncService] ✅ Push complete. Pushed:', pushed, 'tasks. Set cooldown timestamp.');
    }

    console.log('[SyncService] Push summary - Pushed:', pushed, 'Skipped:', skipped, 'Errors:', errors.length);
    return { pushed, errors, skipped };
}

/**
 * Pull remote changes from Supabase
 * Fetches ALL tasks and compares with local to detect:
 * 1. New/updated tasks from remote
 * 2. Tasks deleted from remote (exist locally but not on server)
 */
export async function pullChanges(userId: string): Promise<{ pulled: number; deleted: number; errors: string[] }> {
    console.log('[SyncService] pullChanges starting for user:', userId);
    const store = useTaskStore.getState();

    const errors: string[] = [];
    let pulled = 0;
    let deleted = 0;
    const newOrUpdatedTasks: Task[] = [];

    try {
        // Fetch ALL tasks for this user from Supabase
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('[SyncService] Pull error:', error);
            errors.push(error.message);
            return { pulled: 0, deleted: 0, errors };
        }

        console.log('[SyncService] Remote tasks fetched:', data?.length || 0);

        const remoteTasks = (data || []) as TaskRow[];
        const remoteTaskIds = new Set(remoteTasks.map(t => t.id));
        const localTasks = store.tasks;
        
        console.log('[SyncService] Local tasks:', localTasks.length);

        // 1. Upsert remote tasks to local (add new or update existing)
        for (const row of remoteTasks) {
            const task = fromDbRow(row);
            const localTask = localTasks.find(t => t.id === task.id);

            console.log('[SyncService] Comparing task:', task.id.substring(0, 8) + '...',
                'local exists:', !!localTask,
                'local updatedAt:', localTask?.updatedAt,
                'remote updatedAt:', task.updatedAt);

            // Normalize timestamps for comparison
            const localTime = localTask?.updatedAt ? new Date(localTask.updatedAt).getTime() : 0;
            const remoteTime = task.updatedAt ? new Date(task.updatedAt).getTime() : 0;

            console.log('[SyncService] Comparing task:', task.id.substring(0, 8) + '...',
                'local exists:', !!localTask,
                'local time:', localTime,
                'remote time:', remoteTime,
                'diff:', remoteTime - localTime,
                'local isSynced:', localTask?.isSynced);

            // CRITICAL FIX: Use >= instead of > to handle equal timestamps
            // Remote wins on ties to ensure cross-platform consistency
            // If local doesn't exist, we definitely pull
            // If local exists but is synced and remote is same or newer, pull (remote is source of truth)
            if (!localTask || remoteTime >= localTime) {
                console.log('[SyncService] ✅ Pulling task:', task.id.substring(0, 8) + '...', task.title, 'reason:', !localTask ? 'new task' : remoteTime > localTime ? 'remote newer' : 'remote same (remote wins)');
                store.upsertTaskFromRemote(task);
                pulled++;
                newOrUpdatedTasks.push(task); // Track for notification scheduling
            } else {
                console.log('[SyncService] ⏭️  Skipping task:', task.id.substring(0, 8) + '...', 'reason: local is newer');
            }
        }

        // 2. Detect and remove tasks deleted from remote
        // A task should be deleted locally if:
        // - It exists locally AND is synced (isSynced = true)
        // - It does NOT exist on the server
        // - It's a valid UUID (not a legacy task)
        for (const localTask of localTasks) {
            if (
                localTask.isSynced &&
                isValidUUID(localTask.id) &&
                !remoteTaskIds.has(localTask.id)
            ) {
                console.log('[SyncService] 🗑️  Removing locally - deleted from remote:', localTask.id.substring(0, 8) + '...', localTask.title);
                store.deleteTask(localTask.id);
                deleted++;
            }
        }

        // 3. Schedule notifications for newly pulled tasks
        // Use the safer method that doesn't cancel all existing notifications
        if (newOrUpdatedTasks.length > 0) {
            console.log('[SyncService] 🔔 Scheduling notifications for', newOrUpdatedTasks.length, 'new/updated tasks');
            await rescheduleNotificationsForTasks(newOrUpdatedTasks);
        }

        // Update last sync timestamp
        store.setLastSyncAt(new Date().toISOString());
        console.log('[SyncService] ✅ Pull complete. Pulled:', pulled, 'Deleted:', deleted);
    } catch (err: any) {
        console.error('[SyncService] Pull exception:', err);
        errors.push(err.message);
    }

    return { pulled, deleted, errors };
}

/**
 * Full sync: pull remote changes first, then push local changes
 */
export async function syncAll(userId: string): Promise<{
    pulled: number;
    pushed: number;
    errors: string[]
}> {
    console.log('[SyncService] ========================================');
    console.log('[SyncService] 🔄 syncAll starting for user:', userId.substring(0, 8) + '...');
    console.log('[SyncService] ========================================');
    const store = useTaskStore.getState();

    // Check if sync is stuck (exceeded timeout) and reset if needed
    if (store.isSyncing && syncStartedAt !== null) {
        const elapsed = Date.now() - syncStartedAt;
        if (elapsed > SYNC_TIMEOUT_MS) {
            console.warn('[SyncService] ⚠️  Sync lock timed out after', elapsed, 'ms. Resetting lock.');
            store.setIsSyncing(false);
            syncStartedAt = null;
        }
    }

    // Prevent concurrent syncs
    if (store.isSyncing) {
        console.log('[SyncService] ⏭️  Sync already in progress, skipping');
        return { pulled: 0, pushed: 0, errors: [] };
    }

    store.setIsSyncing(true);
    syncStartedAt = Date.now();

    try {
        // Ensure all local tasks have user_id
        store.setUserIdForTasks(userId);

        // Pull first (remote wins for conflicts)
        console.log('[SyncService] 📥 Starting PULL phase...');
        const pullResult = await pullChanges(userId);

        // Then push local changes
        console.log('[SyncService] 📤 Starting PUSH phase...');
        const pushResult = await pushChanges(userId);

        const result = {
            pulled: pullResult.pulled,
            pushed: pushResult.pushed,
            errors: [...pullResult.errors, ...pushResult.errors],
        };

        console.log('[SyncService] ========================================');
        console.log('[SyncService] ✅ syncAll complete:', result);
        console.log('[SyncService] ========================================');

        // DEBUG: Show sync result visually (only for errors)
        if (result.errors.length > 0) {
            Alert.alert('Sync Errors', result.errors.join('\n'));
        }

        return result;
    } catch (err: any) {
        console.error('[SyncService] ❌ syncAll error:', err);
        // Don't show alert for every sync error to avoid spam
        console.error('[SyncService] Sync failed:', err.message || 'Unknown error');
        return { pulled: 0, pushed: 0, errors: [err.message] };
    } finally {
        store.setIsSyncing(false);
        syncStartedAt = null;
    }
}

/**
 * Check if there are any unsynced tasks
 */
export function hasUnsyncedTasks(): boolean {
    return useTaskStore.getState().getUnsyncedTasks().length > 0;
}

/**
 * Delete a task from Supabase
 */
export async function deleteTaskFromRemote(taskId: string): Promise<{ success: boolean; error?: string }> {
    console.log('[SyncService] Deleting task from remote:', taskId);

    // Only delete if it's a valid UUID (skip legacy tasks)
    if (!isValidUUID(taskId)) {
        console.log('[SyncService] Skipping delete for invalid UUID:', taskId);
        return { success: true };
    }

    try {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);

        if (error) {
            console.error('[SyncService] Delete error:', error);
            return { success: false, error: error.message };
        }

        console.log('[SyncService] Task deleted from remote:', taskId);
        return { success: true };
    } catch (err: any) {
        console.error('[SyncService] Delete exception:', err);
        return { success: false, error: err.message };
    }
}

// Debounce for realtime updates
// Balanced: Fast enough for good UX, slow enough to prevent loops
let realtimeSyncTimeout: ReturnType<typeof setTimeout> | null = null;
const REALTIME_DEBOUNCE_MS = 300; // 300ms debounce for faster cross-device sync (reduced from 500ms)

/**
 * Subscribe to Supabase Realtime changes for tasks
 */
export function subscribeToTasks(userId: string, onChange: () => void) {
    console.log('[SyncService] Subscribing to realtime changes for user:', userId);

    const subscription = supabase
        .channel('tasks_realtime')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'tasks',
                filter: `user_id=eq.${userId}`,
            },
            (payload) => {
                const taskId = (payload.new as any)?.id || (payload.old as any)?.id;
                console.log('[SyncService] Realtime change detected:', payload.eventType, 'task:', taskId);

                // Check if this is a self-triggered event (we just pushed)
                const timeSinceLastPush = Date.now() - lastPushTimestamp;
                if (timeSinceLastPush < SELF_TRIGGER_COOLDOWN_MS) {
                    console.log('[SyncService] Ignoring self-triggered realtime event (pushed', timeSinceLastPush, 'ms ago)');
                    return;
                }

                // Debounce rapid updates
                if (realtimeSyncTimeout) {
                    clearTimeout(realtimeSyncTimeout);
                }

                realtimeSyncTimeout = setTimeout(() => {
                    console.log('[SyncService] Executing debounced realtime sync for event:', payload.eventType);
                    onChange();
                }, REALTIME_DEBOUNCE_MS);
            }
        )
        .subscribe((status) => {
            console.log('[SyncService] Subscription status:', status);
            if (status === 'SUBSCRIBED') {
                console.log('[SyncService] ✅ Successfully subscribed to realtime updates');
            } else if (status === 'CHANNEL_ERROR') {
                console.error('[SyncService] ❌ Realtime subscription error');
            }
        });

    return () => {
        console.log('[SyncService] Unsubscribing from realtime changes');
        if (realtimeSyncTimeout) {
            clearTimeout(realtimeSyncTimeout);
        }
        supabase.removeChannel(subscription);
    };
}
