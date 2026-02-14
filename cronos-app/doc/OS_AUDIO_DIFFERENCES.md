# OS-Level Audio Analysis: iOS vs Android

This document analyzes the fundamental differences in how iOS and Android handle audio capture, focus, and lifecycle, explaining why aligning the Android configuration with iOS resolved the voice recording issues.

## 1. Speech Recognition Architecture

### The Difference in Approach
While both platforms offer on-device speech recognition APIs (`SFSpeechRecognizer` on iOS, `SpeechRecognizer` on Android), our implementation uses **OpenAI Whisper**, meaning the mobile device's role is solely **Audio Capture**.

#### iOS (AVAudioSession)
- **Philosophy**: "Service-based abstraction."
- **Mechanism**: You configure a shared `AVAudioSession`. You tell it *what* you want to do (Category: `PlayAndRecord`), and the OS handles the complex routing logic (e.g., cancelling echo, selecting the best mic) automatically.
- **Why it works**: The `PlayAndRecord` category with `DefaultToSpeaker` option is highly optimized for modern VoIP and voice Assistant scenarios. It automatically creates a "clean path" for voice data.

#### Android (MediaRecorder & AudioManager)
- **Philosophy**: "Hardware-centric control."
- **Mechanism**: You must explicitly select an `Audio Source`.
  - `MIC` (1): Raw input from the microphone.
  - `VOICE_RECOGNITION` (6): Tuned for speech (applies hardware Noise Suppression & Echo Cancellation if available).
  - `DEFAULT` (0): Lets the OS decide.
- **The Failure Point**: We previously hardcoded `audioSource: 6`. While theoretically better, it is strictly validated. If another app holds a specific type of audio focus, or if the hardware doesn't expose this source cleanly to the `MediaRecorder` instance created by `expo-av`, it fails silently or throws errors. **Reverting to defaults (matching iOS's "let the OS decide" approach) fixed this by using the most compatible path (usually `DEFAULT` or `MIC`).**

## 2. Audio Focus Handling

### iOS: Categories & Interruptions
- **Handling**: Strict categories. When `setAudioModeAsync` is called, it activates the session. If another app (like Spotify) is playing, iOS decides based on the category options (e.g., `duckOthers`) whether to mix, duck, or pause the other audio.
- **Safety**: iOS will aggressively protect the recording session if configured as `PlayAndRecord`. It rarely leaves the app in a "zombie" state where it thinks it's recording but isn't.

### Android: Audio Focus Requests
- **Handling**: Cooperative multitasking. Apps request focus (`AUDIOFOCUS_GAIN_TRANSIENT`).
- **The "Ducking" Trap**: We explicitly set `shouldDuckAndroid: true`.
  - On Android, requesting "Ducking" means "I want to speak *over* the background audio."
  - **Issue**: Some Android devices/versions struggle to maintain high-quality recording input stream while simultaneously processing the output stream attenuation (ducking). This complexity creates race conditions where the microphone stream might not initialize if the focus handshake doesn't complete instantly.
- **The Fix**: By removing explicit Android focus settings (`shouldDuckAndroid`, `playThroughEarpieceAndroid`), we stopped fighting the OS. We essentially said "I'm a normal recording app," which simplifies the focus request to a standard interrupt, which is much more reliable.

## 3. Lifecycle Enforcement

### iOS: Background Enforcement
- **Policy**: Strict. Recording stops immediately upon backgrounding unless the `audio` background mode is enabled in `Info.plist`.
- **Behavior**: The OS sends a specific interruption notification. The `expo-av` library handles this by stopping the recording. It's clean and predictable.

### Android: Privacy & Foreground Services
- **Policy**: strict privacy indicators. Android 12+ requires a visual indicator (green dot) when the mic is used.
- **Backgrounding**: Android creates a "Foreground Service" or requires the app to be visible to record.
- **The "Zombie" State**: On Android, if an app requests a recording configuration that conflicts with its current lifecycle state (e.g., requesting a high-priority `VOICE_RECOGNITION` source while temporarily in a transitioning state), the OS may grant a "silent" stream (recording zeros) to protect user privacy.
- **Why Simplicity Won**: By using standard settings (44.1kHz, Default Source), the app looks like a standard recorder. The OS is less aggressive in filtering or blocking the stream compared to when specialized, high-sensitivity sources like `VOICE_RECOGNITION` are requested.

## Summary

The previous Android configuration attempted to manually orchestrate behavior that iOS automates (Noise Cancellation, Ducking, Routing).

**The winning strategy was "Convergence":**
1.  **Trust the OS Defaults**: Remove `audioSource: 6`. Let Android choose the safest mic source.
2.  **Harmonize Quality**: 44.1kHz / Mono is a "safe harbor" standard supported by virtually every audio chip since 2010.
3.  **Simplify Focus**: Remove custom ducking/routing logic to avoid focus negotiation race conditions.

By making Android "dumb" (simple) like iOS, we removed the surface area for platform-specific failures.
