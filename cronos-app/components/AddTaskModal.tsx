import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Calendar, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { scheduleTaskNotification } from '../core/notifications/NotificationManager';
import { RepeatConfig, RepeatType, TaskPriority, useTaskStore } from '../core/store/useTaskStore';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { syncAll } from '../services/SyncService';
import { AIAssistantButton } from './AIAssistantButton'; // Phase 2: AI Assistant
import { NotifyBeforePicker } from './NotifyBeforePicker';
import { PriorityPicker } from './PriorityPicker';
import { RepeatPicker } from './RepeatPicker';
import { SnoozePicker } from './SnoozePicker';

interface AddTaskModalProps {
    visible: boolean;
    onClose: () => void;
}

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function AddTaskModal({ visible, onClose }: AddTaskModalProps) {
    const insets = useSafeAreaInsets();
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [description, setDescription] = useState('');
    const [repeatType, setRepeatType] = useState<RepeatType>('NONE');
    const [repeatConfig, setRepeatConfig] = useState<RepeatConfig>(null);
    const [preNotifyOffsets, setPreNotifyOffsets] = useState<string[]>([]);
    const [snoozeEnabled, setSnoozeEnabled] = useState(false);
    const [snoozeDuration, setSnoozeDuration] = useState<string | undefined>('PT10M');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const { addTask } = useTaskStore();

    useEffect(() => {
        if (visible && inputRef.current) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    const handleSubmit = async () => {
        if (!title || typeof title !== 'string' || !title.trim()) return;

        let finalDate = dueDate;
        const now = new Date();

        console.log('[AddTaskModal] Creating task with title:', title.trim());

        const isoDate = finalDate ? finalDate.toISOString() : undefined;

        // 1. Create task locally first with all configuration
        const taskId = addTask(
            title.trim(),
            isoDate,
            priority,
            description.trim() || undefined,
            repeatType,
            repeatConfig,
            preNotifyOffsets,
            snoozeEnabled,
            snoozeDuration
        );
        console.log('[AddTaskModal] Task created with ID:', taskId, 'Priority:', priority, 'Repeat:', repeatType, 'Pre-notify:', preNotifyOffsets.length, 'Snooze:', snoozeEnabled);

        // 2. Schedule notification immediately on THIS device
        // This ensures the creating device has the notification
        if (isoDate && finalDate && finalDate > now) {
            console.log('[AddTaskModal] Scheduling notification on creating device');
            console.log('[AddTaskModal] Pre-notify offsets:', preNotifyOffsets);
            await scheduleTaskNotification({
                id: taskId,
                title: title.trim(),
                dueDate: isoDate,
                status: 'pending',
                createdAt: new Date().toISOString(),
                isActive: true,
                preNotifyOffsets: preNotifyOffsets  // CRITICAL: Include pre-notify offsets!
            });
        }

        // 3. Sync to Supabase (this will trigger other devices via Realtime)
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                console.log('[AddTaskModal] Syncing to Supabase...');
                await syncAll(session.user.id);
            }
        } catch (error) {
            console.error('[AddTaskModal] Sync error:', error);
        }

        setTitle('');
        setDueDate(new Date());
        setPriority('medium');
        setDescription('');
        setRepeatType('NONE');
        setRepeatConfig(null);
        setPreNotifyOffsets([]);
        setSnoozeEnabled(false);
        setSnoozeDuration('PT10M');
        onClose();
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        // Only relevant for iOS component usage
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

            console.log('[AddTaskModal] Opening Android Date Picker');
            // 1. Pick Date
            DateTimePickerAndroid.open({
                value: currentDate,
                onChange: (event, date) => {
                    console.log('[AddTaskModal] Date Picker Event:', event.type, date);
                    if (event.type === 'set' && date) {
                        // 2. If date picked, delay slightly then Pick Time
                        // The delay helps ensure the first dialog is fully dismissed
                        setTimeout(() => {
                            console.log('[AddTaskModal] Opening Android Time Picker');
                            DateTimePickerAndroid.open({
                                value: date, // Use the date we just picked
                                onChange: (event, time) => {
                                    console.log('[AddTaskModal] Time Picker Event:', event.type, time);
                                    if (event.type === 'set' && time) {
                                        // Combine date from first step and time from second step
                                        const finalDate = new Date(date);
                                        finalDate.setHours(time.getHours());
                                        finalDate.setMinutes(time.getMinutes());
                                        console.log('[AddTaskModal] Final Date Set:', finalDate);
                                        setDueDate(finalDate);
                                    }
                                },
                                mode: 'time',
                                is24Hour: false,
                            });
                        }, 100);
                    }
                },
                mode: 'date',
            });
        } else {
            setShowDatePicker(true);
        }
    };

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
                            <Text className="text-xl font-bold text-zinc-900 dark:text-white">New Task</Text>
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
                            <Text className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">Notes (optional)</Text>
                            <TextInput
                                placeholder="Add details, shopping list, meeting notes..."
                                placeholderTextColor="#a1a1aa"
                                className="text-sm text-zinc-900 dark:text-white p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 min-h-[80px]"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
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
                                        dueDate && "bg-zinc-900 dark:bg-zinc-100"
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

                                {/* Phase 2: AI Assistant Button */}
                                {title && typeof title === 'string' && title.trim() && (
                                    <AIAssistantButton
                                        task={{ title, description, priority }}
                                        size="large"
                                    />
                                )}
                            </View>

                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={!title || typeof title !== 'string' || !title.trim()}
                                className={cn(
                                    "w-full py-4 rounded-2xl bg-primary items-center",
                                    (!title || typeof title !== 'string' || !title.trim()) && "opacity-50"
                                )}
                            >
                                <Text className="text-white font-bold text-lg">Create Task</Text>
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
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
