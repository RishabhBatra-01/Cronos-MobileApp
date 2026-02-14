import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { scheduleTaskNotification } from '../core/notifications/NotificationManager';
import { useFeatureFlagStore } from '../core/store/useFeatureFlagStore'; // Phase 4: Voice Enhancement
import { useProStore } from '../core/store/useProStore';
import { useTaskStore } from '../core/store/useTaskStore';
import { SubTaskSuggestion } from '../hooks/use-sub-task-suggestions'; // Phase 4: Voice Enhancement
import { useVoiceInput } from '../hooks/use-voice-input';
import { supabase } from '../lib/supabase';
import { ParsedTaskData } from '../services/OpenAIService';
import { syncAll } from '../services/SyncService';
import { AISubTaskSuggestions } from './AISubTaskSuggestions'; // Phase 4: Voice Enhancement
import { PaywallModal } from './PaywallModal';
import { PremiumMicButton } from './PremiumMicButton';
import { TaskReviewModal } from './TaskReviewModal';

export function VoiceInputButton() {
    const { state, startRecording, stopRecordingAndProcess } = useVoiceInput();
    const { addTask } = useTaskStore();
    const { isPro } = useProStore();
    const [showPaywall, setShowPaywall] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [pendingTasks, setPendingTasks] = useState<ParsedTaskData[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false); // Phase 4: Voice Enhancement
    const [currentTaskForSuggestions, setCurrentTaskForSuggestions] = useState<any>(null); // Phase 4: Voice Enhancement
    const scale = useSharedValue(1);

    // Pulsing animation when recording
    useEffect(() => {
        if (state.isRecording) {
            scale.value = withRepeat(
                withSequence(
                    withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                false
            );
        } else {
            scale.value = withTiming(1, { duration: 200 });
        }
    }, [state.isRecording]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const handlePress = async () => {
        // Prevent multiple rapid taps
        if (state.isProcessing) {
            console.log('[VoiceInputButton] Already processing, ignoring tap');
            return;
        }

        if (state.isRecording) {
            // Stop recording - Immediate feedback for stopping is good
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            console.log('[VoiceInputButton] Stopping recording...');

            try {
                const tasksData = await stopRecordingAndProcess();

                if (tasksData && tasksData.tasks.length > 0) {
                    console.log('[VoiceInputButton] ✅ SUCCESS: Received tasks from voice input');
                    console.log(`[VoiceInputButton] Task count: ${tasksData.tasks.length}`);
                    tasksData.tasks.forEach((task, i) => {
                        console.log(`[VoiceInputButton] Task ${i + 1}:`, JSON.stringify(task));
                    });

                    // NEW: Show review modal instead of creating tasks immediately
                    setPendingTasks(tasksData.tasks);
                    setShowReviewModal(true);

                    // Success haptic for successful voice processing
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } else {
                    // Show error to user when processing fails
                    console.error('[VoiceInputButton] ❌ FAILED: No tasks received from voice input');
                    console.error('[VoiceInputButton] Full response:', JSON.stringify(tasksData));

                    // Better error message based on what happened
                    let errorMessage = 'Could not process your voice input.';

                    if (tasksData && tasksData.tasks && tasksData.tasks.length === 0) {
                        // Transcription worked but no tasks parsed
                        errorMessage = 'Could not understand your command. Please try saying something like "Buy milk tomorrow at 3pm" or "Call mom on Monday".';
                    } else {
                        // Complete failure (null tasksData)
                        errorMessage = 'Could not process your voice input. Please check your internet connection and try again.';
                    }

                    Alert.alert(
                        'Processing Failed',
                        errorMessage,
                        [{ text: 'OK', style: 'default' }]
                    );
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                }
            } catch (processingError: any) {
                // ✅ Catch and show any errors from processing
                console.error('[VoiceInputButton] Processing error:', processingError);
                console.error('[VoiceInputButton] Error message:', processingError.message);
                console.error('[VoiceInputButton] Error stack:', processingError.stack);

                Alert.alert(
                    'Processing Error',
                    processingError.message || 'An error occurred while processing your voice input. Please try again.',
                    [{ text: 'OK', style: 'default' }]
                );
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
        } else {
            // Check if user is Pro before starting recording
            if (!isPro) {
                console.log('[VoiceInputButton] User is not Pro, showing paywall');
                setShowPaywall(true);
                return;
            }

            // Start recording
            console.log('[VoiceInputButton] Starting recording...');
            const started = await startRecording();

            if (!started) {
                console.log('[VoiceInputButton] Failed to start recording');
                // Haptic feedback for failure
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            } else {
                // ✅ Success! Recording actually started consistently
                // NOW we tell the user to speak
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
        }
    };

    const handleSaveTasks = async (tasks: ParsedTaskData[]) => {
        console.log(`[VoiceInputButton] Saving ${tasks.length} task(s)`);

        // Create all tasks
        const createdTaskIds: string[] = [];
        for (const taskData of tasks) {
            console.log('[VoiceInputButton] Creating task:', taskData);

            // Create task locally with all phase features
            const taskId = addTask(
                taskData.title,
                taskData.dueDate,
                taskData.priority || 'medium',
                taskData.description, // Description
                taskData.repeatType || 'NONE', // Phase 2: Repeat
                taskData.repeatConfig || null, // Phase 2: Repeat config
                taskData.preNotifyOffsets || [], // Phase 3: Notify before
                false, // Phase 4: Snooze enabled (not used in simplified version)
                undefined // Phase 4: Snooze duration (not used in simplified version)
            );
            createdTaskIds.push(taskId);
            console.log('[VoiceInputButton] Task created with ID:', taskId, 'Features:', {
                priority: taskData.priority || 'medium',
                description: taskData.description || 'none',
                isActive: taskData.isActive ?? true,
                repeatType: taskData.repeatType || 'NONE',
                preNotifyOffsets: taskData.preNotifyOffsets || []
            });

            // Schedule notification if due date exists and task is active
            if (taskData.dueDate && (taskData.isActive ?? true)) {
                const dueDate = new Date(taskData.dueDate);
                const now = new Date();

                if (dueDate > now) {
                    console.log('[VoiceInputButton] Scheduling notification');
                    await scheduleTaskNotification({
                        id: taskId,
                        title: taskData.title,
                        dueDate: taskData.dueDate,
                        status: 'pending',
                        createdAt: new Date().toISOString(),
                        isActive: taskData.isActive ?? true, // Phase 1
                        repeatType: taskData.repeatType || 'NONE', // Phase 2
                        repeatConfig: taskData.repeatConfig || null, // Phase 2
                        preNotifyOffsets: taskData.preNotifyOffsets || [], // Phase 3
                    });
                }
            }
        }

        // Sync to Supabase
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                console.log('[VoiceInputButton] Syncing to Supabase...');
                await syncAll(session.user.id);
            }
        } catch (error) {
            console.error('[VoiceInputButton] Sync error:', error);
        }

        // Close modal and clear pending tasks
        setShowReviewModal(false);
        setPendingTasks([]);

        // Phase 4: Check if voice enhancement is enabled and show suggestions
        const { isFeatureEnabled } = useFeatureFlagStore.getState();
        if (isFeatureEnabled('aiVoiceEnhancement') && tasks.length === 1 && createdTaskIds.length === 1) {
            // Only show suggestions for single task creation
            const createdTask = useTaskStore.getState().tasks.find(
                t => t.id === createdTaskIds[0]
            );

            if (createdTask) {
                console.log('[VoiceInputButton] Triggering sub-task suggestions for:', createdTask.title);
                setCurrentTaskForSuggestions(createdTask);
                setShowSuggestions(true);
                return; // Don't show success message yet, wait for suggestions
            }
        }

        // Success haptic
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Show success message with count
        if (tasks.length > 1) {
            Alert.alert('Success', `Created ${tasks.length} tasks!`);
        }
    };

    const handleDiscardTasks = () => {
        console.log('[VoiceInputButton] Tasks discarded');
        setShowReviewModal(false);
        setPendingTasks([]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    };

    // Phase 4: Handle adding sub-task suggestions
    const handleAddSuggestions = async (suggestions: SubTaskSuggestion[]) => {
        console.log(`[VoiceInputButton] Adding ${suggestions.length} sub-task(s)`);

        for (const suggestion of suggestions) {
            // Ensure description is a string (AI might return object)
            const description = typeof suggestion.description === 'string'
                ? suggestion.description
                : suggestion.description
                    ? JSON.stringify(suggestion.description)
                    : undefined;

            // Create sub-task
            const taskId = addTask(
                suggestion.title,
                suggestion.dueDate,
                suggestion.priority || 'medium',
                description
            );

            // Schedule notification if needed
            if (suggestion.dueDate) {
                const dueDate = new Date(suggestion.dueDate);
                if (dueDate > new Date()) {
                    await scheduleTaskNotification({
                        id: taskId,
                        title: suggestion.title,
                        dueDate: suggestion.dueDate,
                        status: 'pending',
                        createdAt: new Date().toISOString(),
                        isActive: true,
                    });
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
            console.error('[VoiceInputButton] Sync error:', error);
        }

        // Close modal
        setShowSuggestions(false);
        setCurrentTaskForSuggestions(null);

        // Success feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', `Added ${suggestions.length} sub-task(s)!`);
    };

    // Phase 4: Handle skipping sub-task suggestions
    const handleSkipSuggestions = () => {
        console.log('[VoiceInputButton] Skipped sub-task suggestions');
        setShowSuggestions(false);
        setCurrentTaskForSuggestions(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    return (
        <>
            <View style={{ zIndex: 10 }}>
                <PremiumMicButton
                    isRecording={state.isRecording}
                    isLoading={state.isProcessing}
                    onPress={handlePress}
                />

                {/* Status indicator with better positioning */}
                {(state.isRecording || state.isProcessing) && (
                    <View
                        className="absolute top-full mt-4 bg-zinc-900 dark:bg-zinc-100 px-4 py-2 rounded-full shadow-lg"
                        style={{
                            alignSelf: 'center', // Center horizontally relative to parent
                            elevation: 4,
                            minWidth: 120,
                            alignItems: 'center'
                        }}
                    >
                        <Text className="text-white dark:text-black text-xs font-semibold">
                            {state.isRecording
                                ? `🎙️ ${state.recordingDuration}s`
                                : '✨ Analyzing...'}
                        </Text>
                    </View>
                )}
            </View>

            <PaywallModal
                visible={showPaywall}
                onClose={() => setShowPaywall(false)}
            />

            <TaskReviewModal
                visible={showReviewModal}
                tasks={pendingTasks}
                onSave={handleSaveTasks}
                onDiscard={handleDiscardTasks}
            />

            {/* Phase 4: Sub-task suggestions modal */}
            {currentTaskForSuggestions && (
                <AISubTaskSuggestions
                    visible={showSuggestions}
                    parentTask={currentTaskForSuggestions}
                    onAdd={handleAddSuggestions}
                    onSkip={handleSkipSuggestions}
                />
            )}
        </>
    );
}
