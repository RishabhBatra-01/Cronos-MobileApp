import axios from 'axios';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { OPENAI_API_KEY } from '../core/constants';
import { TaskPriority } from '../core/store/useTaskStore';

const OPENAI_API_BASE = 'https://api.openai.com/v1';

// Model configuration - change this if you need to use a different model
// Note: gpt-5-mini appears to have compatibility issues. Using gpt-4o-mini (proven, stable, fast, cheap)
const CHAT_MODEL = 'gpt-4o-mini'; // Options: 'gpt-4o-mini', 'gpt-4o'

export interface ParsedTaskData {
    title: string;
    dueDate?: string; // ISO string
    priority?: TaskPriority; // Priority level
    description?: string; // Task notes/description
    // Phase 1: Active/Inactive
    isActive?: boolean; // Default: true
    // Phase 2: Repeat
    repeatType?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
    repeatConfig?: any; // Repeat configuration
    // Phase 3: Notify Before
    preNotifyOffsets?: string[]; // ISO 8601 durations (e.g., ["PT5M", "PT1H"])
}

export interface ParsedTasksResponse {
    tasks: ParsedTaskData[];
}

/**
 * Transcribe audio file to text using OpenAI Whisper API with retry logic
 */
export async function transcribeAudio(audioUri: string, retryCount = 0): Promise<string> {
    const MAX_RETRIES = 2;
    const TIMEOUT_MS = 120000; // 2 minutes - much more generous timeout

    console.log('[OpenAI] Transcribing audio:', audioUri, `(attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);

    try {
        // Deep Debugging & Robust Handling for Android
        console.log('[OpenAI] Processing audio file at:', audioUri);

        let uploadUri = audioUri;

        try {
            const fileInfo = await FileSystem.getInfoAsync(audioUri);
            console.log('[OpenAI] Input file info:', JSON.stringify(fileInfo));

            // ✅ IMPROVED: Better file validation
            if (!fileInfo.exists) {
                throw new Error(`Audio file does not exist at path: ${audioUri}`);
            }

            if (!fileInfo.size || fileInfo.size === 0) {
                throw new Error('Audio file is empty (0 bytes). Please try recording again.');
            }

            console.log('[OpenAI] File validation passed - Size:', fileInfo.size, 'bytes');

            // Copy to a stable location in DocumentDirectory to avoid cache/temp issues
            if (FileSystem.documentDirectory) {
                const targetPath = FileSystem.documentDirectory + 'upload_debug.m4a';

                // Delete if exists
                const existing = await FileSystem.getInfoAsync(targetPath);
                if (existing.exists) {
                    await FileSystem.deleteAsync(targetPath);
                }

                // Copy
                await FileSystem.copyAsync({
                    from: audioUri,
                    to: targetPath
                });

                console.log('[OpenAI] Copied audio to stable path:', targetPath);

                // Verify copy
                const copyInfo = await FileSystem.getInfoAsync(targetPath);
                console.log('[OpenAI] Copied file info:', JSON.stringify(copyInfo));

                if (copyInfo.exists && copyInfo.size && copyInfo.size > 0) {
                    uploadUri = targetPath;
                    console.log('[OpenAI] Using copied file for upload');
                } else {
                    console.warn('[OpenAI] Copy verification failed, using original URI');
                }
            }
        } catch (fsError: any) {
            console.error('[OpenAI] File system error:', fsError.message);
            // ✅ IMPROVED: Don't silently fail - throw error if file is invalid
            if (fsError.message.includes('does not exist') || fsError.message.includes('empty')) {
                throw fsError;
            }
            // Only fall back to original URI for copy failures
            console.warn('[OpenAI] File copy failed, using original URI');
        }

        // Create form data for multipart upload
        const formData = new FormData();

        // Use the URI from Expo FileSystem
        // On Android, we need to ensure proper URI format for FormData
        let fileUri = uploadUri;

        // Android needs file:// prefix for local files in FormData
        if (Platform.OS === 'android' && !uploadUri.startsWith('file://')) {
            fileUri = `file://${uploadUri}`;
        }

        console.log('[OpenAI] Final upload URI:', fileUri);

        // Use platform-specific MIME type
        // Both platforms now use M4A/AAC which is optimal for Whisper
        const mimeType = 'audio/mp4';
        const fileName = 'audio.m4a';
        console.log('[OpenAI] Using MIME type:', mimeType, 'filename:', fileName);

        // Create file object for FormData
        // React Native requires specific structure on Android
        const fileObject: any = {
            uri: fileUri,
            type: mimeType,
            name: fileName,
        };

        formData.append('file', fileObject);

        formData.append('model', 'whisper-1');
        formData.append('language', 'en');

        console.log('[OpenAI] Sending audio to Whisper API using fetch...');

        // Use fetch instead of axios - better FormData support on Android
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
            const response = await fetch(`${OPENAI_API_BASE}/audio/transcriptions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                },
                body: formData,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // ✅ IMPROVED: Better error handling with detailed logging
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[OpenAI] Whisper API error response:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });

                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { message: errorText };
                }

                throw new Error(`Whisper API error (${response.status}): ${errorData.error?.message || errorData.message || response.statusText}`);
            }

            const data = await response.json();
            const transcription = data.text;

            if (!transcription || transcription.trim().length === 0) {
                throw new Error('Transcription is empty. Please try speaking more clearly.');
            }

            // ✅ DETECT: System sounds or very short transcriptions (likely not voice)
            const trimmedTranscription = transcription.trim();
            if (trimmedTranscription.length < 5) {
                console.warn('[OpenAI] Transcription too short:', trimmedTranscription);
                console.warn('[OpenAI] This might be a system sound, not voice input');
                throw new Error('Recording appears to be too short or unclear. Please speak for at least 2-3 seconds and try again.');
            }

            // ✅ DETECT: Common system sounds that Whisper might transcribe
            const systemSounds = ['BELL', 'DING', 'BEEP', 'CLICK', 'TAP', 'BUZZ'];
            if (systemSounds.includes(trimmedTranscription.toUpperCase())) {
                console.warn('[OpenAI] Detected system sound:', trimmedTranscription);
                throw new Error('Only system sound detected. Please speak your command clearly after tapping the record button.');
            }

            console.log('[OpenAI] Transcription successful:', transcription);
            return transcription;
        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
                throw new Error('Request timed out. Please check your internet connection and try again.');
            }
            throw fetchError;
        }
    } catch (error: any) {
        console.error('[OpenAI] Transcription error:', error.response?.data || error.message);

        // More detailed error logging
        if (error.response) {
            console.error('[OpenAI] Response status:', error.response.status);
            console.error('[OpenAI] Response data:', JSON.stringify(error.response.data));
        }

        // Retry logic for timeout and network errors
        const isRetryableError =
            error.code === 'ECONNABORTED' ||
            error.message?.includes('timeout') ||
            error.message?.includes('Network Error') ||
            error.response?.status === 429 || // Rate limit
            error.response?.status >= 500; // Server errors

        if (isRetryableError && retryCount < MAX_RETRIES) {
            const delayMs = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
            console.log(`[OpenAI] Retrying in ${delayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            return transcribeAudio(audioUri, retryCount + 1);
        }

        // Better error messages for common issues
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            throw new Error('Voice processing is taking longer than expected. Please try with a shorter recording or check your internet connection.');
        }

        if (error.message?.includes('Network Error')) {
            throw new Error('Network connection issue. Please check your internet and try again.');
        }

        throw new Error(`Transcription failed: ${error.response?.data?.error?.message || error.message}`);
    }
}

/**
 * Parse natural language text into structured task data using GPT-4o-mini with retry logic
 * Supports multiple tasks in a single command
 */
export async function parseTaskFromText(text: string, retryCount = 0): Promise<ParsedTasksResponse> {
    const MAX_RETRIES = 2;
    const TIMEOUT_MS = 120000; // 2 minutes

    console.log('[OpenAI] Parsing task(s) from text:', text, `(attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);

    // Get current timestamp AND timezone for accurate relative time calculations
    const now = new Date();
    const currentTimestamp = now.toISOString();

    // Detect user's timezone dynamically
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Get timezone offset in minutes and convert to +HH:mm format
    const timezoneOffsetMinutes = -now.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(timezoneOffsetMinutes) / 60);
    const offsetMinutes = Math.abs(timezoneOffsetMinutes) % 60;
    const offsetSign = timezoneOffsetMinutes >= 0 ? '+' : '-';
    const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;

    // Get user's local date and time in a clear format
    const localDateString = now.toLocaleDateString('en-US', {
        timeZone: userTimezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });

    const localTimeString = now.toLocaleTimeString('en-US', {
        timeZone: userTimezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
    });

    console.log('[OpenAI] User timezone:', userTimezone);
    console.log('[OpenAI] Timezone offset:', offsetString);
    console.log('[OpenAI] Current LOCAL date:', localDateString);
    console.log('[OpenAI] Current LOCAL time:', localTimeString);

    const systemPrompt = `You are a task parsing assistant. Extract task information from natural language commands.

CURRENT DATE AND TIME (USER'S LOCAL TIME):
Date: ${localDateString}
Time: ${localTimeString}
Timezone: ${userTimezone}
Timezone Offset: ${offsetString}

IMPORTANT: Today is ${localDateString}. Use this as the reference for "today", "tomorrow", etc.

CRITICAL TIMEZONE RULES:
1. The user is speaking in their LOCAL TIME (${userTimezone})
2. When they say "11 AM", they mean 11 AM in ${userTimezone}, NOT UTC
3. You MUST return the date/time in ISO 8601 format WITH timezone offset
4. The timezone offset is: ${offsetString}
5. Example: If user says "tomorrow at 11 AM":
   - Today is ${localDateString}
   - Tomorrow is the next day after ${localDateString}
   - Return: "YYYY-MM-DDTHH:mm:ss${offsetString}" (calculate the correct date)
   - This represents 11 AM in the user's local timezone

TASK EXTRACTION RULES:
1. The TASK TITLE is what the user wants to be reminded about (the action/thing to do)
2. IGNORE words like "set alarm", "remind me", "reminder" - these are just command words
3. Extract the ACTUAL task from the command
4. Calculate the due date/time accurately based on TODAY'S DATE: ${localDateString}
5. Return ONLY valid JSON, no markdown, no explanation
6. Use ISO 8601 format with timezone: YYYY-MM-DDTHH:mm:ss${offsetString}

PRIORITY DETECTION RULES:
7. Detect priority from keywords:
   - HIGH priority: "urgent", "important", "critical", "asap", "emergency", "high priority"
   - LOW priority: "low priority", "when I can", "eventually", "sometime", "not urgent"
   - MEDIUM priority: default if no priority keywords detected
8. Priority should be one of: "high", "medium", "low"
9. If no priority keywords found, use "medium" as default

REPEAT DETECTION RULES (Phase 2):
10. Detect repeat patterns from keywords:
    - DAILY: "every day", "daily", "each day", "everyday"
    - WEEKLY: "every week", "weekly", "every Monday", "every Tuesday", etc.
    - MONTHLY: "every month", "monthly", "every 1st", "every 15th", etc.
    - NONE: default if no repeat keywords detected
11. For DAILY repeat, set: {"repeatType": "DAILY", "repeatConfig": {"intervalDays": 1}}
12. For WEEKLY repeat, set: {"repeatType": "WEEKLY", "repeatConfig": {"daysOfWeek": ["MON"], "intervalWeeks": 1}}
    - Extract day(s) of week: MON, TUE, WED, THU, FRI, SAT, SUN
    - If "every Monday and Wednesday" → ["MON", "WED"]
13. For MONTHLY repeat, set: {"repeatType": "MONTHLY", "repeatConfig": {"dayOfMonth": 1, "intervalMonths": 1}}
    - Extract day of month (1-31)
14. If no repeat keywords, set: {"repeatType": "NONE", "repeatConfig": null}

NOTIFY BEFORE DETECTION RULES (Phase 3):
15. Detect pre-notification requests from keywords:
    - "notify me X minutes before" → ["PT{X}M"]
    - "remind me X hours before" → ["PT{X}H"]
    - "alert me X days before" → ["P{X}D"]
    - "5 minutes early" → ["PT5M"]
    - "1 hour early" → ["PT1H"]
16. Use ISO 8601 duration format:
    - Minutes: PT5M, PT10M, PT15M, PT30M
    - Hours: PT1H, PT2H, PT3H
    - Days: P1D, P2D, P3D
17. Can have multiple offsets: ["PT5M", "PT1H"] means notify 5 minutes AND 1 hour before
18. If no notify-before keywords, set: []

ACTIVE/INACTIVE DETECTION RULES (Phase 1):
19. Detect if task should be inactive:
    - "create inactive", "paused", "disabled", "don't activate" → isActive: false
    - Default: isActive: true (most tasks are active)
20. Most tasks should be active unless explicitly stated otherwise

DESCRIPTION/NOTES DETECTION:
21. Extract additional details as description:
    - "with notes: ...", "details: ...", "note: ..."
    - Shopping lists, meeting agendas, etc.
22. If no additional details, set description to null

MULTIPLE TASKS SUPPORT:
23. Users can mention MULTIPLE tasks in one command
24. Look for separators like "and", "also", commas, or multiple time references
25. Return ALL tasks found in the "tasks" array
26. Each task should have its own title, dueDate, priority, repeat, etc.

Response format (JSON only):
{
  "tasks": [
    {
      "title": "string",
      "dueDate": "ISO string with timezone or null",
      "priority": "high" | "medium" | "low",
      "description": "string or null",
      "isActive": true | false,
      "repeatType": "NONE" | "DAILY" | "WEEKLY" | "MONTHLY",
      "repeatConfig": {
        "intervalDays": 1  // for DAILY
        OR
        "daysOfWeek": ["MON", "WED"], "intervalWeeks": 1  // for WEEKLY
        OR
        "dayOfMonth": 15, "intervalMonths": 1  // for MONTHLY
      } OR null,
      "preNotifyOffsets": ["PT5M", "PT1H"] OR []
    }
  ]
}

EXAMPLES (timezone offset is ${offsetString}, today is ${localDateString}):

Input: "Remind me everyday at 9 AM about water planting"
Analysis: Daily repeat task at 9 AM
Output: {
  "tasks": [{
    "title": "Water planting",
    "dueDate": "YYYY-MM-DDT09:00:00${offsetString}",
    "priority": "medium",
    "description": null,
    "isActive": true,
    "repeatType": "DAILY",
    "repeatConfig": {"intervalDays": 1},
    "preNotifyOffsets": []
  }]
}

Input: "Call mom every Monday at 2pm, notify me 5 minutes before"
Analysis: Weekly repeat on Monday, with 5-minute pre-notification
Output: {
  "tasks": [{
    "title": "Call mom",
    "dueDate": "YYYY-MM-DDT14:00:00${offsetString}",
    "priority": "medium",
    "description": null,
    "isActive": true,
    "repeatType": "WEEKLY",
    "repeatConfig": {"daysOfWeek": ["MON"], "intervalWeeks": 1},
    "preNotifyOffsets": ["PT5M"]
  }]
}

Input: "Important meeting tomorrow at 3pm, remind me 1 hour and 5 minutes early"
Analysis: High priority, multiple pre-notifications
Output: {
  "tasks": [{
    "title": "Meeting",
    "dueDate": "YYYY-MM-DDT15:00:00${offsetString}",
    "priority": "high",
    "description": null,
    "isActive": true,
    "repeatType": "NONE",
    "repeatConfig": null,
    "preNotifyOffsets": ["PT1H", "PT5M"]
  }]
}

Input: "Gym session every Monday and Friday at 6am"
Analysis: Weekly repeat on multiple days
Output: {
  "tasks": [{
    "title": "Gym session",
    "dueDate": "YYYY-MM-DDT06:00:00${offsetString}",
    "priority": "medium",
    "description": null,
    "isActive": true,
    "repeatType": "WEEKLY",
    "repeatConfig": {"daysOfWeek": ["MON", "FRI"], "intervalWeeks": 1},
    "preNotifyOffsets": []
  }]
}

Input: "Pay rent every month on the 1st at 10am, notify me 1 day before"
Analysis: Monthly repeat with pre-notification
Output: {
  "tasks": [{
    "title": "Pay rent",
    "dueDate": "YYYY-MM-DDT10:00:00${offsetString}",
    "priority": "medium",
    "description": null,
    "isActive": true,
    "repeatType": "MONTHLY",
    "repeatConfig": {"dayOfMonth": 1, "intervalMonths": 1},
    "preNotifyOffsets": ["P1D"]
  }]
}

Input: "Buy groceries tomorrow at 5pm and important meeting at 3pm"
Analysis: TWO separate tasks
Output: {
  "tasks": [
    {
      "title": "Buy groceries",
      "dueDate": "YYYY-MM-DDT17:00:00${offsetString}",
      "priority": "medium",
      "description": null,
      "isActive": true,
      "repeatType": "NONE",
      "repeatConfig": null,
      "preNotifyOffsets": []
    },
    {
      "title": "Meeting",
      "dueDate": "YYYY-MM-DDT15:00:00${offsetString}",
      "priority": "high",
      "description": null,
      "isActive": true,
      "repeatType": "NONE",
      "repeatConfig": null,
      "preNotifyOffsets": []
    }
  ]
}

CRITICAL: 
- ALL times spoken by the user are in their local timezone (${userTimezone})
- TODAY'S DATE IS: ${localDateString}
- CURRENT TIME IS: ${localTimeString}
- Calculate "tomorrow", "today", "in X minutes" based on these values
- You MUST include the timezone offset ${offsetString} in EVERY date string
- Format: YYYY-MM-DDTHH:mm:ss${offsetString}
- Focus on extracting the ACTUAL TASK, not command words!
- ALWAYS detect priority from keywords, default to "medium" if none found
- ALWAYS detect repeat patterns (daily, weekly, monthly)
- ALWAYS detect notify-before requests
- ALWAYS return an array of tasks, even if there's only one task
- ALWAYS include all fields: title, dueDate, priority, description, isActive, repeatType, repeatConfig, preNotifyOffsets`;

    try {
        console.log(`[OpenAI] Attempting to parse with ${CHAT_MODEL}...`);

        const requestBody: any = {
            model: CHAT_MODEL,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                {
                    role: 'user',
                    content: text,
                },
            ],
            temperature: 0.1, // Low temperature for consistent parsing
            max_tokens: 300, // Increased for multiple tasks support
            response_format: { type: "json_object" }, // Force JSON response
        };

        console.log('[OpenAI] Request body:', JSON.stringify(requestBody, null, 2));

        const response = await axios.post(
            `${OPENAI_API_BASE}/chat/completions`,
            requestBody,
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                timeout: TIMEOUT_MS,
            }
        );

        const content = response.data.choices[0].message.content.trim();
        console.log('[OpenAI] Model response:', content);
        console.log('[OpenAI] Full response data:', JSON.stringify(response.data, null, 2));

        // Check if content is empty
        if (!content) {
            console.error('[OpenAI] Empty response from model');
            throw new Error('Model returned empty response. This may be due to content filtering or model limitations.');
        }

        // Parse JSON response
        // Remove markdown code blocks if present
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : content;

        console.log('[OpenAI] JSON string to parse:', jsonString);

        const parsed = JSON.parse(jsonString) as ParsedTasksResponse;

        // Validate response
        if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
            throw new Error('Invalid response: missing tasks array');
        }

        // Validate each task
        for (const task of parsed.tasks) {
            if (!task.title || typeof task.title !== 'string') {
                throw new Error('Invalid response: task missing or invalid title');
            }
        }

        console.log('[OpenAI] Parsed tasks:', parsed);
        console.log(`[OpenAI] Found ${parsed.tasks.length} task(s)`);
        return parsed;
    } catch (error: any) {
        console.error('[OpenAI] Parsing error:', error.response?.data || error.message);

        // Detailed error logging
        if (error.response) {
            console.error('[OpenAI] Status:', error.response.status);
            console.error('[OpenAI] Error details:', JSON.stringify(error.response.data, null, 2));
        }

        // Retry logic for timeout and network errors
        const isRetryableError =
            error.code === 'ECONNABORTED' ||
            error.message?.includes('timeout') ||
            error.message?.includes('Network Error') ||
            error.response?.status === 429 || // Rate limit
            error.response?.status >= 500; // Server errors

        if (isRetryableError && retryCount < MAX_RETRIES) {
            const delayMs = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
            console.log(`[OpenAI] Retrying in ${delayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            return parseTaskFromText(text, retryCount + 1);
        }

        // Check for model-specific errors
        if (error.response?.data?.error?.code === 'model_not_found') {
            console.error(`[OpenAI] Model "${CHAT_MODEL}" not found. You may need to use "gpt-4o-mini" instead.`);
            throw new Error(`Model "${CHAT_MODEL}" not available. Please update CHAT_MODEL in OpenAIService.ts to "gpt-4o-mini" or check your API access.`);
        }

        throw new Error(`Task parsing failed: ${error.response?.data?.error?.message || error.message}`);
    }
}

/**
 * Complete voice-to-task pipeline
 * 1. Transcribe audio to text
 * 2. Parse text to structured task data (supports multiple tasks)
 */
export async function processVoiceInput(audioUri: string): Promise<ParsedTasksResponse> {
    console.log('[OpenAI] ========================================');
    console.log('[OpenAI] PROCESSING VOICE INPUT');
    console.log('[OpenAI] Platform:', Platform.OS);
    console.log('[OpenAI] Audio URI:', audioUri);
    console.log('[OpenAI] ========================================');

    // Step 1: Transcribe
    console.log('[OpenAI] Step 1: Transcribing audio...');
    const transcription = await transcribeAudio(audioUri);
    console.log('[OpenAI] ----------------------------------------');
    console.log('[OpenAI] TRANSCRIPTION RESULT:');
    console.log('[OpenAI] Text:', transcription);
    console.log('[OpenAI] Length:', transcription.length, 'characters');
    console.log('[OpenAI] ----------------------------------------');

    // Step 2: Parse (now returns multiple tasks)
    console.log('[OpenAI] Step 2: Parsing transcription to tasks...');
    const tasksData = await parseTaskFromText(transcription);
    console.log('[OpenAI] ----------------------------------------');
    console.log('[OpenAI] PARSING RESULT:');
    console.log('[OpenAI] Tasks found:', tasksData.tasks.length);
    if (tasksData.tasks.length > 0) {
        tasksData.tasks.forEach((task, i) => {
            console.log(`[OpenAI] Task ${i + 1}: "${task.title}" due: ${task.dueDate || 'none'}`);
        });
    }
    console.log('[OpenAI] ----------------------------------------');

    // Validate that we got tasks
    if (!tasksData.tasks || tasksData.tasks.length === 0) {
        console.warn('[OpenAI] ⚠️ WARNING: No tasks were parsed!');
        console.warn('[OpenAI] Transcription was:', transcription);
        console.warn('[OpenAI] Platform:', Platform.OS);
        console.warn('[OpenAI] This might mean:');
        console.warn('[OpenAI]   1. The transcription was unclear');
        console.warn('[OpenAI]   2. The command format was not recognized');
        console.warn('[OpenAI]   3. GPT could not extract a task');
    }

    console.log('[OpenAI] ========================================');
    return tasksData;
}
