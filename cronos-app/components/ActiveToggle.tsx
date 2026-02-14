import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { cancelTaskNotifications, scheduleTaskNotification } from '../core/notifications/NotificationManager';
import { Task, useTaskStore } from '../core/store/useTaskStore';

interface ActiveToggleProps {
    task: Task;
}

export function ActiveToggle({ task }: ActiveToggleProps) {
    const { toggleTaskActive, tasks } = useTaskStore();
    // Use local state synced with store to ensure reactivity
    const [isActive, setIsActive] = useState(task.isActive ?? true);

    // Sync with store when task changes
    useEffect(() => {
        const currentTask = tasks.find(t => t.id === task.id);
        if (currentTask) {
            setIsActive(currentTask.isActive ?? true);
        }
    }, [tasks, task.id]);

    const handleToggle = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const newActiveState = !isActive;
        console.log('[ActiveToggle] Toggling from', isActive, 'to', newActiveState);

        // Update local state immediately for UI responsiveness
        setIsActive(newActiveState);

        // Toggle in store
        toggleTaskActive(task.id);

        if (newActiveState === false) {
            // Deactivating: Cancel all notifications
            console.log('[ActiveToggle] Deactivating task, cancelling notifications');
            await cancelTaskNotifications(task.id);
        } else {
            // Activating: Reschedule if future date
            console.log('[ActiveToggle] Activating task, rescheduling if applicable');
            if (task.dueDate) {
                const dueDate = new Date(task.dueDate);
                const now = new Date();

                if (dueDate > now) {
                    await scheduleTaskNotification({
                        ...task,
                        isActive: true
                    });
                } else {
                    console.log('[ActiveToggle] Task due date is in the past, not scheduling');
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
                    {isActive
                        ? 'Task will trigger notifications'
                        : 'Task is paused'}
                </Text>
            </View>
            <Switch
                value={isActive}
                onValueChange={handleToggle}
                trackColor={{ false: '#d4d4d8', true: '#820AD1' }}
                thumbColor={isActive ? '#ffffff' : '#f4f4f5'}
            />
        </View>
    );
}
