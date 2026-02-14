import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutDown } from 'react-native-reanimated';
import { cn } from '../lib/utils';
import { ParsedTaskData } from '../services/OpenAIService';
import { TaskReviewCard } from './TaskReviewCard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TaskReviewModalProps {
    visible: boolean;
    tasks: ParsedTaskData[];
    onSave: (tasks: ParsedTaskData[]) => void;
    onDiscard: () => void;
}

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function TaskReviewModal({ visible, tasks, onSave, onDiscard }: TaskReviewModalProps) {
    const insets = useSafeAreaInsets();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [editedTasks, setEditedTasks] = useState<ParsedTaskData[]>(tasks);

    // Reset state when modal opens with new tasks
    const prevVisibleRef = useRef(visible);
    if (visible && !prevVisibleRef.current) {
        setCurrentIndex(0);
        setEditedTasks(tasks);
    }
    prevVisibleRef.current = visible;

    const currentTask = editedTasks[currentIndex];
    const isLastTask = currentIndex === editedTasks.length - 1;
    const isFirstTask = currentIndex === 0;
    const hasMultipleTasks = editedTasks.length > 1;

    const handleTaskChange = (updatedTask: ParsedTaskData) => {
        const newTasks = [...editedTasks];
        newTasks[currentIndex] = updatedTask;
        setEditedTasks(newTasks);
    };

    const handleNext = () => {
        if (!isLastTask) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (!isFirstTask) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleDiscard = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

        if (hasMultipleTasks) {
            Alert.alert(
                'Discard Task',
                'Are you sure you want to discard this task?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: () => {
                            const newTasks = editedTasks.filter((_, index) => index !== currentIndex);
                            if (newTasks.length === 0) {
                                onDiscard();
                            } else {
                                setEditedTasks(newTasks);
                                if (currentIndex >= newTasks.length) {
                                    setCurrentIndex(newTasks.length - 1);
                                }
                            }
                        },
                    },
                ]
            );
        } else {
            Alert.alert(
                'Discard Task',
                'Are you sure you want to discard this task?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: onDiscard,
                    },
                ]
            );
        }
    };

    const handleSave = () => {
        if (!currentTask.title.trim()) {
            Alert.alert('Error', 'Task title is required');
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        if (hasMultipleTasks && !isLastTask) {
            handleNext();
        } else {
            const validTasks = editedTasks.filter(task => task.title.trim());
            onSave(validTasks);
        }
    };

    const handleSaveAll = () => {
        const validTasks = editedTasks.filter(task => task.title.trim());

        if (validTasks.length === 0) {
            Alert.alert('Error', 'At least one task must have a title');
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSave(validTasks);
    };

    if (!visible || !currentTask) return null;

    return (
        <Modal
            visible={visible}
            animationType="none"
            transparent={true}
            onRequestClose={onDiscard}
        >
            <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                className="flex-1 bg-black/50"
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 justify-end"
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={onDiscard}
                        className="flex-1"
                    />

                    <Animated.View
                        entering={SlideInUp.duration(300).springify()}
                        exiting={SlideOutDown.duration(250)}
                        style={{ maxHeight: SCREEN_HEIGHT * 0.92 }}
                        className="bg-white dark:bg-zinc-900 rounded-t-3xl border-t border-zinc-200 dark:border-zinc-800"
                    >
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            bounces={false}
                        >
                            {/* Header */}
                            <View className="px-6 pt-6 pb-4 border-b border-primary/20">
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-1 pr-4">
                                        <Text className="text-2xl font-bold text-zinc-900 dark:text-white">
                                            ✨ Review Your Task{hasMultipleTasks ? 's' : ''}
                                        </Text>
                                        {hasMultipleTasks && (
                                            <Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                                Review and edit each task before saving
                                            </Text>
                                        )}
                                    </View>
                                    <TouchableOpacity
                                        onPress={onDiscard}
                                        className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full"
                                    >
                                        <X size={20} className="text-zinc-500 dark:text-zinc-400" pointerEvents="none" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Task Content */}
                            <TaskReviewCard
                                task={currentTask}
                                taskNumber={hasMultipleTasks ? currentIndex + 1 : undefined}
                                totalTasks={hasMultipleTasks ? editedTasks.length : undefined}
                                onChange={handleTaskChange}
                            />

                            {/* Navigation for multiple tasks */}
                            {hasMultipleTasks && (
                                <View className="px-6 py-4 border-t border-primary/20">
                                    <View className="flex-row items-center justify-center gap-4">
                                        <TouchableOpacity
                                            onPress={handlePrevious}
                                            disabled={isFirstTask}
                                            className={cn(
                                                "flex-row items-center gap-2 px-4 py-2 rounded-full",
                                                isFirstTask
                                                    ? "opacity-30"
                                                    : "bg-zinc-100 dark:bg-zinc-800"
                                            )}
                                        >
                                            <ChevronLeft size={18} className="text-zinc-600 dark:text-zinc-400" pointerEvents="none" />
                                            <Text className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                                Previous
                                            </Text>
                                        </TouchableOpacity>

                                        <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                                            {currentIndex + 1} / {editedTasks.length}
                                        </Text>

                                        <TouchableOpacity
                                            onPress={handleNext}
                                            disabled={isLastTask}
                                            className={cn(
                                                "flex-row items-center gap-2 px-4 py-2 rounded-full",
                                                isLastTask
                                                    ? "opacity-30"
                                                    : "bg-zinc-100 dark:bg-zinc-800"
                                            )}
                                        >
                                            <Text className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                                Next
                                            </Text>
                                            <ChevronRight size={18} className="text-zinc-600 dark:text-zinc-400" pointerEvents="none" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {/* Action Buttons */}
                            <View className="px-6 py-6 border-t border-primary/20" style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
                                <View className="flex-row items-center gap-3">
                                    <TouchableOpacity
                                        onPress={handleDiscard}
                                        className="flex-1 py-4 rounded-2xl border-2 border-red-500 bg-transparent"
                                    >
                                        <Text className="text-center text-base font-semibold text-red-500">
                                            Discard
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={hasMultipleTasks && !isLastTask ? handleSave : handleSaveAll}
                                        disabled={!currentTask.title.trim()}
                                        className={cn(
                                            "flex-1 py-4 rounded-2xl bg-primary",
                                            !currentTask.title.trim() && "opacity-50"
                                        )}
                                    >
                                        <Text className="text-center text-base font-semibold text-white">
                                            {hasMultipleTasks && !isLastTask ? 'Next' : 'Save Task'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {hasMultipleTasks && (
                                    <TouchableOpacity
                                        onPress={handleSaveAll}
                                        className="mt-3 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800"
                                    >
                                        <Text className="text-center text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                            Save All Tasks ({editedTasks.filter(t => t.title.trim()).length})
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </ScrollView>
                    </Animated.View>
                </KeyboardAvoidingView>
            </Animated.View>
        </Modal>
    );
}
