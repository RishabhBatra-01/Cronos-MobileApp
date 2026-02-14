import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useTaskStore } from '../store/useTaskStore';
import { ACTION_SNOOZE_5M, ACTION_SNOOZE_10M, ACTION_SNOOZE_30M, ACTION_COMPLETE, scheduleTaskNotification } from './NotificationManager';

/**
 * Notification Observer Hook
 * 
 * Listens for notification responses (button taps) and handles them.
 * Snooze: Multiple options (5m, 10m, 30m) available at notification time
 */
export function useNotificationObserver() {
    useEffect(() => {
        console.log('[NotificationObserver] Setting up notification response listener');
        
        const subscription = Notifications.addNotificationResponseReceivedListener(
            async (response) => {
                const { actionIdentifier, notification } = response;
                const taskId = notification.request.content.data?.taskId as string | undefined;
                
                console.log('[NotificationObserver] Response received:', {
                    action: actionIdentifier,
                    taskId,
                });
                
                if (!taskId) {
                    console.log('[NotificationObserver] No taskId in notification data');
                    return;
                }
                
                const store = useTaskStore.getState();
                const task = store.tasks.find(t => t.id === taskId);
                
                if (!task) {
                    console.log('[NotificationObserver] Task not found:', taskId);
                    return;
                }
                
                // Handle Snooze actions - Multiple durations
                let snoozeMinutes = 0;
                
                if (actionIdentifier === ACTION_SNOOZE_5M) {
                    snoozeMinutes = 5;
                } else if (actionIdentifier === ACTION_SNOOZE_10M) {
                    snoozeMinutes = 10;
                } else if (actionIdentifier === ACTION_SNOOZE_30M) {
                    snoozeMinutes = 30;
                }
                
                if (snoozeMinutes > 0) {
                    console.log('[NotificationObserver] Handling snooze for task:', task.title, 'Duration:', snoozeMinutes, 'minutes');
                    
                    // Calculate snooze time
                    const now = new Date();
                    const snoozedUntil = new Date(now.getTime() + (snoozeMinutes * 60 * 1000));
                    
                    console.log('[NotificationObserver] Snoozing until:', snoozedUntil.toISOString());
                    
                    // Update task's due date in store
                    store.updateTask(
                        taskId,
                        task.title,
                        snoozedUntil.toISOString(),
                        task.priority,
                        task.description,
                        task.repeatType,
                        task.repeatConfig,
                        undefined, // Don't replay pre-notifications
                        task.snoozeEnabled,
                        task.snoozeDuration
                    );
                    
                    // Schedule snoozed notification
                    await scheduleTaskNotification({
                        ...task,
                        dueDate: snoozedUntil.toISOString(),
                        preNotifyOffsets: undefined, // Don't replay pre-notifications
                    });
                    
                    console.log('[NotificationObserver] Task updated and snoozed notification scheduled for:', snoozedUntil.toISOString());
                }
                
                // Handle Complete action
                else if (actionIdentifier === ACTION_COMPLETE) {
                    console.log('[NotificationObserver] Handling complete for task:', task.title);
                    store.toggleTaskStatus(taskId);
                }
                
                // Handle default tap (open app)
                else if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
                    console.log('[NotificationObserver] User tapped notification (default action)');
                    // App will open, no additional action needed
                }
            }
        );
        
        console.log('[NotificationObserver] Listener registered');
        
        return () => {
            console.log('[NotificationObserver] Removing listener');
            subscription.remove();
        };
    }, []);
}
