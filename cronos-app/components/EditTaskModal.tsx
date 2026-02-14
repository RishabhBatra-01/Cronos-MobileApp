import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { Calendar, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { scheduleTaskNotification } from '../core/notifications/NotificationManager';
import { RepeatConfig, RepeatType, Task, TaskPriority, useTaskStore } from '../core/store/useTaskStore';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { syncAll } from '../services/SyncService';
import { AIAssistantButton } from './AIAssistantButton'; // Phase 2: AI Assistant
import { AIResearchPanel } from './AIResearchPanel'; // Phase 3: Research Mode
import { NotifyBeforePicker } from './NotifyBeforePicker';
import { PriorityPicker } from './PriorityPicker';
import { RepeatPicker } from './RepeatPicker';
import { SnoozePicker } from './SnoozePicker';

interface EditTaskModalProps {
    visible: boolean;
    task: Task | null;
    onClose: () => void;
}

// Markdown styles
const markdownStyles = {
    body: {
        fontSize: 14,
        lineHeight: 22,
        color: '#27272a', // zinc-800
    },
    heading1: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#27272a',
        marginTop: 8,
        marginBottom: 4,
    },
    heading2: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#27272a',
        marginTop: 8,
        marginBottom: 4,
    },
    bullet_list: {
        marginTop: 4,
        marginBottom: 4,
    },
    paragraph: {
        marginTop: 0,
        marginBottom: 8,
    },
};

const markdownStylesDark = {
    ...markdownStyles,
    body: {
        ...markdownStyles.body,
        color: '#f4f4f5', // zinc-100
    },
    heading1: {
        ...markdownStyles.heading1,
        color: '#f4f4f5',
    },
    heading2: {
        ...markdownStyles.heading2,
        color: '#f4f4f5',
    },
};

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function EditTaskModal({ visible, task, onClose }: EditTaskModalProps) {
    const insets = useSafeAreaInsets();
    // ... [State variables keep the same]
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [description, setDescription] = useState('');
    const [repeatType, setRepeatType] = useState<RepeatType>('NONE');
    const [repeatConfig, setRepeatConfig] = useState<RepeatConfig>(null);
    const [preNotifyOffsets, setPreNotifyOffsets] = useState<string[]>([]);
    const [snoozeEnabled, setSnoozeEnabled] = useState(false);
    const [snoozeDuration, setSnoozeDuration] = useState<string | undefined>('PT10M');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showResearch, setShowResearch] = useState(false); // Phase 3: Research Mode
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const { updateTask } = useTaskStore();
    const { colorScheme } = useColorScheme();

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
            setPriority(task.priority || 'medium');
            setDescription(task.description || '');
            setRepeatType(task.repeatType || 'NONE');      // Phase 2
            setRepeatConfig(task.repeatConfig || null);    // Phase 2
            setPreNotifyOffsets(task.preNotifyOffsets || []); // Phase 3
            setSnoozeEnabled(task.snoozeEnabled || false); // Phase 4
            setSnoozeDuration(task.snoozeDuration || 'PT10M'); // Phase 4
            setIsEditingDescription(false); // Reset to view mode on open
        }
    }, [task]);

    // ... (rest of the component logic)

    const handleExternalNoteUpdate = (noteContent: string) => {
        // Append new notes to existing description
        const newDescription = description
            ? `${description}\n\n${noteContent}`
            : noteContent;

        setDescription(newDescription);
        setIsEditingDescription(false); // Switch to view mode to show rendered markdown
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    useEffect(() => {
        if (visible && inputRef.current) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    const handleSubmit = async () => {
        if (!title || typeof title !== 'string' || !title.trim() || !task) return;

        const isoDate = dueDate ? dueDate.toISOString() : undefined;
        // Handle description: empty string should clear the field, not keep old value
        const trimmedDescription = typeof description === 'string' ? description.trim() : '';
        updateTask(
            task.id,
            title.trim(),
            isoDate,
            priority,
            trimmedDescription || undefined,
            repeatType,
            repeatConfig,
            preNotifyOffsets,
            snoozeEnabled,
            snoozeDuration
        );

        // ... (notification logic)

        // Reschedule notification if date is in the future
        if (isoDate && dueDate && dueDate.getTime() > Date.now()) {
            console.log('[EditTaskModal] Rescheduling notification with pre-notify offsets:', preNotifyOffsets);
            scheduleTaskNotification({
                id: task.id,
                title: title.trim(),
                dueDate: isoDate,
                status: task.status,
                createdAt: task.createdAt,
                isActive: task.isActive,
                preNotifyOffsets: preNotifyOffsets  // CRITICAL: Include pre-notify offsets!
            });
        }

        // Sync to Supabase
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                console.log('[EditTaskModal] Syncing to Supabase...');
                await syncAll(session.user.id);
            }
        } catch (error) {
            console.error('[EditTaskModal] Sync error:', error);
        }

        onClose();
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'ios') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setDueDate(selectedDate);
        }
    };

    const handleDatePress = () => {
        if (Platform.OS === 'android') {
            const currentDate = dueDate || new Date();

            console.log('[EditTaskModal] Opening Android Date Picker');
            // 1. Pick Date
            DateTimePickerAndroid.open({
                value: currentDate,
                onChange: (event, date) => {
                    console.log('[EditTaskModal] Date Picker Event:', event.type, date);
                    if (event.type === 'set' && date) {
                        try {
                            // 2. If date picked, delay slightly then Pick Time
                            setTimeout(() => {
                                console.log('[EditTaskModal] Opening Android Time Picker');
                                DateTimePickerAndroid.open({
                                    value: date,
                                    onChange: (event, time) => {
                                        console.log('[EditTaskModal] Time Picker Event:', event.type, time);
                                        if (event.type === 'set' && time) {
                                            const finalDate = new Date(date);
                                            finalDate.setHours(time.getHours());
                                            finalDate.setMinutes(time.getMinutes());
                                            console.log('[EditTaskModal] Final Date Set:', finalDate);
                                            setDueDate(finalDate);
                                        }
                                    },
                                    mode: 'time',
                                    is24Hour: false,
                                });
                            }, 100);
                        } catch (err) {
                            console.error('[EditTaskModal] Error opening time picker:', err);
                        }
                    }
                },
                mode: 'date',
            });
        } else {
            setShowDatePicker(true);
        }
    };

    if (!task) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 justify-end bg-black/50"
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={onClose}
                    className="flex-1"
                />

                <View className="bg-white dark:bg-zinc-900 rounded-t-3xl border-t border-zinc-100 dark:border-zinc-800 max-h-[90%]">
                    <ScrollView
                        className="p-6"
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View className="flex-row items-center justify-between mb-6">
                            <Text className="text-xl font-bold text-zinc-900 dark:text-white">Edit Task</Text>
                            <TouchableOpacity onPress={onClose} className="p-2 -mr-2 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                                <X size={20} className="text-zinc-500 dark:text-zinc-400" pointerEvents="none" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            ref={inputRef}
                            placeholder="What needs to be done?"
                            placeholderTextColor="#a1a1aa"
                            className="text-lg text-zinc-900 dark:text-white mb-4 font-medium h-12"
                            value={title}
                            onChangeText={setTitle}
                            onSubmitEditing={handleSubmit}
                            returnKeyType="done"
                        />

                        {/* Priority Picker */}
                        <View className="mb-4">
                            <Text className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">Priority</Text>
                            <PriorityPicker value={priority} onChange={setPriority} />
                        </View>

                        {/* Notes/Description */}
                        <View className="mb-4">
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Notes (optional)</Text>
                                {/* Toggle Edit Mode */}
                                {description.length > 0 && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setIsEditingDescription(!isEditingDescription);
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        }}
                                        className="p-1"
                                    >
                                        <Text className="text-xs text-primary font-medium">
                                            {isEditingDescription ? 'Done' : 'Edit'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {isEditingDescription || description.length === 0 ? (
                                <TextInput
                                    placeholder="Add details, shopping list, meeting notes..."
                                    placeholderTextColor="#a1a1aa"
                                    className="text-sm text-zinc-900 dark:text-white p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 min-h-[80px]"
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    textAlignVertical="top"
                                    autoFocus={isEditingDescription && description.length > 0}
                                />
                            ) : (
                                <TouchableOpacity
                                    onPress={() => {
                                        setIsEditingDescription(true);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                    activeOpacity={0.9}
                                    className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 min-h-[80px]"
                                >
                                    <Markdown style={colorScheme === 'dark' ? markdownStylesDark : markdownStyles}>
                                        {description}
                                    </Markdown>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Repeat Picker */}
                        <View className="mb-4">
                            <Text className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">Repeat</Text>
                            <RepeatPicker
                                repeatType={repeatType}
                                repeatConfig={repeatConfig}
                                onChange={(type, config) => {
                                    setRepeatType(type);
                                    setRepeatConfig(config);
                                }}
                            />
                        </View>

                        {/* Notify Before Picker */}
                        <View className="mb-4">
                            <Text className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">Notify Before</Text>
                            <NotifyBeforePicker
                                value={preNotifyOffsets}
                                onChange={setPreNotifyOffsets}
                            />
                        </View>

                        {/* Snooze Picker */}
                        <View className="mb-4">
                            <Text className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">Snooze</Text>
                            <SnoozePicker
                                enabled={snoozeEnabled}
                                duration={snoozeDuration}
                                onChange={(enabled, duration) => {
                                    setSnoozeEnabled(enabled);
                                    setSnoozeDuration(duration);
                                }}
                            />
                        </View>

                        <View className="gap-4 pb-4" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
                            <View className="flex-row items-center justify-between">
                                <TouchableOpacity
                                    onPress={handleDatePress}
                                    className={cn(
                                        "flex-row items-center gap-2 px-4 py-2.5 rounded-full",
                                        "bg-zinc-100 dark:bg-zinc-800",
                                        dueDate ? "bg-zinc-900 dark:bg-zinc-100" : ""
                                    )}
                                >
                                    <Calendar size={18} className={dueDate ? "text-white dark:text-black" : "text-zinc-500 dark:text-zinc-400"} pointerEvents="none" />
                                    <Text className={cn(
                                        "text-sm font-medium",
                                        dueDate ? "text-white dark:text-black" : "text-zinc-600 dark:text-zinc-300"
                                    )}>
                                        {dueDate ? dueDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Pick Date"}
                                    </Text>
                                </TouchableOpacity>

                                <View className="flex-row gap-2">
                                    {/* Phase 2: AI Assistant Button */}
                                    {title && typeof title === 'string' && title.trim() && task && (
                                        <AIAssistantButton
                                            task={{ ...task, title, description, priority }}
                                            size="large"
                                            onSaveToNotes={handleExternalNoteUpdate}
                                        />
                                    )}

                                    {/* Phase 3: Research Button */}
                                    {title && typeof title === 'string' && title.trim() && task && (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setShowResearch(true);
                                            }}
                                            className="px-4 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800"
                                        >
                                            <Text className="text-lg">🔍</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={!title || typeof title !== 'string' || !title.trim()}
                                className={cn(
                                    "w-full py-4 rounded-2xl bg-zinc-900 dark:bg-white items-center",
                                    (!title || typeof title !== 'string' || !title.trim()) && "opacity-50"
                                )}
                            >
                                <Text className="text-white dark:text-black font-bold text-lg">Save Task</Text>
                            </TouchableOpacity>
                        </View>

                        {showDatePicker && Platform.OS === 'ios' && (
                            <DateTimePicker
                                value={dueDate || new Date()}
                                mode="datetime"
                                is24Hour={true}
                                display="default"
                                onChange={handleDateChange}
                            />
                        )}
                    </ScrollView>

                    {/* Phase 3: Research Modal */}
                    {task && (
                        <AIResearchPanel
                            visible={showResearch}
                            task={{ ...task, title, description, priority }}
                            onClose={() => setShowResearch(false)}
                            onSaveToNotes={handleExternalNoteUpdate}
                        />
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
