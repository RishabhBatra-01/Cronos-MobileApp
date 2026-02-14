# AI Voice Input Feature Documentation

**Feature Added:** January 31, 2026  
**Status:** ✅ Ready for Testing

---

## Overview

The AI Voice Input feature allows users to create tasks using natural language voice commands. Users can tap a microphone button, speak their task (e.g., "Remind me to call John in 20 minutes"), and the app automatically creates the task with the correct title and calculated due date.

---

## Architecture

### Flow Diagram

```
User Taps Mic Button
        ↓
Start Recording (expo-av)
        ↓
User Speaks Command
        ↓
User Taps Button Again
        ↓
Stop Recording
        ↓
Upload Audio to OpenAI Whisper API
        ↓
Transcribe Audio → Text
        ↓
Send Text to GPT-4o with Current Timestamp
        ↓
Parse Text → { title, dueDate }
        ↓
Create Task in Local Store
        ↓
Schedule Notification (if due date exists)
        ↓
Sync to Supabase
        ↓
Show Success Feedback
```

---

## Components & Files

### 1. **OpenAI Service** (`services/OpenAIService.ts`)

**Purpose:** Handle all OpenAI API interactions

**Functions:**

#### `transcribeAudio(audioUri: string): Promise<string>`
- Sends audio file to OpenAI Whisper API
- Returns transcribed text
- Handles audio format conversion (M4A/AAC)

#### `parseTaskFromText(text: string): Promise<ParsedTaskData>`
- Sends transcribed text to GPT-4o
- Includes current ISO timestamp for relative time calculations
- Returns structured task data: `{ title, dueDate }`
- Handles JSON parsing and validation

#### `processVoiceInput(audioUri: string): Promise<ParsedTaskData>`
- Complete pipeline: transcribe → parse
- Single function for end-to-end processing

**Key Features:**
- ✅ Current timestamp passed to GPT-4o for accurate relative time calculations
- ✅ Strict JSON-only response format
- ✅ Error handling with detailed logging
- ✅ Supports natural language like "tomorrow", "in 30 minutes", "next Monday"

---

### 2. **Voice Input Hook** (`hooks/use-voice-input.ts`)

**Purpose:** Manage audio recording lifecycle

**Hook:** `useVoiceInput()`

**State:**
```typescript
{
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
}
```

**Functions:**

#### `startRecording(): Promise<boolean>`
- Requests microphone permissions
- Configures audio mode
- Starts recording with OpenAI-compatible format (M4A/AAC)
- Returns success status

#### `stopRecordingAndProcess(): Promise<ParsedTaskData | null>`
- Stops recording
- Processes audio through OpenAI pipeline
- Cleans up audio file
- Returns parsed task data or null on error

#### `cancelRecording(): Promise<void>`
- Cancels recording without processing
- Cleans up resources

**Audio Format:**
- **iOS:** MPEG4AAC, 44.1kHz, 128kbps
- **Android:** MPEG_4/AAC, 44.1kHz, 128kbps
- **Web:** WebM, 128kbps

---

### 3. **Voice Input Button** (`components/VoiceInputButton.tsx`)

**Purpose:** UI component for voice input interaction

**Features:**
- 🎤 Microphone icon (blue) when idle
- 🔴 Recording icon (red) when recording
- ⏳ Loading spinner when processing
- 📊 Pulsing animation during recording
- 📝 Status text ("Recording..." / "Analyzing...")

**Interaction Flow:**
1. **Tap 1:** Start recording (button turns red, pulses)
2. **Speak:** User speaks their command
3. **Tap 2:** Stop recording and process
4. **Processing:** Shows "Analyzing..." with spinner
5. **Success:** Task created, haptic feedback

**Integration:**
- Automatically creates task in store
- Schedules notification if due date exists
- Syncs to Supabase
- Provides haptic feedback

---

### 4. **Home Screen Integration** (`app/index.tsx`)

**Changes:**
- Added `VoiceInputButton` import
- Updated floating action buttons layout
- Voice button positioned above the + button
- Both buttons in vertical stack

**Layout:**
```
┌─────────────────┐
│                 │
│                 │
│      Tasks      │
│                 │
│                 │
│            🎤   │  ← Voice Input (Blue)
│            ➕   │  ← Add Task (Black/White)
└─────────────────┘
```

---

## Configuration

### 1. **OpenAI API Key** (`core/constants.ts`)

```typescript
export const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY_HERE';
```

**Setup Instructions:**
1. Get API key from https://platform.openai.com/api-keys
2. Replace `'YOUR_OPENAI_API_KEY_HERE'` with your actual key
3. Keep this key secure (add to .gitignore if needed)

**Required OpenAI APIs:**
- ✅ Whisper API (audio transcription)
- ✅ GPT-4o (text parsing)

---

### 2. **Permissions** (`app.json`)

**iOS:**
```json
"infoPlist": {
  "NSMicrophoneUsageDescription": "This app needs access to your microphone to record voice commands for creating tasks."
}
```

**Android:**
```json
"permissions": [
  "android.permission.RECORD_AUDIO"
]
```

**Plugin:**
```json
[
  "expo-av",
  {
    "microphonePermission": "Allow Cronos to access your microphone for voice commands."
  }
]
```

---

## Dependencies Added

```json
{
  "expo-av": "~14.0.7",
  "axios": "^1.7.9",
  "expo-file-system": "~18.0.11"
}
```

**Installation:**
```bash
npm install expo-av axios expo-file-system
```

---

## GPT-4o System Prompt

The AI uses this prompt to parse natural language into structured task data:

```
You are a task parsing assistant. Your job is to extract task information from natural language.

CURRENT TIMESTAMP: 2026-01-31T20:00:00.000Z

Rules:
1. Extract the task title (what needs to be done)
2. Calculate the due date/time if mentioned (e.g., "in 20 minutes", "tomorrow at 3pm", "next Monday")
3. If no time is mentioned, set dueDate to null
4. Return ONLY valid JSON, no markdown, no explanation
5. Use ISO 8601 format for dates (e.g., "2026-01-31T15:30:00.000Z")
6. Calculate relative times from the CURRENT TIMESTAMP provided above

Response format (JSON only):
{
  "title": "string",
  "dueDate": "ISO string or null"
}
```

**Key Feature:** Current timestamp is dynamically injected so the AI can accurately calculate relative times like "tomorrow" or "in 30 minutes".

---

## Example Use Cases

### Example 1: Relative Time
**Voice Input:** "Remind me to call John in 20 minutes"

**Processing:**
1. Whisper transcribes: "Remind me to call John in 20 minutes"
2. GPT-4o receives current time: `2026-01-31T14:00:00.000Z`
3. GPT-4o calculates: `2026-01-31T14:20:00.000Z`
4. Returns: `{ "title": "Call John", "dueDate": "2026-01-31T14:20:00.000Z" }`

**Result:** Task created with due date 20 minutes from now

---

### Example 2: Specific Time
**Voice Input:** "Buy groceries tomorrow at 5pm"

**Processing:**
1. Whisper transcribes: "Buy groceries tomorrow at 5pm"
2. GPT-4o receives current time: `2026-01-31T14:00:00.000Z`
3. GPT-4o calculates tomorrow 5pm: `2026-02-01T17:00:00.000Z`
4. Returns: `{ "title": "Buy groceries", "dueDate": "2026-02-01T17:00:00.000Z" }`

**Result:** Task created for tomorrow at 5pm

---

### Example 3: No Time Specified
**Voice Input:** "Finish the report"

**Processing:**
1. Whisper transcribes: "Finish the report"
2. GPT-4o detects no time mentioned
3. Returns: `{ "title": "Finish the report", "dueDate": null }`

**Result:** Task created without due date

---

### Example 4: Complex Natural Language
**Voice Input:** "Schedule a meeting with the team next Monday at 10am"

**Processing:**
1. Whisper transcribes: "Schedule a meeting with the team next Monday at 10am"
2. GPT-4o calculates next Monday 10am from current timestamp
3. Returns: `{ "title": "Schedule a meeting with the team", "dueDate": "2026-02-03T10:00:00.000Z" }`

**Result:** Task created for next Monday at 10am

---

## Error Handling

### Permission Denied
```
Alert: "Permission Required"
Message: "Please enable microphone access in Settings to use voice input."
```

### Recording Failed
```
Alert: "Recording Error"
Message: "Failed to start recording. Please try again."
```

### OpenAI API Error
```
Alert: "Processing Error"
Message: "Transcription failed: [error details]"
or
Message: "Task parsing failed: [error details]"
```

### Invalid API Key
```
Alert: "Processing Error"
Message: "Task parsing failed: Incorrect API key provided"
```

---

## Testing Checklist

### Basic Functionality
- [ ] Tap microphone button → starts recording (turns red, pulses)
- [ ] Speak command → audio is captured
- [ ] Tap button again → stops recording, shows "Analyzing..."
- [ ] Task is created with correct title
- [ ] Task has correct due date (if specified)
- [ ] Notification is scheduled (if due date in future)
- [ ] Task syncs to Supabase
- [ ] Success haptic feedback

### Permission Handling
- [ ] First use → requests microphone permission
- [ ] Permission granted → recording works
- [ ] Permission denied → shows alert with instructions

### Natural Language Parsing
- [ ] "Remind me to X in Y minutes" → correct relative time
- [ ] "Do X tomorrow at Y" → correct next day time
- [ ] "X next Monday" → correct future date
- [ ] "Just do X" → no due date (null)
- [ ] Complex sentences → extracts correct title

### Error Scenarios
- [ ] No internet → shows error alert
- [ ] Invalid API key → shows error alert
- [ ] Very short recording → handles gracefully
- [ ] Background noise → transcribes best effort
- [ ] Cancel recording → cleans up properly

### Cross-Platform
- [ ] iOS: Recording works, permissions work
- [ ] Android: Recording works, permissions work
- [ ] Web: Recording works (if supported)

---

## Performance Considerations

### Audio File Size
- Typical 5-second recording: ~50KB
- Typical 30-second recording: ~300KB
- Files are automatically cleaned up after processing

### API Latency
- Whisper transcription: ~1-3 seconds
- GPT-4o parsing: ~1-2 seconds
- Total processing time: ~2-5 seconds

### Cost Estimation (OpenAI)
- Whisper: $0.006 per minute of audio
- GPT-4o: ~$0.0001 per request (minimal tokens)
- Example: 100 voice commands/day = ~$0.60/day

---

## Security Considerations

1. **API Key Storage:** 
   - Currently in `constants.ts`
   - Consider moving to environment variables for production
   - Add to `.gitignore` if needed

2. **Audio Privacy:**
   - Audio files are deleted immediately after processing
   - No audio is stored on device or server
   - Only transcribed text is sent to GPT-4o

3. **Permissions:**
   - Microphone access requested only when needed
   - User can deny and still use app normally

---

## Future Enhancements

### Potential Improvements
1. **Offline Mode:** Cache common phrases for offline parsing
2. **Multi-Language:** Support languages beyond English
3. **Voice Feedback:** Speak confirmation back to user
4. **Continuous Listening:** "Hey Cronos" wake word
5. **Edit Before Save:** Show parsed task before creating
6. **Voice Settings:** Adjust language, accent, etc.
7. **Batch Commands:** "Add three tasks: X, Y, and Z"

---

## Troubleshooting

### Issue: "Recording Error"
**Solution:** 
- Check microphone permissions in device settings
- Restart app
- Check if microphone is being used by another app

### Issue: "Processing Error: Incorrect API key"
**Solution:**
- Verify OpenAI API key in `core/constants.ts`
- Ensure key has access to Whisper and GPT-4o
- Check API key hasn't expired

### Issue: Task created with wrong time
**Solution:**
- Check device timezone settings
- Verify current timestamp is correct
- Test with absolute times (e.g., "tomorrow at 3pm")

### Issue: Poor transcription quality
**Solution:**
- Speak clearly and slowly
- Reduce background noise
- Hold device closer to mouth
- Try recording in quieter environment

---

## Code Structure Summary

```
cronos-app/
├── services/
│   └── OpenAIService.ts          # OpenAI API integration
├── hooks/
│   └── use-voice-input.ts        # Audio recording hook
├── components/
│   └── VoiceInputButton.tsx      # Voice input UI component
├── app/
│   └── index.tsx                 # Home screen (updated)
├── core/
│   └── constants.ts              # API keys (updated)
└── app.json                      # Permissions (updated)
```

---

## Summary

The AI Voice Input feature is fully integrated into the Cronos app architecture:

✅ **Audio Recording:** expo-av with OpenAI-compatible format  
✅ **Intelligence:** OpenAI Whisper + GPT-4o with current timestamp  
✅ **UI Integration:** Distinct microphone button with visual feedback  
✅ **Task Creation:** Automatic task creation with notifications  
✅ **Sync:** Full Supabase synchronization  
✅ **Permissions:** iOS and Android microphone permissions  
✅ **Error Handling:** Comprehensive error messages and logging  

**Next Steps:**
1. Add your OpenAI API key to `core/constants.ts`
2. Run `npx expo prebuild` to apply native permissions
3. Test on iOS and Android devices
4. Enjoy voice-powered task creation!

---

**Status:** ✅ Ready for Testing  
**Dependencies:** All installed  
**Configuration:** Requires OpenAI API key