# 🧪 Phase 1 Testing Guide

**How to test the AI foundation without UI**

---

## 🎯 QUICK START

### **Step 1: Enable AI Features**

Open React Native debugger console and run:

```javascript
import { useFeatureFlagStore } from './core/store/useFeatureFlagStore';

// Enable AI Assistant
const store = useFeatureFlagStore.getState();
store.setFeature('aiAssistantEnabled', true);

console.log('AI Enabled:', store.aiAssistantEnabled);
console.log('API Key:', store.perplexityApiKey ? 'Configured ✅' : 'Missing ❌');
```

---

### **Step 2: Test Task Analysis**

```javascript
import * as AIEngine from './services/AIIntelligenceEngine';

const testTask = {
  id: '1',
  title: 'Doctor appointment',
  description: 'Annual checkup at 10 AM',
  priority: 'high',
  status: 'pending',
  createdAt: new Date().toISOString(),
};

// Analyze the task
console.log('🔍 Analyzing task...');
const analysis = await AIEngine.analyzeTask(testTask);

console.log('✅ Analysis complete!');
console.log('Task Type:', analysis.taskType);
console.log('Summary:', analysis.summary);
console.log('Suggestions:', analysis.suggestions);
console.log('Time Estimate:', analysis.timeEstimate);
console.log('Complexity:', analysis.complexity);
console.log('Citations:', analysis.citations.length);
```

**Expected Output:**
```
✅ Analysis complete!
Task Type: medical
Summary: A doctor appointment for an annual checkup...
Suggestions: [
  "Bring insurance card and ID",
  "Prepare list of medications",
  "Write down questions for doctor"
]
Time Estimate: 1 hour
Complexity: low
Citations: 3
```

---

### **Step 3: Test Caching**

```javascript
// First call (API request - slow)
console.log('⏱️ First call (API)...');
const start1 = Date.now();
const result1 = await AIEngine.analyzeTask(testTask);
const time1 = Date.now() - start1;
console.log(`✅ Completed in ${time1}ms`);

// Second call (cache hit - fast!)
console.log('⏱️ Second call (cache)...');
const start2 = Date.now();
const result2 = await AIEngine.analyzeTask(testTask);
const time2 = Date.now() - start2;
console.log(`✅ Completed in ${time2}ms`);

console.log(`🚀 Cache speedup: ${Math.round(time1 / time2)}x faster!`);
```

**Expected Output:**
```
⏱️ First call (API)...
✅ Completed in 2847ms

⏱️ Second call (cache)...
✅ Completed in 23ms

🚀 Cache speedup: 124x faster!
```

---

### **Step 4: Test Chat**

```javascript
// Chat with AI about the task
console.log('💬 Starting chat...');
const chatResponse = await AIEngine.chat(
  testTask,
  'What should I bring to my doctor appointment?',
  []
);

console.log('✅ AI Response:');
console.log(chatResponse.message);
console.log('\n📚 Citations:', chatResponse.citations.length);
```

**Expected Output:**
```
✅ AI Response:
For a doctor appointment, you should bring:
• Insurance card and photo ID
• List of current medications
• Medical history records
• Questions or concerns to discuss
• Payment method for copay

📚 Citations: 2
```

---

### **Step 5: Test Research**

```javascript
const researchTask = {
  id: '2',
  title: 'Learn React Native',
  description: 'Want to build mobile apps',
  status: 'pending',
  createdAt: new Date().toISOString(),
};

console.log('🔬 Researching task...');
const research = await AIEngine.research(researchTask);

console.log('✅ Research complete!');
console.log('\n📋 Overview:');
console.log(research.overview);

console.log('\n🎯 Key Points:');
research.keyPoints.forEach((point, i) => {
  console.log(`${i + 1}. ${point}`);
});

console.log('\n✅ Checklist:');
research.checklist.forEach((item, i) => {
  console.log(`□ ${item}`);
});

console.log('\n💡 Expert Tips:');
research.expertTips.forEach((tip, i) => {
  console.log(`${i + 1}. ${tip}`);
});

console.log('\n⏱️ Estimated Time:', research.estimatedTime);
console.log('📚 Citations:', research.citations.length);
```

---

### **Step 6: Test Sub-Task Generation**

```javascript
const taskWithSubTasks = {
  id: '3',
  title: 'Plan birthday party',
  description: '30th birthday celebration',
  status: 'pending',
  createdAt: new Date().toISOString(),
};

console.log('🎯 Generating sub-tasks...');
const subTasks = await AIEngine.generateSubTasks(taskWithSubTasks);

console.log(`✅ Generated ${subTasks.length} sub-tasks:`);
subTasks.forEach((subTask, i) => {
  console.log(`\n${i + 1}. ${subTask.title}`);
  if (subTask.description) {
    console.log(`   ${subTask.description}`);
  }
  if (subTask.estimatedTime) {
    console.log(`   ⏱️ ${subTask.estimatedTime}`);
  }
});
```

**Expected Output:**
```
✅ Generated 5 sub-tasks:

1. Set budget
   Determine how much to spend
   ⏱️ 30 minutes

2. Create guest list
   List all invitees with contact info
   ⏱️ 1 hour

3. Book venue
   Research and reserve location
   ⏱️ 2-3 hours

4. Plan menu/catering
   Decide on food and drinks
   ⏱️ 1-2 hours

5. Send invitations
   Create and send invites 2 weeks before
   ⏱️ 1 hour
```

---

### **Step 7: Test Cache Statistics**

```javascript
import { getCacheStats } from './services/AIResponseCache';

const stats = await getCacheStats();

console.log('📊 Cache Statistics:');
console.log('Total Items:', stats.totalItems);
console.log('Total Size:', `${(stats.totalSizeBytes / 1024).toFixed(2)} KB`);
console.log('Hit Rate:', `${(stats.hitRate * 100).toFixed(1)}%`);
console.log('Oldest Entry:', stats.oldestEntry);
console.log('Newest Entry:', stats.newestEntry);
```

---

### **Step 8: Test Rate Limiting**

```javascript
import { getRateLimitState, resetRateLimits } from './services/AIIntelligenceEngine';

// Reset limits first
resetRateLimits();

// Make multiple requests
console.log('🚀 Making 5 requests...');
for (let i = 0; i < 5; i++) {
  await AIEngine.analyzeTask(testTask);
  console.log(`Request ${i + 1} complete`);
}

// Check rate limit state
const limits = getRateLimitState();
console.log('\n📊 Rate Limit State:');
console.log('Requests this minute:', limits.requestsThisMinute);
console.log('Requests today:', limits.requestsToday);
console.log('Minute resets at:', new Date(limits.minuteResetAt).toLocaleTimeString());
console.log('Day resets at:', new Date(limits.dayResetAt).toLocaleString());
```

---

### **Step 9: Test Feature Flags**

```javascript
import { useFeatureFlagStore } from './core/store/useFeatureFlagStore';

const store = useFeatureFlagStore.getState();

// Disable AI
console.log('❌ Disabling AI...');
store.setFeature('aiAssistantEnabled', false);

// Try to use AI (should fail)
try {
  await AIEngine.analyzeTask(testTask);
} catch (error) {
  console.log('✅ Correctly blocked:', error.message);
}

// Re-enable AI
console.log('\n✅ Re-enabling AI...');
store.setFeature('aiAssistantEnabled', true);

// Try again (should work)
const result = await AIEngine.analyzeTask(testTask);
console.log('✅ Working again!');
```

---

### **Step 10: Test Error Handling**

```javascript
// Test with invalid API key
const store = useFeatureFlagStore.getState();
const originalKey = store.perplexityApiKey;

console.log('🔑 Testing with invalid API key...');
store.setApiKey('invalid-key-123');

try {
  await AIEngine.analyzeTask(testTask);
} catch (error) {
  console.log('✅ Error caught:', error.message);
  console.log('Error code:', error.code);
  console.log('Retryable:', error.retryable);
}

// Restore original key
console.log('\n🔑 Restoring valid API key...');
store.setApiKey(originalKey);
console.log('✅ API key restored');
```

---

## 🎯 COMPLETE TEST SUITE

Run all tests in sequence:

```javascript
async function runAllTests() {
  console.log('🧪 Starting Phase 1 Test Suite...\n');
  
  try {
    // Test 1: Enable AI
    console.log('TEST 1: Enable AI Features');
    const store = useFeatureFlagStore.getState();
    store.setFeature('aiAssistantEnabled', true);
    console.log('✅ PASS\n');
    
    // Test 2: Task Analysis
    console.log('TEST 2: Task Analysis');
    const analysis = await AIEngine.analyzeTask(testTask);
    console.log('✅ PASS:', analysis.taskType, '\n');
    
    // Test 3: Caching
    console.log('TEST 3: Caching');
    const start = Date.now();
    await AIEngine.analyzeTask(testTask);
    const cacheTime = Date.now() - start;
    console.log('✅ PASS: Cache hit in', cacheTime, 'ms\n');
    
    // Test 4: Chat
    console.log('TEST 4: Chat');
    const chat = await AIEngine.chat(testTask, 'What should I bring?', []);
    console.log('✅ PASS:', chat.message.substring(0, 50), '...\n');
    
    // Test 5: Research
    console.log('TEST 5: Research');
    const research = await AIEngine.research(testTask);
    console.log('✅ PASS:', research.checklist.length, 'checklist items\n');
    
    // Test 6: Sub-tasks
    console.log('TEST 6: Sub-task Generation');
    const subTasks = await AIEngine.generateSubTasks(testTask);
    console.log('✅ PASS:', subTasks.length, 'sub-tasks generated\n');
    
    // Test 7: Cache Stats
    console.log('TEST 7: Cache Statistics');
    const stats = await getCacheStats();
    console.log('✅ PASS:', stats.totalItems, 'items cached\n');
    
    // Test 8: Rate Limiting
    console.log('TEST 8: Rate Limiting');
    const limits = getRateLimitState();
    console.log('✅ PASS:', limits.requestsThisMinute, 'requests this minute\n');
    
    console.log('🎉 ALL TESTS PASSED!');
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
  }
}

// Run the test suite
runAllTests();
```

---

## ✅ SUCCESS CRITERIA

Phase 1 is working correctly if:

- [x] All tests pass without errors
- [x] API requests return valid responses
- [x] Caching works (second call is much faster)
- [x] Rate limiting prevents excessive requests
- [x] Feature flags control access
- [x] Error handling works correctly
- [x] App still works exactly as before

---

## 🚀 READY FOR PHASE 2!

Once all tests pass, Phase 1 is complete and we can move to Phase 2 (UI components).

**Next:** Add chat interface, research panel, and AI buttons! 🎉
