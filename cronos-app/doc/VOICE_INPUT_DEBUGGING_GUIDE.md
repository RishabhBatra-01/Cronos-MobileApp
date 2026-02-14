# Voice Input Debugging Guide

## 🔍 Current Status

You're seeing the error: **"No tasks received from voice input"**

This means:
- ✅ Recording is working
- ✅ Audio file is created
- ✅ Processing is starting
- ❌ Something is failing during transcription or parsing

---

## 📋 What to Check in Console Logs

### **Step 1: Check Recording Logs**

Look for these logs:
```
[VoiceInput] Starting recording...
[VoiceInput] Recording started successfully
[VoiceInput] Stopping recording...
[VoiceInput] Recording stopped, URI: <path>
[VoiceInput] Audio file size: X.XX MB
```

**What to verify:**
- ✅ Recording starts
- ✅ Recording stops
- ✅ File size > 0 MB

---

### **Step 2: Check File Processing Logs**

Look for these logs:
```
[VoiceInput] Processing audio with OpenAI...
[OpenAI] Processing audio file at: <path>
[OpenAI] Input file info: {"exists":true,"size":XXXXX,...}
[OpenAI] File validation passed - Size: XXXXX bytes
```

**What to verify:**
- ✅ File exists
- ✅ File size > 0 bytes
- ✅ File validation passes

**If you see:**
```
[OpenAI] File system error: Audio file does not exist
```
**Problem:** File path is invalid

**If you see:**
```
[OpenAI] File system error: Audio file is empty (0 bytes)
```
**Problem:** Recording didn't capture audio

---

### **Step 3: Check File Path Logs**

Look for these logs:
```
[OpenAI] Copied audio to stable path: <path>
[OpenAI] Using copied file for upload
[OpenAI] Android URI cleaned: file:///path/to/file.m4a
[OpenAI] Final upload URI: file:///path/to/file.m4a
[OpenAI] Using MIME type: audio/m4a
```

**What to verify:**
- ✅ File copied successfully
- ✅ URI has single `file://` prefix (not double)
- ✅ MIME type is `audio/m4a` on Android

**If you see:**
```
[OpenAI] Android URI cleaned: file://file:///path
```
**Problem:** Double `file://` prefix (should be fixed now)

---

### **Step 4: Check API Call Logs**

Look for these logs:
```
[OpenAI] Sending audio to Whisper API using fetch...
[OpenAI] Transcription successful: <your spoken text>
```

**What to verify:**
- ✅ API call is made
- ✅ Transcription is returned
- ✅ Transcription matches what you said

**If you see:**
```
[OpenAI] Whisper API error response: {status: 400, ...}
```
**Problem:** API rejected the request

**Common API Errors:**
- **400 Bad Request:** Invalid file format or corrupted audio
- **401 Unauthorized:** Invalid API key
- **413 Payload Too Large:** Audio file too big (>25MB)
- **429 Too Many Requests:** Rate limit exceeded
- **500 Server Error:** OpenAI service issue

---

### **Step 5: Check Parsing Logs**

Look for these logs:
```
[OpenAI] Parsing task(s) from text: <transcription>
[OpenAI] Model response: {"tasks":[...]}
[OpenAI] Parsed tasks: {...}
[OpenAI] Found X task(s)
```

**What to verify:**
- ✅ Transcription is being parsed
- ✅ Model returns valid JSON
- ✅ Tasks array is not empty

**If you see:**
```
[OpenAI] Parsing error: ...
```
**Problem:** GPT model failed to parse the text

---

### **Step 6: Check Final Result**

Look for these logs:
```
[VoiceInput] Processing complete: {"tasks":[...]}
[VoiceInputButton] Received X task(s) from voice input
```

**What to verify:**
- ✅ Processing completes
- ✅ Tasks are returned
- ✅ Task count > 0

**If you see:**
```
[VoiceInputButton] No tasks received from voice input
[VoiceInputButton] tasksData: null
```
**Problem:** Processing returned null (error occurred)

**If you see:**
```
[VoiceInputButton] No tasks received from voice input
[VoiceInputButton] tasksData: {"tasks":[]}
```
**Problem:** Processing succeeded but no tasks were parsed

---

## 🐛 Common Issues and Solutions

### **Issue 1: "No tasks received" with null tasksData**

**Symptoms:**
```
[VoiceInputButton] No tasks received from voice input
[VoiceInputButton] tasksData: null
```

**Cause:** An error occurred during processing

**Solution:**
1. Check earlier logs for error messages
2. Look for `[OpenAI]` error logs
3. Check internet connection
4. Verify OpenAI API key is valid

---

### **Issue 2: "No tasks received" with empty tasks array**

**Symptoms:**
```
[VoiceInputButton] No tasks received from voice input
[VoiceInputButton] tasksData: {"tasks":[]}
```

**Cause:** Transcription succeeded but GPT couldn't parse any tasks

**Solution:**
1. Check what was transcribed: look for `[OpenAI] Transcription successful: <text>`
2. If transcription is empty or gibberish, speak more clearly
3. If transcription is correct but no tasks parsed, the GPT model might be having issues

---

### **Issue 3: API Error 400 (Bad Request)**

**Symptoms:**
```
[OpenAI] Whisper API error response: {status: 400, ...}
```

**Possible Causes:**
- Invalid audio format
- Corrupted audio file
- Wrong MIME type
- Invalid file path

**Solution:**
1. Check MIME type log: should be `audio/m4a` on Android
2. Check file size: should be > 0 bytes
3. Try recording again
4. Check if file path has double `file://` prefix

---

### **Issue 4: API Error 401 (Unauthorized)**

**Symptoms:**
```
[OpenAI] Whisper API error response: {status: 401, ...}
```

**Cause:** Invalid or missing OpenAI API key

**Solution:**
1. Check `cronos-app/core/constants.ts`
2. Verify `OPENAI_API_KEY` is set correctly
3. Verify API key is valid on OpenAI dashboard
4. Check if API key has Whisper API access

---

### **Issue 5: Timeout Error**

**Symptoms:**
```
[OpenAI] Request timed out. Please check your internet connection and try again.
```

**Cause:** Network is too slow or API is not responding

**Solution:**
1. Check internet connection speed
2. Try on WiFi instead of mobile data
3. Try with shorter recording (< 10 seconds)
4. Wait a few minutes and try again

---

### **Issue 6: Empty Transcription**

**Symptoms:**
```
[OpenAI] Transcription is empty. Please try speaking more clearly.
```

**Cause:** Whisper API returned empty text

**Possible Reasons:**
- Recording was silent
- Audio quality too low
- Background noise too loud
- Speaking too quietly

**Solution:**
1. Speak louder and more clearly
2. Record in quiet environment
3. Hold phone closer to mouth
4. Check microphone is not blocked

---

## 🔧 Debugging Steps

### **Step 1: Enable Detailed Logging**

The code now has comprehensive logging. Just check the console output.

### **Step 2: Test with Simple Command**

Try saying: **"Buy milk tomorrow at 3pm"**

This should:
1. Record successfully
2. Transcribe to: "Buy milk tomorrow at 3pm"
3. Parse to: 1 task with title "Buy milk"
4. Show task review modal

### **Step 3: Check Each Stage**

Go through the logs step by step:
1. ✅ Recording logs
2. ✅ File processing logs
3. ✅ File path logs
4. ✅ API call logs
5. ✅ Parsing logs
6. ✅ Final result logs

### **Step 4: Identify Where It Fails**

Find the last successful log, then check the next error log.

---

## 📊 Expected Log Flow (Success)

```
[VoiceInput] Starting recording...
[VoiceInput] Recording started successfully
[VoiceInput] Stopping recording...
[VoiceInput] Recording stopped, URI: file:///data/.../audio.m4a
[VoiceInput] Audio file size: 0.15 MB
[VoiceInput] Processing audio with OpenAI...
[OpenAI] Processing audio file at: file:///data/.../audio.m4a
[OpenAI] Input file info: {"exists":true,"size":153600,...}
[OpenAI] File validation passed - Size: 153600 bytes
[OpenAI] Copied audio to stable path: file:///data/.../upload_debug.m4a
[OpenAI] Using copied file for upload
[OpenAI] Android URI cleaned: file:///data/.../upload_debug.m4a
[OpenAI] Final upload URI: file:///data/.../upload_debug.m4a
[OpenAI] Using MIME type: audio/m4a
[OpenAI] Sending audio to Whisper API using fetch...
[OpenAI] Transcription successful: Buy milk tomorrow at 3pm
[OpenAI] Parsing task(s) from text: Buy milk tomorrow at 3pm
[OpenAI] Model response: {"tasks":[{"title":"Buy milk","dueDate":"2026-02-09T15:00:00+00:00",...}]}
[OpenAI] Parsed tasks: {"tasks":[...]}
[OpenAI] Found 1 task(s)
[VoiceInput] Processing complete: {"tasks":[...]}
[VoiceInputButton] Received 1 task(s) from voice input
```

---

## 🎯 Quick Checklist

Before reporting an issue, verify:

- [ ] Microphone permission granted
- [ ] Internet connection working
- [ ] OpenAI API key is valid
- [ ] Recording produces audio file > 0 bytes
- [ ] File path has single `file://` prefix
- [ ] MIME type is `audio/m4a` on Android
- [ ] Whisper API call succeeds
- [ ] Transcription is not empty
- [ ] GPT parsing succeeds
- [ ] Tasks array is not empty

---

## 📞 Next Steps

1. **Run the app** and try voice input
2. **Check console logs** for errors
3. **Find where it fails** using this guide
4. **Share the specific error logs** for help

---

**Status:** Debugging in progress
**Last Updated:** February 8, 2026
