# Android Voice Input - Complete Debug Checklist

## 🚨 CRITICAL: Did You Restart the App?

**ALL changes require a complete app restart!**

### How to Restart Properly:

1. **Stop Metro bundler** in terminal (Ctrl+C)
2. **Close the app completely** on Android device (swipe away from recent apps)
3. **Clear cache and restart:**
   ```bash
   cd cronos-app
   npx expo start --clear
   ```
4. **Wait for bundler to start**
5. **Reopen the app** on device
6. **Try voice input again**

---

## 🔍 What to Check in Console

After recording, you should see these logs in order:

### 1. Recording Start Logs:
```
[VoiceInput] Starting recording...
[VoiceInput] Audio permissions granted
[VoiceInput] Creating recording with Android settings...
[VoiceInput] Sample rate: 44100 Hz
[VoiceInput] Bit rate: 128000 bps
[VoiceInput] Recording prepared, starting...
[VoiceInput] Recording started successfully!
[VoiceInput] Recording start time: <timestamp>
```

### 2. Recording Stop Logs:
```
[VoiceInput] Stopping recording...
[VoiceInput] ========================================
[VoiceInput] RECORDING STOPPED
[VoiceInput] ========================================
[VoiceInput] Recording duration: XXXX ms
[VoiceInput] Minimum required: 1000 ms
[VoiceInput] Duration check: PASS ✅ or FAIL ❌
[VoiceInput] ========================================
```

### 3. If Duration Check FAILS:
```
[VoiceInput] ❌ Recording too short!
[VoiceInput] You need to hold the button for at least 1 second
[VoiceInput] Actual duration: XXX ms
```
**You'll see an alert:** "Recording Too Short"

### 4. If Duration Check PASSES:
```
[VoiceInput] ✅ Recording duration is sufficient, proceeding...
[VoiceInput] Recording stopped, URI: <file path>
[VoiceInput] Audio file size: X.XX MB
[VoiceInput] Processing audio with OpenAI...
```

### 5. Transcription Logs:
```
[OpenAI] Processing audio file at: <path>
[OpenAI] Input file info: {"exists":true,"size":XXXXX}
[OpenAI] File validation passed - Size: XXXXX bytes
[OpenAI] Sending audio to Whisper API using fetch...
[OpenAI] ========================================
[OpenAI] TRANSCRIPTION RESULT:
[OpenAI] ========================================
[OpenAI] <your spoken text>
[OpenAI] ========================================
[OpenAI] Transcription length: XX characters
```

### 6. Parsing Logs:
```
[OpenAI] Step 2: Parsing transcription to tasks...
[OpenAI] ========================================
[OpenAI] PARSING RESULT:
[OpenAI] ========================================
[OpenAI] {
  "tasks": [
    {
      "title": "...",
      "dueDate": "...",
      ...
    }
  ]
}
[OpenAI] ========================================
[OpenAI] Number of tasks found: X
```

---

## 🎯 Test Procedure

### Test 1: Check Recording Duration

1. Tap blue button (turns RED)
2. **Count slowly: "One Mississippi, Two Mississippi, Three Mississippi"**
3. Tap RED button
4. **Check console for:**
   ```
   [VoiceInput] Recording duration: XXXX ms
   ```
   **Should be at least 3000 ms (3 seconds)**

### Test 2: Check Transcription

1. Tap blue button
2. Wait 1 second
3. Say clearly: **"Buy milk tomorrow"**
4. Wait 1 second
5. Tap RED button
6. **Check console for:**
   ```
   [OpenAI] TRANSCRIPTION RESULT:
   [OpenAI] Buy milk tomorrow
   ```
   **Should NOT be "BELL" or other system sounds**

### Test 3: Check Task Creation

1. Follow Test 2 steps
2. **Check console for:**
   ```
   [OpenAI] Number of tasks found: 1
   [VoiceInputButton] Received 1 task(s) from voice input
   ```
3. **You should see the task review modal**

---

## ❌ Common Issues & Solutions

### Issue 1: Still Getting "BELL"

**Symptoms:**
```
[OpenAI] Transcription result: BELL
[OpenAI] Transcription length: 4 characters
```

**Possible Causes:**
1. ❌ App not restarted after code changes
2. ❌ Recording duration still too short
3. ❌ Not speaking during recording
4. ❌ Microphone permission issue

**Solutions:**
1. ✅ **Restart app completely** (see top of document)
2. ✅ Hold button for at least 3 seconds
3. ✅ Speak clearly during recording
4. ✅ Check Android Settings → Apps → Cronos → Permissions → Microphone (should be "Allow")

---

### Issue 2: Recording Duration Shows < 1000ms

**Symptoms:**
```
[VoiceInput] Recording duration: 500 ms
[VoiceInput] Duration check: FAIL ❌
```

**Cause:**
- Tapping button too fast

**Solution:**
- **Don't tap twice quickly**
- **Hold the button down** while speaking
- Or tap once, wait 3 seconds, then tap again

---

### Issue 3: No Recording Logs at All

**Symptoms:**
- No `[VoiceInput]` logs appear

**Possible Causes:**
1. ❌ App not restarted
2. ❌ Code changes not applied
3. ❌ Metro bundler not running

**Solutions:**
1. ✅ Stop Metro (Ctrl+C)
2. ✅ Close app on device
3. ✅ Run: `npx expo start --clear`
4. ✅ Reopen app
5. ✅ Try again

---

### Issue 4: Transcription is Correct but No Tasks

**Symptoms:**
```
[OpenAI] Transcription result: Buy milk tomorrow
[OpenAI] Number of tasks found: 0
```

**Cause:**
- GPT parsing issue (different problem)

**Solution:**
- This is a separate issue from recording
- The recording and transcription are working
- Need to debug GPT prompt/parsing

---

## 📱 Android-Specific Checks

### 1. Microphone Permission

**Check:**
- Settings → Apps → Cronos → Permissions → Microphone
- Should be: **"Allow"** or **"Allow only while using the app"**

**If "Denied":**
1. Change to "Allow"
2. Restart app
3. Try again

---

### 2. Background Noise

**Android microphones can be sensitive to:**
- Fan noise
- Air conditioning
- Traffic outside
- TV/music
- Other people talking

**Solution:**
- Test in a quiet room
- Close windows
- Turn off TV/music
- Test alone

---

### 3. Phone Case

**Some phone cases can:**
- Block microphone
- Muffle sound
- Cause echo

**Solution:**
- Remove case temporarily
- Test without case

---

### 4. Microphone Hardware

**Test if microphone works:**
1. Open Android Voice Recorder app
2. Record yourself speaking
3. Play back recording
4. Can you hear yourself clearly?

**If NO:**
- Hardware issue with phone
- Need to fix microphone

**If YES:**
- Microphone works fine
- Issue is with app configuration

---

## 🧪 Detailed Test Sequence

### Complete Test with All Checks:

1. **Restart app** (see top of document)

2. **Open console** and clear it

3. **Tap blue microphone button**
   - Should turn RED
   - Check console for: `[VoiceInput] Recording started successfully!`

4. **Wait 1 second** (count: "One Mississippi")

5. **Speak clearly:** "Buy milk tomorrow at three PM"

6. **Wait 1 second** (count: "One Mississippi")

7. **Tap RED button**
   - Should show "Analyzing..."
   - Check console for duration logs

8. **Check console logs in order:**
   - Recording duration (should be 3000+ ms)
   - Duration check (should be PASS ✅)
   - Transcription result (should be your spoken text)
   - Number of tasks found (should be 1)

9. **Check UI:**
   - Should see task review modal
   - Task title should be "Buy milk"
   - Due date should be tomorrow at 3 PM

---

## 📊 Expected vs Actual

### Expected Flow (Working):
```
Tap button
  ↓
RED button, timer starts
  ↓
Wait 1 second
  ↓
Speak: "Buy milk tomorrow"
  ↓
Wait 1 second
  ↓
Tap button
  ↓
Duration: 3000+ ms ✅
  ↓
Transcription: "Buy milk tomorrow" ✅
  ↓
Tasks found: 1 ✅
  ↓
Task review modal appears ✅
```

### Actual Flow (Not Working):
```
Tap button
  ↓
RED button
  ↓
Immediately tap again (too fast!)
  ↓
Duration: 200 ms ❌
  ↓
Transcription: "BELL" ❌
  ↓
Tasks found: 0 ❌
  ↓
Error message ❌
```

---

## 🎯 Action Items

### Right Now:

1. ✅ **RESTART THE APP** (most important!)
   ```bash
   # Stop Metro
   Ctrl+C
   
   # Close app on device
   
   # Restart with cache clear
   cd cronos-app
   npx expo start --clear
   ```

2. ✅ **Try voice input with proper technique:**
   - Tap button (RED)
   - Wait 1 second
   - Speak: "Buy milk tomorrow"
   - Wait 1 second
   - Tap button

3. ✅ **Share complete console output:**
   - All `[VoiceInput]` logs
   - All `[OpenAI]` logs
   - Any error messages

---

## 📝 What to Share

If it still doesn't work, share:

1. **Recording duration log:**
   ```
   [VoiceInput] Recording duration: XXXX ms
   ```

2. **Transcription result:**
   ```
   [OpenAI] TRANSCRIPTION RESULT:
   [OpenAI] <text>
   ```

3. **Number of tasks:**
   ```
   [OpenAI] Number of tasks found: X
   ```

4. **Any error messages**

5. **Did you restart the app?** (Yes/No)

---

**Last Updated:** February 8, 2026  
**Status:** Enhanced debugging added  
**Next:** User to restart app and test with detailed logging

