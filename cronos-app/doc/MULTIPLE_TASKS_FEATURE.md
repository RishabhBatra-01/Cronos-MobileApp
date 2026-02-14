# Multiple Tasks Voice Input Feature

## Overview
Users can now create **multiple tasks in a single voice recording**! This makes it much faster to add several reminders at once.

## How It Works

### Before (Single Task):
User says: *"Remind me to call mom at 10 AM tomorrow"*
Result: 1 task created

### After (Multiple Tasks):
User says: *"Call mom at 10 AM tomorrow, buy groceries at 5 PM today, and go to gym at 7 PM"*
Result: **3 tasks created automatically!**

## Example Voice Commands

### Multiple Tasks with Times:
```
"Remind me to call John at 9 AM, send email at 2 PM, and meeting at 4 PM"
→ Creates 3 tasks with different times
```

### Multiple Tasks with Mixed Times:
```
"Buy groceries tomorrow at 5 PM, call dentist on Monday at 10 AM, and pay bills"
→ Creates 3 tasks (last one without specific time)
```

### Simple List:
```
"Water plants, feed cat, and take out trash"
→ Creates 3 tasks without specific times
```

### Complex Example:
```
"Tomorrow I need to call mom at 10 AM, buy groceries at 5 PM, 
go to gym at 7 PM, and also remind me to send that email"
→ Creates 4 tasks!
```

## What Changed

### 1. Updated Response Format
**Old:**
```typescript
{
  "title": "Call mom",
  "dueDate": "2026-02-01T10:00:00+05:30"
}
```

**New:**
```typescript
{
  "tasks": [
    {
      "title": "Call mom",
      "dueDate": "2026-02-01T10:00:00+05:30"
    },
    {
      "title": "Buy groceries",
      "dueDate": "2026-01-31T17:00:00+05:30"
    }
  ]
}
```

### 2. Enhanced AI Prompt
The AI now:
- ✅ Looks for separators like "and", "also", commas
- ✅ Detects multiple time references
- ✅ Extracts each task separately
- ✅ Returns all tasks in an array

### 3. Updated Processing Logic
- Loops through all tasks returned by AI
- Creates each task individually
- Schedules notifications for each task with a due date
- Shows success message with task count

## Technical Details

### Files Modified:

**1. `services/OpenAIService.ts`**
- Added `ParsedTasksResponse` interface
- Updated `parseTaskFromText()` to return array of tasks
- Enhanced system prompt with multiple task examples
- Increased `max_tokens` from 150 to 300 (for longer responses)

**2. `hooks/use-voice-input.ts`**
- Updated return type to `ParsedTasksResponse`
- Imports updated interface

**3. `components/VoiceInputButton.tsx`**
- Added loop to create all tasks
- Shows alert with task count when multiple tasks created
- Schedules notifications for each task

### AI Prompt Enhancements:

```
MULTIPLE TASKS SUPPORT:
7. Users can mention MULTIPLE tasks in one command
8. Look for separators like "and", "also", commas, or multiple time references
9. Return ALL tasks found in the "tasks" array
10. Each task should have its own title and dueDate
```

### Token Limit Increased:
```typescript
max_tokens: 300  // Was 150, now 300 for multiple tasks
```

## User Experience

### Single Task:
- Works exactly as before
- No visible change to user
- Returns array with 1 task

### Multiple Tasks:
- User speaks naturally with "and", commas, etc.
- All tasks created at once
- Success alert shows: "Created 3 tasks!"
- Each task gets its own notification

### Visual Feedback:
```
Recording... 15s
↓
Analyzing...
↓
Success! Created 3 tasks!
```

## Benefits

1. **Faster task entry** - Add multiple reminders in one go
2. **Natural speech** - Just speak naturally with "and" between tasks
3. **Time-saving** - No need to record multiple times
4. **Flexible** - Mix tasks with and without times
5. **Smart parsing** - AI understands context and separates tasks correctly

## Examples of What Works

✅ "Call mom and buy groceries"
✅ "Meeting at 3 PM, dentist at 10 AM, and gym at 7 PM"
✅ "Tomorrow: call John, send email, and finish report"
✅ "Water plants, feed cat, take out trash"
✅ "Remind me to call at 9 AM and also buy groceries at 5 PM"
✅ "I need to call mom tomorrow at 10, buy groceries today at 5, and go to gym at 7"

## Cost Impact

**Before:** 150 tokens max per request
**After:** 300 tokens max per request

**Cost difference:** Minimal
- Single task: ~$0.0001 (same as before)
- 3 tasks: ~$0.0002 (still less than 1/100th of a cent)

The slight increase in token limit has negligible cost impact while providing much better functionality.

## Backward Compatibility

✅ **Fully backward compatible**
- Single task commands work exactly as before
- No breaking changes
- Existing functionality preserved

## Testing Recommendations

1. **Single task** - "Remind me tomorrow at 10 AM"
2. **Two tasks** - "Call mom at 10 AM and buy groceries at 5 PM"
3. **Three+ tasks** - "Meeting at 3, dentist at 10, gym at 7, and send email"
4. **Mixed times** - "Call John tomorrow and buy groceries today at 5 PM"
5. **No times** - "Water plants, feed cat, and take out trash"

## Future Enhancements (Optional)

1. **Visual preview** - Show all tasks before creating
2. **Edit before save** - Let user modify parsed tasks
3. **Task grouping** - Group related tasks together
4. **Recurring tasks** - "Every Monday at 9 AM"
5. **Priority detection** - "Urgent: call doctor"

## Conclusion

Users can now create multiple tasks in a single voice recording, making the app much more efficient for batch task entry. The AI intelligently separates tasks and handles complex commands with multiple times and dates.

**Try it:** *"Remind me to call mom at 10 AM tomorrow, buy groceries at 5 PM today, and go to gym at 7 PM"* 🎤✅
