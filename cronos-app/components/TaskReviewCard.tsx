import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Calendar, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { RepeatConfig, RepeatType, TaskPriority } from '../core/store/useTaskStore';
import { cn } from '../lib/utils';
import { ParsedTaskData } from '../services/OpenAIService';
import { NotifyBeforePicker } from './NotifyBeforePicker';
import { PriorityPicker } from './PriorityPicker';
import { RepeatPicker } from './RepeatPicker';

interface TaskReviewCardProps {
    task: ParsedTaskData;
    taskNumber?: number;
    totalTasks?: number;
    onChange: (task: ParsedTaskData) => void;
}

export function TaskReviewCard({ task, taskNumber, totalTasks, onChange }: TaskReviewCardProps) {
    const [title, setTitle] = useState(task.title);
    const [priority, setPriority] = useState<TaskPriority>(task.priority || 'medium');
    const [dueDate, setDueDate] = useState<Date | undefined>(
        task.dueDate ? new Date(task.dueDate) : undefined
    );
    const [description, setDescription] = useState(task.description || '');
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Phase 2: Repeat
    const [repeatType, setRepeatType] = useState<RepeatType>(task.repeatType as RepeatType || 'NONE');
    const [repeatConfig, setRepeatConfig] = useState<RepeatConfig>(task.repeatConfig || null);

    // Phase 3: Notify Before
    const [preNotifyOffsets, setPreNotifyOffsets] = useState<string[]>(task.preNotifyOffsets || []);

    // Track if we're initializing to prevent calling onChange during mount
    const isInitializing = useRef(true);
    const taskIdRef = useRef(task.title); // Use title as stable ID

    // Sync state with task prop when task changes (navigation between tasks)
    useEffect(() => {
        // Only update if we're viewing a different task
        if (taskIdRef.current !== task.title) {
            console.log('[TaskReviewCard] Switching to different task:', task.title);
            taskIdRef.current = task.title;
            isInitializing.current = true;

            setTitle(task.title);
            setPriority(task.priority || 'medium');
            setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
            setDescription(task.description || '');
            setRepeatType(task.repeatType as RepeatType || 'NONE');
            setRepeatConfig(task.repeatConfig || null);
            setPreNotifyOffsets(task.preNotifyOffsets || []);
        }
    }, [task.title, task.priority, task.dueDate, task.description, task.repeatType, task.repeatConfig, task.preNotifyOffsets]);

    // Update parent when any field changes (but not during initialization)
    useEffect(() => {
        // Skip the first render (initialization)
        if (isInitializing.current) {
            isInitializing.current = false;
            return;
        }

        // Only call onChange if we have a valid title
        if (!title.trim()) return;

        console.log('[TaskReviewCard] Field changed, updating parent');
        onChange({
            title: title.trim(),
            dueDate: dueDate?.toISOString(),
            priority,
            description: description.trim() || undefined,
            isActive: true, // Always active by default (toggle is on task card, not review screen)
            repeatType: repeatType as any,
            repeatConfig,
            preNotifyOffsets,
        });
    }, [title, priority, dueDate, description, repeatType, repeatConfig, preNotifyOffsets]);

    const handleDatePress = () => {
        if (Platform.OS === 'android') {
            const currentDate = dueDate || new Date();

            DateTimePickerAndroid.open({
                value: currentDate,
                onChange: (_event, date) => {
                    if (_event.type === 'set' && date) {
                        setTimeout(() => {
                            DateTimePickerAndroid.open({
                                value: date,
                                onChange: (_event, time) => {
                                    if (_event.type === 'set' && time) {
                                        const finalDate = new Date(date);
                                        finalDate.setHours(time.getHours());
                                        finalDate.setMinutes(time.getMinutes());
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

    const handleDateChange = (_event: any, selectedDate?: Date) => {
        if (Platform.OS === 'ios') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setDueDate(selectedDate);
        }
    };

    const clearDate = () => {
        setDueDate(undefined);
    };

    return (
        <View className="p-6">
            {/* Task counter for multiple tasks */}
            {taskNumber && totalTasks && totalTasks > 1 && (
                <View className="mb-6">
                    <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400 text-center">
                        Task {taskNumber} of {totalTasks}
                    </Text>
                    {/* Dot indicators */}
                    <View className="flex-row justify-center gap-2 mt-2">
                        {Array.from({ length: totalTasks }).map((_, index) => (
                            <View
                                key={index}
                                className={cn(
                                    "w-2 h-2 rounded-full",
                                    index === taskNumber - 1
                                        ? "bg-primary"
                                        : "bg-zinc-300 dark:bg-zinc-700"
                                )}
                            />
                        ))}
                    </View>
                </View>
            )}

            {/* Title */}
            <View className="mb-6">
                <Text className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                    Task Title
                </Text>
                <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="What needs to be done?"
                    placeholderTextColor="#a1a1aa"
                    className="text-lg font-medium text-zinc-900 dark:text-white p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                    autoFocus={false}
                />
                {!title.trim() && (
                    <Text className="text-xs text-red-500 mt-1">
                        Task title is required
                    </Text>
                )}
            </View>

            {/* Priority */}
            <View className="mb-6">
                <Text className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                    Priority
                </Text>
                <PriorityPicker value={priority} onChange={setPriority} />
            </View>

            {/* Date & Time */}
            <View className="mb-6">
                <Text className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                    Due Date & Time
                </Text>
                <View className="flex-row gap-2">
                    <TouchableOpacity
                        onPress={handleDatePress}
                        className="flex-1 flex-row items-center gap-2 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                    >
                        <Calendar size={18} className="text-zinc-500 dark:text-zinc-400" pointerEvents="none" />
                        <Text className="text-base text-zinc-900 dark:text-white flex-1">
                            {dueDate
                                ? dueDate.toLocaleString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })
                                : 'No date set'}
                        </Text>
                    </TouchableOpacity>
                    {dueDate && (
                        <TouchableOpacity
                            onPress={clearDate}
                            className="w-12 h-12 items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                        >
                            <X size={18} className="text-zinc-500 dark:text-zinc-400" pointerEvents="none" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Notes */}
            <View className="mb-6">
                <Text className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                    Notes (optional)
                </Text>
                <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Add details, shopping list, meeting notes..."
                    placeholderTextColor="#a1a1aa"
                    className="text-sm text-zinc-900 dark:text-white p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 min-h-[100px]"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />
            </View>

            {/* Phase 2: Repeat */}
            <View className="mb-6">
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

            {/* Phase 3: Notify Before */}
            <View className="mb-6">
                <Text className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                    Notify Before
                </Text>
                <NotifyBeforePicker
                    value={preNotifyOffsets}
                    onChange={setPreNotifyOffsets}
                />
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
        </View>
    );
}
