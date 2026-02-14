import * as Haptics from 'expo-haptics';
import { CheckCircle2, Circle, Clock, MoreHorizontal, Repeat, Search, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Switch, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft, LinearTransition } from 'react-native-reanimated';
import { cancelTaskNotifications, scheduleTaskNotification } from '../../core/notifications/NotificationManager';
import { formatRepeatConfig } from '../../core/scheduling/RepeatCalculator';
import { Task, useTaskStore } from '../../core/store/useTaskStore';
import { getShadowStyle } from '../../lib/shadow';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { deleteTaskFromRemote, syncAll } from '../../services/SyncService';
import { AIAssistantButton } from '../AIAssistantButton'; // Phase 2: AI Assistant
import { AIResearchPanel } from '../AIResearchPanel'; // Phase 3: Research Mode

interface TaskItemProps {
    task: Task;
    onEdit?: (task: Task) => void;
}

export function TaskItem({ task, onEdit }: TaskItemProps) {
    const { toggleTaskStatus, deleteTask, toggleTaskActive } = useTaskStore();
    const isCompleted = task.status === 'completed';
    const [showResearch, setShowResearch] = useState(false); // Phase 3: Research Mode
    const [isExpanded, setIsExpanded] = useState(false);

    const handleToggle = async () => {
        const currentTask = useTaskStore.getState().tasks.find(t => t.id === task.id);
        const wasCompleted = currentTask?.status === 'completed';

        toggleTaskStatus(task.id);

        // NEW: Phase 2 - Reschedule notification for repeating tasks
        if (!wasCompleted && currentTask?.repeatType && currentTask.repeatType !== 'NONE' && currentTask.isActive) {
            // Task was just completed and is repeating
            // Wait a bit for store to update with next occurrence
            setTimeout(async () => {
                const updatedTask = useTaskStore.getState().tasks.find(t => t.id === task.id);
                if (updatedTask && updatedTask.dueDate) {
                    console.log('[TaskItem] Rescheduling notification for repeating task');
                    const { scheduleTaskNotification } = await import('../../core/notifications/NotificationManager');
                    await scheduleTaskNotification(updatedTask);
                }
            }, 100);
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await syncAll(session.user.id);
            }
        } catch (error) {
            console.error('[TaskItem] Sync error:', error);
        }
    };

    const handleActiveToggle = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const newActiveState = !task.isActive;
        console.log('[TaskItem] Toggling active state from', task.isActive, 'to', newActiveState);

        // Toggle in store
        toggleTaskActive(task.id);

        if (newActiveState === false) {
            // Deactivating: Cancel all notifications
            console.log('[TaskItem] Deactivating task, cancelling notifications');
            await cancelTaskNotifications(task.id);
        } else {
            // Activating: Reschedule if future date
            console.log('[TaskItem] Activating task, rescheduling if applicable');
            if (task.dueDate) {
                const dueDate = new Date(task.dueDate);
                const now = new Date();

                if (dueDate > now) {
                    await scheduleTaskNotification({
                        ...task,
                        isActive: true
                    });
                } else {
                    console.log('[TaskItem] Task due date is in the past, not scheduling');
                }
            }
        }

        // Sync to Supabase
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await syncAll(session.user.id);
            }
        } catch (error) {
            console.error('[TaskItem] Sync error:', error);
        }
    };

    const handleDelete = async () => {
        // Delete from local store
        deleteTask(task.id);
        // Delete from Supabase
        await deleteTaskFromRemote(task.id);
    };

    const toggleExpand = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsExpanded(!isExpanded);
    };

    // Priority color helper
    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'high': return 'bg-red-500';
            case 'medium': return 'bg-yellow-500';
            case 'low': return 'bg-blue-500';
            default: return 'bg-zinc-300 dark:bg-zinc-600';
        }
    };

    return (
        <Animated.View
            entering={FadeInRight}
            exiting={FadeOutLeft}
            layout={LinearTransition.springify()}
            className={cn(
                "mb-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 overflow-hidden",
                isCompleted && "opacity-60"
            )}
            style={getShadowStyle({ elevation: 2, opacity: 0.05 })}
        >
            {/* Main Row */}
            <View className="flex-row items-start p-4">
                {/* Left: Checkbox */}
                <Pressable
                    onPress={handleToggle}
                    className="mt-0.5 active:opacity-70"
                    hitSlop={8}
                >
                    {isCompleted ? (
                        <CheckCircle2 size={24} className="text-emerald-500" fill="#10b981" color="white" />
                    ) : (
                        <Circle size={24} className="text-zinc-300 dark:text-zinc-600" strokeWidth={2} />
                    )}
                </Pressable>

                {/* Center: Content */}
                <Pressable
                    className="flex-1 ml-3 mr-2"
                    onPress={() => onEdit?.(task)}
                >
                    <View className="flex-row items-center gap-2">
                        <Text className={cn(
                            "text-base font-semibold text-zinc-900 dark:text-zinc-100",
                            isCompleted && "line-through text-zinc-400 dark:text-zinc-500"
                        )}>
                            {typeof task.title === 'string' ? task.title : String(task.title || '')}
                        </Text>

                        {/* Minimal Priority Indicator */}
                        {task.priority && (
                            <View className={cn("w-2 h-2 rounded-full", getPriorityColor(task.priority))} />
                        )}
                    </View>

                    {/* Meta Row: Date & Repeat */}
                    <View className="flex-row items-center gap-3 mt-1">
                        {task.dueDate && (
                            <View className="flex-row items-center gap-1">
                                <Clock size={12} className={isCompleted ? "text-zinc-300" : "text-zinc-400"} />
                                <Text className={cn(
                                    "text-xs",
                                    isCompleted ? "text-zinc-300" : "text-zinc-500 dark:text-zinc-400"
                                )}>
                                    {new Date(task.dueDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        )}

                        {task.repeatType && task.repeatType !== 'NONE' && (
                            <View className="flex-row items-center gap-1">
                                <Repeat size={12} className={isCompleted ? "text-zinc-300" : "text-primary dark:text-primary-dark"} />
                                <Text className={cn(
                                    "text-xs",
                                    isCompleted ? "text-zinc-300" : "text-primary dark:text-primary-dark"
                                )}>
                                    {formatRepeatConfig(task)}
                                </Text>
                            </View>
                        )}
                    </View>
                </Pressable>

                {/* Right: Actions */}
                <View className="flex-row items-center gap-3">
                    {/* AI Button - Visible on card */}
                    <AIAssistantButton task={task} size="small" />

                    {/* Active Toggle - Visible on card */}
                    <Switch
                        value={task.isActive ?? true}
                        onValueChange={handleActiveToggle}
                        trackColor={{ false: '#e4e4e7', true: '#820AD1' }}
                        thumbColor={(task.isActive ?? true) ? '#ffffff' : '#f4f4f5'}
                        style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
                    />

                    {/* More Button */}
                    <TouchableOpacity
                        onPress={toggleExpand}
                        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                        className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800 z-50"
                    >
                        <MoreHorizontal size={20} className="text-zinc-400 dark:text-zinc-500" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Collapsible Action Row */}
            {
                isExpanded && (
                    <View className="flex-row items-center justify-end gap-2 px-4 pb-3 pt-0 border-t border-zinc-50 dark:border-zinc-800/50 mt-1">
                        <View className="flex-row items-center gap-4 pt-3">
                            {/* Research Button */}
                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setShowResearch(true);
                                }}
                                className="flex-row items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg active:opacity-70"
                            >
                                <Search size={14} className="text-zinc-600 dark:text-zinc-400" />
                                <Text className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Research</Text>
                            </TouchableOpacity>

                            {/* Delete Button */}
                            <TouchableOpacity
                                onPress={handleDelete}
                                className="flex-row items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg active:opacity-70"
                            >
                                <Trash2 size={14} className="text-red-500 dark:text-red-400" />
                                <Text className="text-xs font-medium text-red-500 dark:text-red-400">Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )
            }

            {/* Phase 3: Research Modal */}
            <AIResearchPanel
                visible={showResearch}
                task={task}
                onClose={() => setShowResearch(false)}
            />
        </Animated.View >
    );
}
