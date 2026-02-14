# 🚀 How to Run the Cronos App

**Complete guide to run your app with all AI features**

---

## 📋 PREREQUISITES

Make sure you have:
- ✅ Node.js installed (v16 or higher)
- ✅ npm or yarn installed
- ✅ Expo CLI installed globally
- ✅ iOS Simulator (Mac) or Android Emulator
- ✅ Physical device (optional but recommended)

---

## 🎯 QUICK START (3 Steps)

### **Step 1: Navigate to Project**
```bash
cd cronos-app
```

### **Step 2: Install Dependencies (if needed)**
```bash
npm install
# or
yarn install
```

### **Step 3: Start the App**
```bash
npx expo start
```

---

## 📱 RUNNING ON DIFFERENT PLATFORMS

### **Option 1: iOS Simulator (Mac only)**
```bash
# Start Expo
npx expo start

# Then press 'i' in the terminal
# Or scan QR code with Expo Go app
```

### **Option 2: Android Emulator**
```bash
# Start Expo
npx expo start

# Then press 'a' in the terminal
# Or scan QR code with Expo Go app
```

### **Option 3: Physical Device (Recommended)**
```bash
# Start Expo
npx expo start

# Scan QR code with:
# - iOS: Camera app
# - Android: Expo Go app
```

### **Option 4: Development Build**
```bash
# If you have a development build installed
npx expo start --dev-client
```

---

## 🔧 COMMON COMMANDS

### **Start Development Server:**
```bash
npx expo start
```

### **Start with Cache Clear:**
```bash
npx expo start -c
```

### **Start on Specific Platform:**
```bash
npx expo start --ios
npx expo start --android
npx expo start --web
```

### **Build Development Client:**
```bash
npx expo run:ios
npx expo run:android
```

---

## ✨ TESTING AI FEATURES

Once the app is running, you can test all 4 AI features:

### **1. Chat with AI (Phase 2)**
```
1. Open any task
2. Tap ✨ button
3. Chat modal opens
4. Ask questions about the task
5. Get AI responses with citations
```

### **2. Research Tasks (Phase 3)**
```
1. Open any task
2. Tap 🔍 button
3. Research panel opens
4. See 4 tabs: Overview, Checklist, Resources, Tips
5. Save to notes
```

### **3. Voice Input (Existing)**
```
1. Tap microphone button 🎤
2. Say your task
3. Review modal appears
4. Tap "Save"
```

### **4. Sub-Task Suggestions (Phase 4)**
```
1. Use voice input (step 3 above)
2. After saving, suggestions modal appears
3. Select sub-tasks you want
4. Tap "Add Selected"
5. Sub-tasks created!
```

---

## 🐛 TROUBLESHOOTING

### **Problem: Dependencies not installed**
```bash
# Solution: Install dependencies
cd cronos-app
npm install
# or
yarn install
```

### **Problem: Metro bundler issues**
```bash
# Solution: Clear cache and restart
npx expo start -c
```

### **Problem: Port already in use**
```bash
# Solution: Kill the process or use different port
npx expo start --port 8082
```

### **Problem: iOS build fails**
```bash
# Solution: Clean and rebuild
cd ios
pod install
cd ..
npx expo run:ios
```

### **Problem: Android build fails**
```bash
# Solution: Clean and rebuild
cd android
./gradlew clean
cd ..
npx expo run:android
```

### **Problem: AI features not working**
```bash
# Check:
1. Internet connection (AI needs internet)
2. Perplexity API key is set in core/constants.ts
3. Feature flags are enabled in useFeatureFlagStore.ts
4. No TypeScript errors (check terminal)
```

### **Problem: Voice input not working**
```bash
# Check:
1. Microphone permissions granted
2. Using physical device (simulator has limited audio)
3. OpenAI API key is set
4. Internet connection
```

---

## 📊 CHECKING FEATURE FLAGS

All AI features are controlled by feature flags. To check/modify:

**File:** `cronos-app/core/store/useFeatureFlagStore.ts`

```typescript
const DEFAULT_FLAGS: AIFeatureFlags = {
  aiAssistantEnabled: true,      // Master switch
  aiConversationalChat: true,    // Phase 2: Chat
  aiResearchMode: true,          // Phase 3: Research
  aiVoiceEnhancement: true,      // Phase 4: Sub-tasks
  // ... other flags
};
```

To disable a feature, set it to `false` and restart the app.

---

## 🔑 API KEYS

Make sure your API keys are configured:

**File:** `cronos-app/core/constants.ts`

```typescript
// Perplexity API (for AI features)
export const PERPLEXITY_API_KEY = 'your-perplexity-key-here';

// OpenAI API (for voice input)
export const OPENAI_API_KEY = 'your-openai-key-here';
```

---

## 📱 RECOMMENDED TESTING FLOW

### **First Time Setup:**
```
1. cd cronos-app
2. npm install
3. npx expo start
4. Scan QR code with device
5. App opens
```

### **Testing AI Features:**
```
1. Create a task manually
2. Test Chat (✨ button)
3. Test Research (🔍 button)
4. Test Voice Input (🎤 button)
5. Test Sub-task Suggestions (after voice)
```

### **Daily Development:**
```
1. cd cronos-app
2. npx expo start
3. Make changes
4. App auto-reloads
5. Test changes
```

---

## 🎯 QUICK COMMANDS REFERENCE

```bash
# Navigate to project
cd cronos-app

# Install dependencies
npm install

# Start development server
npx expo start

# Start with cache clear
npx expo start -c

# Start on iOS
npx expo start --ios

# Start on Android
npx expo start --android

# Build iOS development client
npx expo run:ios

# Build Android development client
npx expo run:android

# Check for issues
npx expo doctor

# Update dependencies
npx expo install --fix
```

---

## 📝 DEVELOPMENT WORKFLOW

### **1. Start Development:**
```bash
cd cronos-app
npx expo start
```

### **2. Make Changes:**
- Edit files in your code editor
- App auto-reloads on save
- Check terminal for errors

### **3. Test Features:**
- Test on device/simulator
- Check console logs
- Verify functionality

### **4. Debug Issues:**
- Check terminal for errors
- Use React Native Debugger
- Check network requests
- Review console logs

---

## 🚀 PRODUCTION BUILD

### **iOS:**
```bash
# Build for App Store
eas build --platform ios --profile production

# Or local build
npx expo run:ios --configuration Release
```

### **Android:**
```bash
# Build for Play Store
eas build --platform android --profile production

# Or local build
npx expo run:android --variant release
```

---

## ✅ VERIFICATION CHECKLIST

Before testing AI features, verify:

- [ ] App starts without errors
- [ ] Can create tasks manually
- [ ] Can edit tasks
- [ ] Can delete tasks
- [ ] Notifications work
- [ ] ✨ Chat button appears on tasks
- [ ] 🔍 Research button appears on tasks
- [ ] 🎤 Voice button works
- [ ] Internet connection active
- [ ] API keys configured

---

## 🎉 YOU'RE READY!

**Your app is now running with all 4 AI features:**

1. ✨ **Chat with AI** - Ask questions about tasks
2. 🔍 **Research Mode** - Get comprehensive analysis
3. 🎤 **Voice Input** - Create tasks by speaking
4. 💡 **Sub-Task Suggestions** - AI suggests related tasks

**Start testing and enjoy!** 🚀

---

## 📞 NEED HELP?

If you encounter issues:

1. Check terminal for error messages
2. Clear cache: `npx expo start -c`
3. Reinstall dependencies: `rm -rf node_modules && npm install`
4. Check API keys are set correctly
5. Verify internet connection
6. Try on different device/simulator

---

## 🔗 USEFUL LINKS

- Expo Documentation: https://docs.expo.dev
- React Native Documentation: https://reactnative.dev
- Perplexity API: https://docs.perplexity.ai
- OpenAI API: https://platform.openai.com/docs

---

**Happy coding!** 🎯
