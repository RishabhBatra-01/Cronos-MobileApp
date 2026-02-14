import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import { type Task } from '../store/useTaskStore';
import { subtractDuration, formatDuration } from '../scheduling/DurationUtils';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const REMINDER_CATEGORY = 'REMINDER_ACTION';
export const ACTION_SNOOZE_5M = 'SNOOZE_5M';
export const ACTION_SNOOZE_10M = 'SNOOZE_10M';
export const ACTION_SNOOZE_30M = 'SNOOZE_30M';
export const ACTION_COMPLETE = 'MARK_DONE';

export async function registerForPushNotificationsAsync() {
    console.log('[Notifications] Registering for push notifications...');

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    // Request permissions (works on both device and simulator for iOS)
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('[Notifications] Existing permission status:', existingStatus);

    let finalStatus = existingStatus;

    // Only ask if permissions have not already been determined, because
    // iOS won't necessarily prompt the user a second time.
    if (existingStatus !== 'granted') {
        // Android 13+ requires explicit permission request
        if (Platform.OS === 'android') {
            console.log('[Notifications] Requesting Android permissions...');
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        } else {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        console.log('[Notifications] Requested permission, new status:', finalStatus);
    }

    if (finalStatus !== 'granted') {
        console.log('[Notifications] Permission not granted!');
        Alert.alert('Notifications Disabled', 'Please enable notifications in Settings to receive task reminders.');
        return false;
    }

    console.log('[Notifications] Permission granted!');

    // Register notification category with multiple snooze options
    await Notifications.setNotificationCategoryAsync(REMINDER_CATEGORY, [
        {
            identifier: ACTION_SNOOZE_5M,
            buttonTitle: '5m',
            options: {
                opensAppToForeground: false,
            },
        },
        {
            identifier: ACTION_SNOOZE_10M,
            buttonTitle: '10m',
            options: {
                opensAppToForeground: false,
            },
        },
        {
            identifier: ACTION_SNOOZE_30M,
            buttonTitle: '30m',
            options: {
                opensAppToForeground: false,
            },
        },
        {
            identifier: ACTION_COMPLETE,
            buttonTitle: 'Done',
            options: {
                isDestructive: false,
                opensAppToForeground: false,
            },
        },
    ]);

    console.log('[Notifications] Categories registered with multiple snooze options');
    return true;
}

export async function scheduleTaskNotification(task: Task): Promise<string | null> {
    console.log('[Notifications] scheduleTaskNotification called for:', task.title);

    // Phase 1: Check if task is active
    if (task.isActive === false) {
        console.log('[Notifications] Task is inactive, skipping notification');
        return null;
    }

    if (!task.dueDate) {
        console.log('[Notifications] No due date, skipping');
        return null;
    }

    const triggerDate = new Date(task.dueDate);
    const now = new Date();

    console.log('[Notifications] Trigger date:', triggerDate.toISOString());
    console.log('[Notifications] Now:', now.toISOString());

    if (triggerDate <= now) {
        console.log('[Notifications] Trigger date is in the past, skipping');
        return null;
    }

    // CRITICAL: Cancel any existing notifications for this task first
    await cancelTaskNotifications(task.id);

    // Phase 3: Schedule pre-notifications
    if (task.preNotifyOffsets && task.preNotifyOffsets.length > 0) {
        console.log('[Notifications] Scheduling', task.preNotifyOffsets.length, 'pre-notifications');
        
        for (let i = 0; i < task.preNotifyOffsets.length; i++) {
            const offset = task.preNotifyOffsets[i];
            
            try {
                const preNotifyTime = subtractDuration(triggerDate, offset);
                
                // Skip if pre-notification time is in the past
                if (preNotifyTime <= now) {
                    console.log('[Notifications] Pre-notification', offset, 'is in the past, skipping');
                    continue;
                }
                
                const millisecondsUntil = preNotifyTime.getTime() - now.getTime();
                const seconds = Math.max(1, Math.floor(millisecondsUntil / 1000));
                
                console.log('[Notifications] Scheduling pre-notification', offset, 'in', seconds, 'seconds');
                
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: `⏰ Reminder: ${task.title}`,
                        body: `Due in ${formatDuration(offset)}`,
                        sound: true,
                        data: { 
                            taskId: task.id,
                            type: 'pre-notification',
                            offset: offset,
                            scheduledAt: now.toISOString(),
                            triggerAt: preNotifyTime.toISOString()
                        },
                        categoryIdentifier: REMINDER_CATEGORY,
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                        seconds: seconds,
                        repeats: false,
                    },
                });
                
                console.log('[Notifications] Pre-notification scheduled for', preNotifyTime.toISOString());
            } catch (error) {
                console.error('[Notifications] Failed to schedule pre-notification:', offset, error);
            }
        }
    }

    // Schedule main notification
    const triggerTimestamp = triggerDate.getTime();
    const nowTimestamp = now.getTime();
    const millisecondsUntilTrigger = triggerTimestamp - nowTimestamp;
    const seconds = Math.max(1, Math.floor(millisecondsUntilTrigger / 1000));
    
    console.log('[Notifications] Scheduling main notification in', seconds, 'seconds');

    try {
        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: "⏰ Task Reminder",
                body: task.title,
                sound: true,
                data: { 
                    taskId: task.id,
                    type: 'main',
                    scheduledAt: now.toISOString(),
                    triggerAt: triggerDate.toISOString()
                },
                categoryIdentifier: REMINDER_CATEGORY,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: seconds,
                repeats: false,
            },
        });
        console.log('[Notifications] Main notification scheduled! ID:', notificationId);

        // Log all scheduled notifications for debugging
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        console.log('[Notifications] Total scheduled notifications:', scheduled.length);

        return notificationId;
    } catch (error) {
        console.error('[Notifications] Failed to schedule main notification:', error);
        return null;
    }
}

// Cancel notification for a specific task
export async function cancelTaskNotification(taskId: string) {
    console.log('[Notifications] Cancelling notification for task:', taskId);
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduled) {
        if (notification.content.data?.taskId === taskId) {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
            console.log('[Notifications] Cancelled notification:', notification.identifier);
        }
    }
}

// NEW: Cancel ALL notifications for a specific task (including pre-notifications and snoozed)
// This is used when deactivating a task
export async function cancelTaskNotifications(taskId: string): Promise<void> {
    try {
        console.log('[Notifications] Cancelling ALL notifications for task:', taskId);
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        const taskNotifications = scheduled.filter(
            notif => notif.content.data?.taskId === taskId
        );
        
        for (const notif of taskNotifications) {
            await Notifications.cancelScheduledNotificationAsync(notif.identifier);
            console.log('[Notifications] Cancelled notification:', notif.identifier);
        }
        
        console.log(`[Notifications] Cancelled ${taskNotifications.length} notification(s) for task ${taskId}`);
    } catch (error) {
        console.error('[Notifications] Error cancelling task notifications:', error);
    }
}

// Test notification - fires in 5 seconds
export async function sendTestNotification() {
    console.log('[Notifications] Sending TEST notification in 5 seconds...');

    try {
        // First check permissions
        const { status } = await Notifications.getPermissionsAsync();
        console.log('[Notifications] Current permission status:', status);

        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Notification permission not granted. Please enable in Settings.');
            return;
        }

        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: "🔔 Test Notification",
                body: "If you see this, notifications are working!",
                sound: true,
                data: { test: true },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 5,
                repeats: false,
            },
        });

        console.log('[Notifications] Test notification scheduled! ID:', notificationId);
        Alert.alert('Test Scheduled', 'A notification will appear in 5 seconds. Make sure to MINIMIZE the app to see it!');
    } catch (error) {
        console.error('[Notifications] Test notification failed:', error);
        Alert.alert('Error', 'Failed to schedule test notification: ' + String(error));
    }
}

// Get all scheduled notifications for debugging
export async function getAllScheduledNotifications() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log('[Notifications] Scheduled notifications:', JSON.stringify(scheduled, null, 2));
    return scheduled;
}

// Reschedule notifications for specific tasks
// IMPROVED: Always cancels and reschedules to ensure consistent timing across devices
export async function rescheduleNotificationsForTasks(tasks: Task[]) {
    console.log('[Notifications] Rescheduling notifications for', tasks.length, 'tasks');

    let scheduledCount = 0;
    const now = new Date();

    for (const task of tasks) {
        if (task.status === 'completed') continue;
        if (task.isActive === false) continue; // NEW: Skip inactive tasks
        if (!task.dueDate) continue;

        const due = new Date(task.dueDate);
        if (due <= now) continue;

        // CRITICAL: Always cancel and reschedule to ensure consistent timing
        // This fixes the cross-device notification delay issue
        console.log('[Notifications] Rescheduling task:', task.id, 'due at:', task.dueDate);
        const result = await scheduleTaskNotification(task);
        if (result) {
            scheduledCount++;
        }
    }

    console.log(`[Notifications] Reschedule complete. Scheduled: ${scheduledCount}`);
}

// Full reschedule - cancels ALL and reschedules everything (use sparingly)
export async function rescheduleNotifications(tasks: Task[]) {
    console.log('[Notifications] FULL Rescheduling ALL notifications for', tasks.length, 'tasks');

    // Cancel all existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[Notifications] Cancelled all existing notifications');

    // Schedule for applicable tasks
    let scheduledCount = 0;
    const now = new Date();

    for (const task of tasks) {
        if (task.status === 'completed') continue;
        if (task.isActive === false) continue; // NEW: Skip inactive tasks
        if (!task.dueDate) continue;

        const due = new Date(task.dueDate);
        if (due > now) {
            const result = await scheduleTaskNotification(task);
            if (result) {
                scheduledCount++;
            }
        }
    }

    console.log(`[Notifications] Full reschedule complete. Scheduled ${scheduledCount} reminders.`);
}
