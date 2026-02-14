# AI Voice Input - Quick Setup Guide

## 🚀 Quick Start (3 Steps)

### Step 1: Add Your OpenAI API Key

Open `cronos-app/core/constants.ts` and replace the placeholder:

```typescript
export const OPENAI_API_KEY = 'sk-proj-your-actual-key-here';
```

**Get your API key:** https://platform.openai.com/api-keys

---

### Step 2: Rebuild Native Code

The feature requires microphone permissions, so you need to rebuild:

```bash
# For iOS
npx expo prebuild --platform ios
npx expo run:ios

# For Android
npx expo prebuild --platform android
npx expo run:android
```

---

### Step 3: Test It!

1. Open the app
2. Tap the **blue microphone button** (above the + button)
3. Speak: "Remind me to call John in 20 minutes"
4. Tap the button again to stop
5. Wait for "Analyzing..."
6. Task is created automatically! 🎉

---

## 📱 How to Use

### Button States

| State | Color | Icon | Action |
|-------|-------|------|--------|
| **Idle** | Blue | 🎤 Mic | Tap to start recording |
| **Recording** | Red (pulsing) | 🔴 Mic Off | Tap to stop and process |
| **Processing** | Blue | ⏳ Spinner | Wait for AI analysis |

### Example Commands

✅ **"Remind me to call John in 20 minutes"**  
→ Creates task "Call John" due in 20 minutes

✅ **"Buy groceries tomorrow at 5pm"**  
→ Creates task "Buy groceries" due tomorrow at 5pm

✅ **"Meeting with team next Monday at 10am"**  
→ Creates task "Meeting with team" due next Monday at 10am

✅ **"Finish the report"**  
→ Creates task "Finish the report" with no due date

---

## 🔧 Troubleshooting

### "Permission Required" Alert
**Fix:** Go to Settings → Cronos → Enable Microphone

### "Processing Error: Incorrect API key"
**Fix:** Check your OpenAI API key in `core/constants.ts`

### Task created with wrong time
**Fix:** Check your device timezone settings

### Poor transcription
**Fix:** Speak clearly, reduce background noise

---

## 💰 Cost Estimate

OpenAI API costs are minimal:
- **Whisper:** $0.006 per minute of audio
- **GPT-4o:** ~$0.0001 per request

**Example:** 100 voice commands/day ≈ $0.60/day

---

## 📦 What Was Installed

```bash
npm install expo-av axios expo-file-system
```

- **expo-av:** Audio recording
- **axios:** HTTP requests to OpenAI
- **expo-file-system:** File management

---

## 🎯 Features

✅ Natural language understanding  
✅ Relative time calculations ("in 20 minutes", "tomorrow")  
✅ Automatic task creation  
✅ Notification scheduling  
✅ Supabase sync  
✅ Visual feedback (pulsing animation)  
✅ Haptic feedback  
✅ Error handling  

---

## 📚 Full Documentation

See `AI_VOICE_INPUT_FEATURE.md` for complete technical documentation.

---

**Ready to go!** Just add your OpenAI API key and rebuild. 🚀