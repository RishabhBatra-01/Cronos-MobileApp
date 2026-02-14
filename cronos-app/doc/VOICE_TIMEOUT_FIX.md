# Voice Input Timeout Fix

## Problem
Users were experiencing timeout errors when recording voice commands:
```
Transcription failed: timeout of 30000ms exceeded
```

This occurred when:
- Recording was too long (>30 seconds)
- Network connection was slow
- Audio file was too large to upload within the timeout window

## Root Cause
1. **No recording duration limit** - Users could record indefinitely, creating large files
2. **Short API timeout** - 30 second timeout was insufficient for longer recordings
3. **No file size checks** - Large audio files took too long to upload
4. **No user feedback** - Users didn't know how long they'd been recording

## Solution Implemented

### 1. Added Maximum Recording Duration (45 seconds)
```typescript
const MAX_RECORDING_DURATION = 45000; // 45 seconds
```

**Why 45 seconds?**
- Keeps audio files manageable (<5MB typically)
- Sufficient for most voice commands
- Leaves buffer time for API processing within 60s timeout
- Prevents accidental long recordings

### 2. Auto-Stop with Warning
When max duration is reached:
- Recording automatically stops
- User sees alert: "Maximum recording duration reached. Processing your input..."
- Audio is processed immediately

### 3. Increased API Timeouts
- Whisper API timeout: 30s → 60s
- GPT-4o API timeout: 30s → 60s
- Better error message for timeouts

### 4. Recording Duration Display
- Shows elapsed time during recording: "Recording... 5s"
- Updates every second
- Helps users keep recordings concise

### 5. File Size Logging
- Logs audio file size after recording
- Warns if file is >10MB
- Helps diagnose upload issues

### 6. Proper Cleanup
- Clears all timers on stop/cancel/error
- Prevents memory leaks
- Ensures clean state transitions

## Technical Implementation

### State Management
```typescript
export interface VoiceInputState {
    isRecording: boolean;
    isProcessing: boolean;
    error: string | null;
    recordingDuration: number; // NEW: in seconds
}
```

### Timer Management
```typescript
const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
const recordingStartTimeRef = useRef<number>(0);
```

### Duration Tracking
```typescript
// Update duration every second
durationIntervalRef.current = setInterval(() => {
    const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
    setState(prev => ({ ...prev, recordingDuration: elapsed }));
}, 1000);
```

### Auto-Stop Timer
```typescript
// Auto-stop after max duration
recordingTimerRef.current = setTimeout(async () => {
    console.log('[VoiceInput] Max recording duration reached, auto-stopping...');
    Alert.alert(
        'Recording Limit',
        'Maximum recording duration reached. Processing your input...'
    );
    await stopRecordingAndProcess();
}, MAX_RECORDING_DURATION);
```

### Cleanup on Unmount
```typescript
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
```

## Files Modified

### 1. `hooks/use-voice-input.ts`
- Added `MAX_RECORDING_DURATION` constant (45s)
- Added `recordingDuration` to state
- Added timer refs for duration tracking and auto-stop
- Implemented duration counter (updates every second)
- Implemented auto-stop after max duration
- Added file size logging
- Added proper timer cleanup
- Fixed deprecated FileSystem API usage

### 2. `components/VoiceInputButton.tsx`
- Updated status display to show recording duration
- Shows "Recording... 5s" instead of just "Recording..."

### 3. `services/OpenAIService.ts`
- Increased Whisper API timeout: 30s → 60s
- Increased GPT-4o API timeout: 30s → 60s
- Improved timeout error message

## User Experience Improvements

### Before
- ❌ No indication of recording length
- ❌ Could record indefinitely
- ❌ Timeout errors with long recordings
- ❌ No guidance on recording limits
- ❌ Confusing error messages

### After
- ✅ Real-time duration display
- ✅ 45-second maximum with auto-stop
- ✅ Clear warning when limit reached
- ✅ Longer API timeouts (60s)
- ✅ Better error messages
- ✅ File size logging for debugging

## Best Practices for Users

1. **Keep it short** - Most commands should be <10 seconds
2. **Speak clearly** - Better transcription with clear speech
3. **Check connection** - Ensure stable internet for API calls
4. **Watch the timer** - Duration display helps keep recordings concise

## Testing Recommendations

1. **Short recordings** (5-10s) - Should work perfectly
2. **Medium recordings** (20-30s) - Should work with good connection
3. **Long recordings** (40-45s) - Should auto-stop and process
4. **Very long attempts** - Should be prevented by auto-stop
5. **Slow connection** - 60s timeout provides buffer

## Future Enhancements (Optional)

1. **Visual warning at 30s** - Yellow indicator before auto-stop
2. **Adjustable max duration** - User preference setting
3. **Compression** - Reduce file size before upload
4. **Streaming transcription** - Real-time processing
5. **Offline mode** - Local speech recognition fallback

## Conclusion

The timeout issue is now resolved with:
- 45-second recording limit (prevents large files)
- 60-second API timeouts (handles longer recordings)
- Real-time duration display (user awareness)
- Auto-stop with warning (prevents accidental long recordings)
- Proper cleanup (no memory leaks)

Users can now reliably use voice input without timeout errors, and they have clear feedback about recording duration.
