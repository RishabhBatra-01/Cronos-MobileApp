import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { ParsedTasksResponse, processVoiceInput } from '../services/OpenAIService';

// Maximum recording duration in milliseconds (30 seconds - shorter to avoid timeout issues)
const MAX_RECORDING_DURATION = 30000;

export interface VoiceInputState {
    isRecording: boolean;
    isProcessing: boolean;
    error: string | null;
    recordingDuration: number; // in seconds
}

export function useVoiceInput() {
    const [state, setState] = useState<VoiceInputState>({
        isRecording: false,
        isProcessing: false,
        error: null,
        recordingDuration: 0,
    });

    const recordingRef = useRef<Audio.Recording | null>(null);
    const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const recordingStartTimeRef = useRef<number>(0);
    const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /**
     * Request audio recording permissions
     */
    const requestPermissions = async (): Promise<boolean> => {
        try {
            console.log('[VoiceInput] Requesting audio permissions...');
            const { status } = await Audio.requestPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please enable microphone access in Settings to use voice input.'
                );
                return false;
            }

            console.log('[VoiceInput] Audio permissions granted');
            return true;
        } catch (error) {
            console.error('[VoiceInput] Permission error:', error);
            return false;
        }
    };

    /**
     * Start recording audio
     */
    const startRecording = async (): Promise<boolean> => {
        try {
            console.log('[VoiceInput] Starting recording...');

            // Request permissions
            const hasPermission = await requestPermissions();
            if (!hasPermission) {
                return false;
            }

            // Reset audio mode first to ensure clean state
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: false,
                });
            } catch (resetError) {
                console.warn('[VoiceInput] Audio mode reset warning:', resetError);
            }

            // Configure audio mode for recording
            // Use same simple config as iOS - it works perfectly there
            console.log('[VoiceInput] Configuring audio mode for recording...');
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                // Android: Request audio focus (duck others) to ensure we get clean input
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
            });
            console.log('[VoiceInput] Audio mode configured successfully');

            console.log('[VoiceInput] Creating recording with platform-specific settings...');
            console.log('[VoiceInput] Sample rate: 44100 Hz');
            console.log('[VoiceInput] Bit rate: 128000 bps');

            // Use platform-specific recording options for optimal voice recognition
            // iOS: HIGH quality AAC encoding
            // Android: Standard AAC encoding (let system handle mic source selection)
            const recording = new Audio.Recording();
            await recording.prepareToRecordAsync({
                android: {
                    extension: '.m4a',
                    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
                    audioEncoder: Audio.AndroidAudioEncoder.AAC,
                    sampleRate: 44100,
                    numberOfChannels: 1,
                    bitRate: 128000,
                    // Note: Removed audioSource:6 - this undocumented property
                    // was causing issues on some Android devices. Let Expo AV
                    // handle microphone source selection automatically.
                },
                ios: {
                    extension: '.m4a',
                    audioQuality: Audio.IOSAudioQuality.HIGH,
                    sampleRate: 44100,
                    numberOfChannels: 1,
                    bitRate: 128000,
                    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
                },
                web: {},
            });
            console.log('[VoiceInput] Recording prepared with platform-specific config');

            console.log('[VoiceInput] Recording prepared, starting...');
            await recording.startAsync();
            console.log('[VoiceInput] Recording started successfully!');

            recordingRef.current = recording;
            recordingStartTimeRef.current = Date.now();
            console.log('[VoiceInput] Recording start time:', new Date(recordingStartTimeRef.current).toISOString());

            setState({
                isRecording: true,
                isProcessing: false,
                error: null,
                recordingDuration: 0,
            });

            // Update duration every second
            durationIntervalRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
                setState(prev => ({ ...prev, recordingDuration: elapsed }));
            }, 1000);

            // Auto-stop after max duration
            recordingTimerRef.current = setTimeout(async () => {
                console.log('[VoiceInput] Max recording duration reached, auto-stopping...');
                Alert.alert(
                    'Recording Limit',
                    'Maximum recording duration reached. Processing your input...'
                );
                await stopRecordingAndProcess();
            }, MAX_RECORDING_DURATION);

            console.log('[VoiceInput] Recording started successfully');
            return true;
        } catch (error: any) {
            console.error('[VoiceInput] Start recording error:', error);

            // Clean up on error
            recordingRef.current = null;
            if (recordingTimerRef.current) {
                clearTimeout(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
                durationIntervalRef.current = null;
            }

            setState({
                isRecording: false,
                isProcessing: false,
                error: error.message,
                recordingDuration: 0,
            });

            Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
            return false;
        }
    };

    /**
     * Stop recording and process the audio
     */
    const stopRecordingAndProcess = async (): Promise<ParsedTasksResponse | null> => {
        try {
            console.log('[VoiceInput] Stopping recording...');

            // Clear timers
            if (recordingTimerRef.current) {
                clearTimeout(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
                durationIntervalRef.current = null;
            }

            if (!recordingRef.current) {
                throw new Error('No active recording');
            }

            // ✅ CHECK: Minimum recording duration (prevent accidental taps)
            const recordingDuration = Date.now() - recordingStartTimeRef.current;
            const minDuration = 500; // Reduced to 500ms to catch short commands

            console.log('[VoiceInput] ========================================');
            console.log('[VoiceInput] RECORDING STOPPED');
            console.log('[VoiceInput] ========================================');
            console.log('[VoiceInput] Recording duration:', recordingDuration, 'ms');
            console.log('[VoiceInput] Minimum required:', minDuration, 'ms');
            console.log('[VoiceInput] Duration check:', recordingDuration >= minDuration ? 'PASS ✅' : 'FAIL ❌');
            console.log('[VoiceInput] ========================================');

            if (recordingDuration < minDuration) {
                console.error('[VoiceInput] ❌ Recording too short!');
                console.error('[VoiceInput] You need to hold the button for at least 0.5 seconds');
                console.error('[VoiceInput] Actual duration:', recordingDuration, 'ms');

                // Stop and clean up
                await recordingRef.current.stopAndUnloadAsync();
                const uri = recordingRef.current.getURI();
                if (uri) {
                    await FileSystem.deleteAsync(uri);
                }
                recordingRef.current = null;

                // Reset audio mode
                try {
                    await Audio.setAudioModeAsync({
                        allowsRecordingIOS: false,
                        playsInSilentModeIOS: false,
                    });
                } catch (resetError) {
                    console.warn('[VoiceInput] Audio mode reset warning:', resetError);
                }

                // Reset state
                setState({
                    isRecording: false,
                    isProcessing: false,
                    error: null,
                    recordingDuration: 0,
                });

                Alert.alert(
                    'Recording Too Short',
                    'Please hold the button longer and speak your command clearly. Recording should be at least 1 second.\n\nTry this:\n1. Tap and hold the button\n2. Wait 1 second\n3. Speak your command\n4. Wait 1 second\n5. Release the button'
                );

                return null;
            }

            console.log('[VoiceInput] ✅ Recording duration is sufficient, proceeding...');

            // Stop recording
            await recordingRef.current.stopAndUnloadAsync();
            const uri = recordingRef.current.getURI();
            recordingRef.current = null;

            // Reset audio mode after recording
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: false,
                });
            } catch (resetError) {
                console.warn('[VoiceInput] Audio mode reset warning:', resetError);
            }

            if (!uri) {
                throw new Error('No recording URI');
            }

            console.log('[VoiceInput] Recording stopped, URI:', uri);

            // Check file size (optional warning)
            try {
                const fileInfo = await FileSystem.getInfoAsync(uri);
                if (fileInfo.exists && fileInfo.size) {
                    const sizeMB = fileInfo.size / (1024 * 1024);
                    console.log(`[VoiceInput] Audio file size: ${sizeMB.toFixed(2)} MB`);

                    if (sizeMB > 10) {
                        console.warn('[VoiceInput] Large audio file detected, may take longer to process');
                    }
                }
            } catch (sizeError) {
                console.warn('[VoiceInput] Could not check file size:', sizeError);
            }

            // Update state to processing
            setState({
                isRecording: false,
                isProcessing: true,
                error: null,
                recordingDuration: 0,
            });

            // Process the audio with OpenAI
            console.log('[VoiceInput] Processing audio with OpenAI...');
            const taskData = await processVoiceInput(uri);

            // Clean up the audio file
            try {
                await FileSystem.deleteAsync(uri);
                console.log('[VoiceInput] Audio file cleaned up');
            } catch (cleanupError) {
                console.warn('[VoiceInput] Failed to clean up audio file:', cleanupError);
            }

            // Reset state
            setState({
                isRecording: false,
                isProcessing: false,
                error: null,
                recordingDuration: 0,
            });

            console.log('[VoiceInput] Processing complete:', taskData);
            return taskData;
        } catch (error: any) {
            console.error('[VoiceInput] Stop and process error:', error);

            // Clear timers on error
            if (recordingTimerRef.current) {
                clearTimeout(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
                durationIntervalRef.current = null;
            }

            // Reset audio mode on error
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: false,
                });
            } catch (resetError) {
                console.warn('[VoiceInput] Audio mode reset warning:', resetError);
            }

            setState({
                isRecording: false,
                isProcessing: false,
                error: error.message,
                recordingDuration: 0,
            });

            Alert.alert(
                'Processing Error',
                error.message || 'Failed to process voice input. Please try again.'
            );

            return null;
        }
    };

    /**
     * Cancel recording without processing
     */
    const cancelRecording = async () => {
        try {
            // Clear timers
            if (recordingTimerRef.current) {
                clearTimeout(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
                durationIntervalRef.current = null;
            }

            if (recordingRef.current) {
                console.log('[VoiceInput] Cancelling recording...');
                await recordingRef.current.stopAndUnloadAsync();

                const uri = recordingRef.current.getURI();
                if (uri) {
                    await FileSystem.deleteAsync(uri);
                }

                recordingRef.current = null;
            }

            // Reset audio mode
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: false,
                });
            } catch (resetError) {
                console.warn('[VoiceInput] Audio mode reset warning:', resetError);
            }

            setState({
                isRecording: false,
                isProcessing: false,
                error: null,
                recordingDuration: 0,
            });

            console.log('[VoiceInput] Recording cancelled');
        } catch (error) {
            console.error('[VoiceInput] Cancel error:', error);

            // Ensure state is reset even on error
            setState({
                isRecording: false,
                isProcessing: false,
                error: null,
                recordingDuration: 0,
            });
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) {
                clearTimeout(recordingTimerRef.current);
            }
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
        };
    }, []);

    return {
        state,
        startRecording,
        stopRecordingAndProcess,
        cancelRecording,
    };
}
