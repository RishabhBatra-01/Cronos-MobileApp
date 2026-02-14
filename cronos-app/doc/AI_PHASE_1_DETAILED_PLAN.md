# 🚀 Phase 1: Foundation - Detailed Implementation Plan

**Duration:** 1 week (5-7 days)  
**Goal:** Build core AI infrastructure with ZERO UI changes  
**User Impact:** None (invisible to users)  
**Risk:** 🟢 ZERO (no user-facing changes)

---

## 🎯 WHAT GETS BUILT IN PHASE 1

Phase 1 is all about **infrastructure** - building the foundation that all other AI features will use. Think of it as laying the groundwork before building the house.

### **No UI Changes**
- ❌ No buttons added
- ❌ No modals created
- ❌ No user-facing features
- ✅ Pure backend/service layer

### **What Users See**
- Nothing! App looks and works exactly the same
- All changes are "under the hood"

---

## 📦 FILES TO CREATE (5 NEW FILES)

### **1. PerplexityService.ts**
**Location:** `services/PerplexityService.ts`  
**Purpose:** API integration with Perplexity  
**Size:** ~200 lines

**What It Does:**
```typescript
// Core functions to implement:

1. analyzeTask(task: Task): Promise<TaskAnalysis>
   - Send task to Perplexity
   - Get AI analysis back
   - Parse response

2. chatWithTask(task: Task, message: string, history: ChatMessage[]): Promise<ChatResponse>
   - Multi-turn conversation
   - Context-aware responses
   - Citation extraction

3. researchTask(task: Task): Promise<TaskResearch>
   - Deep analysis
   - Comprehensive information
   - Structured response

4. generateSubTasks(task: Task): Promise<SubTask[]>
   - Analyze task type
   - Generate relevant sub-tasks
   - Return suggestions

5. Error handling & retry logic
   - Network errors
   - Rate limiting
   - Timeout handling
```

**Example Usage (for testing):**
```typescript
// Test in console
const task = { title: "Doctor appointment", description: "Annual checkup" };
const analysis = await analyzeTask(task);
console.log(analysis);
// Output: { taskType: "medical", suggestions: [...], timeEstimate: "1 hour" }
```

---

### **2. AIResponseCache.ts**
**Location:** `services/AIResponseCache.ts`  
**Purpose:** Local caching with MMKV  
**Size:** ~150 lines

**What It Does:**
```typescript
// Core functions to implement:

1. get(key: string): Promise<CachedResponse | null>
   - Check if response exists
   - Check if expired (TTL)
   - Return cached data or null

2. set(key: string, data: any, ttl?: number): Promise<void>
   - Store response in MMKV
   - Set expiration time
   - Handle cache size limits

3. clear(): Promise<void>
   - Clear all cached responses
   - Reset cache

4. getCacheStats(): Promise<CacheStats>
   - Total cached items
   - Cache size
   - Hit rate

5. evictExpired(): Promise<void>
   - Remove expired entries
   - LRU eviction if cache full
```

**Cache Strategy:**
```typescript
// Cache key generation
function generateCacheKey(task: Task, action: string): string {
  const content = `${task.title}|${task.description || ''}|${action}`;
  return hashString(content);
}

// TTL (Time To Live)
const CACHE_TTL = {
  analysis: 7 * 24 * 60 * 60 * 1000,  // 7 days
  research: 7 * 24 * 60 * 60 * 1000,  // 7 days
  chat: 24 * 60 * 60 * 1000,          // 1 day
  subTasks: 7 * 24 * 60 * 60 * 1000   // 7 days
};
```

---

### **3. useFeatureFlagStore.ts**
**Location:** `core/store/useFeatureFlagStore.ts`  
**Purpose:** Feature flag management  
**Size:** ~100 lines

**What It Does:**
```typescript
// Feature flags store (Zustand + MMKV)

interface FeatureFlagState {
  // Master switches
  aiAssistantEnabled: boolean;          // Default: false
  
  // Individual features (Phase 2-8)
  aiConversationalChat: boolean;        // Default: false
  aiVoiceEnhancement: boolean;          // Default: false
  aiProactiveSuggestions: boolean;      // Default: false
  aiRealTimeCards: boolean;             // Default: false
  aiResearchMode: boolean;              // Default: false
  aiSmartSnooze: boolean;               // Default: false
  aiWeeklyPlanning: boolean;            // Default: false
  
  // API Configuration
  perplexityApiKey: string;             // User-provided
  
  // Cache settings
  cacheEnabled: boolean;                // Default: true
  cacheTTLDays: number;                 // Default: 7
  maxCacheSize: number;                 // Default: 100
  
  // Usage limits
  maxRequestsPerMinute: number;         // Default: 10
  maxRequestsPerDay: number;            // Default: 100
  
  // Actions
  setApiKey: (key: string) => void;
  toggleFeature: (feature: string) => void;
  resetToDefaults: () => void;
}
```

**Example Usage:**
```typescript
// In any component
const { aiAssistantEnabled, perplexityApiKey } = useFeatureFlagStore();

if (!aiAssistantEnabled) {
  return null; // Feature disabled
}

// Use API key
const response = await perplexity.analyze(task, perplexityApiKey);
```

---

### **4. AIIntelligenceEngine.ts**
**Location:** `services/AIIntelligenceEngine.ts`  
**Purpose:** Central AI brain (orchestration layer)  
**Size:** ~250 lines

**What It Does:**
```typescript
// High-level AI orchestration

class AIIntelligenceEngine {
  // 1. Smart analysis with caching
  async analyzeTask(task: Task): Promise<TaskAnalysis> {
    // Check cache first
    const cached = await cache.get(cacheKey);
    if (cached) return cached;
    
    // Call Perplexity
    const analysis = await perplexity.analyzeTask(task);
    
    // Cache result
    await cache.set(cacheKey, analysis);
    
    return analysis;
  }
  
  // 2. Conversational chat with history
  async chat(task: Task, message: string, history: ChatMessage[]): Promise<ChatResponse> {
    // Build context from history
    const context = buildContext(task, history);
    
    // Call Perplexity with context
    const response = await perplexity.chatWithTask(task, message, context);
    
    return response;
  }
  
  // 3. Deep research
  async research(task: Task): Promise<TaskResearch> {
    // Check cache
    const cached = await cache.get(researchKey);
    if (cached) return cached;
    
    // Call Perplexity with research prompt
    const research = await perplexity.researchTask(task);
    
    // Cache result
    await cache.set(researchKey, research);
    
    return research;
  }
  
  // 4. Sub-task generation
  async generateSubTasks(task: Task): Promise<SubTask[]> {
    // Detect task type
    const taskType = detectTaskType(task);
    
    // Generate context-aware sub-tasks
    const subTasks = await perplexity.generateSubTasks(task, taskType);
    
    return subTasks;
  }
  
  // 5. Rate limiting
  private async checkRateLimit(): Promise<boolean> {
    // Check requests per minute
    // Check requests per day
    // Return true if allowed
  }
}
```

**Why This Layer?**
- Abstracts Perplexity API details
- Handles caching automatically
- Manages rate limiting
- Provides clean interface for UI components

---

### **5. ai-assistant.ts (Types)**
**Location:** `core/types/ai-assistant.ts`  
**Purpose:** TypeScript interfaces  
**Size:** ~150 lines

**What It Defines:**
```typescript
// All TypeScript types for AI features

// Task Analysis
export interface TaskAnalysis {
  taskType: string;           // "meeting", "shopping", "work", etc.
  summary: string;            // Brief overview
  suggestions: string[];      // Quick tips
  timeEstimate: string;       // "30 minutes", "2 hours"
  complexity: 'low' | 'medium' | 'high';
  citations: Citation[];
}

// Chat
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Citation[];
}

export interface ChatResponse {
  message: string;
  citations: Citation[];
  suggestedFollowUps?: string[];
}

// Research
export interface TaskResearch {
  overview: string;
  keyPoints: string[];
  resources: Resource[];
  checklist: string[];
  estimatedTime: string;
  expertTips: string[];
  citations: Citation[];
}

// Sub-tasks
export interface SubTask {
  title: string;
  description?: string;
  priority?: TaskPriority;
  estimatedTime?: string;
  dueDate?: string;
}

// Citations
export interface Citation {
  title: string;
  url: string;
  source: string;
  snippet?: string;
}

// Cache
export interface CachedResponse {
  data: any;
  cachedAt: string;
  expiresAt: string;
}

export interface CacheStats {
  totalItems: number;
  totalSize: number;
  hitRate: number;
  oldestEntry: string;
}

// API Response (Perplexity)
export interface PerplexityResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  citations?: string[];
}
```

---

## 🔧 FILES TO MODIFY (1 FILE)

### **core/constants.ts**
**Location:** `core/constants.ts`  
**Change:** Add Perplexity API configuration

**What to Add:**
```typescript
// Add to existing constants file

// Perplexity API Configuration
export const PERPLEXITY_API_BASE = 'https://api.perplexity.ai';
export const PERPLEXITY_MODEL = 'llama-3.1-sonar-small-128k-online'; // Fast, cheap, online search
export const PERPLEXITY_API_KEY = ''; // Will be set by user in settings

// AI Feature Configuration
export const AI_CONFIG = {
  CACHE_TTL_DAYS: 7,
  MAX_CACHE_SIZE: 100,
  MAX_REQUESTS_PER_MINUTE: 10,
  MAX_REQUESTS_PER_DAY: 100,
  REQUEST_TIMEOUT_MS: 30000, // 30 seconds
  RETRY_ATTEMPTS: 2,
};
```

**Impact:** Zero (just adding constants)

---

## 🧪 TESTING STRATEGY (Phase 1)

Since there's no UI, we test via console logs and unit tests.

### **Test 1: Perplexity API Connection**
```typescript
// Test file: services/__tests__/PerplexityService.test.ts

test('Should connect to Perplexity API', async () => {
  const task = { title: 'Buy groceries', description: 'Milk, eggs, bread' };
  const analysis = await perplexity.analyzeTask(task);
  
  expect(analysis).toBeDefined();
  expect(analysis.taskType).toBe('shopping');
  expect(analysis.suggestions.length).toBeGreaterThan(0);
});
```

### **Test 2: Cache Hit/Miss**
```typescript
test('Should cache responses', async () => {
  const task = { title: 'Team meeting' };
  
  // First call (cache miss)
  const start1 = Date.now();
  const result1 = await engine.analyzeTask(task);
  const time1 = Date.now() - start1;
  
  // Second call (cache hit)
  const start2 = Date.now();
  const result2 = await engine.analyzeTask(task);
  const time2 = Date.now() - start2;
  
  expect(result1).toEqual(result2);
  expect(time2).toBeLessThan(time1); // Cache should be faster
});
```

### **Test 3: Feature Flags**
```typescript
test('Should respect feature flags', async () => {
  const { aiAssistantEnabled, setFeatureFlag } = useFeatureFlagStore.getState();
  
  // Disable feature
  setFeatureFlag('aiAssistantEnabled', false);
  
  // Should not call API
  const result = await engine.analyzeTask(task);
  expect(result).toBeNull();
});
```

### **Test 4: Rate Limiting**
```typescript
test('Should enforce rate limits', async () => {
  const task = { title: 'Test task' };
  
  // Make 11 requests (limit is 10/minute)
  const promises = Array(11).fill(null).map(() => engine.analyzeTask(task));
  
  const results = await Promise.allSettled(promises);
  const rejected = results.filter(r => r.status === 'rejected');
  
  expect(rejected.length).toBeGreaterThan(0); // At least one should be rate limited
});
```

### **Test 5: Error Handling**
```typescript
test('Should handle API errors gracefully', async () => {
  // Mock API error
  jest.spyOn(perplexity, 'analyzeTask').mockRejectedValue(new Error('API Error'));
  
  const task = { title: 'Test task' };
  
  await expect(engine.analyzeTask(task)).rejects.toThrow('API Error');
});
```

---

## 📊 IMPLEMENTATION CHECKLIST

### **Day 1-2: Core Services**
- [ ] Create `PerplexityService.ts`
  - [ ] Implement `analyzeTask()`
  - [ ] Implement `chatWithTask()`
  - [ ] Implement `researchTask()`
  - [ ] Implement `generateSubTasks()`
  - [ ] Add error handling
  - [ ] Add retry logic
  - [ ] Test with console logs

### **Day 3: Caching**
- [ ] Create `AIResponseCache.ts`
  - [ ] Implement `get()`
  - [ ] Implement `set()`
  - [ ] Implement `clear()`
  - [ ] Implement `getCacheStats()`
  - [ ] Implement `evictExpired()`
  - [ ] Test cache hit/miss

### **Day 4: Feature Flags & Types**
- [ ] Create `useFeatureFlagStore.ts`
  - [ ] Define all feature flags
  - [ ] Add MMKV persistence
  - [ ] Add toggle actions
  - [ ] Test flag changes
- [ ] Create `ai-assistant.ts` (types)
  - [ ] Define all interfaces
  - [ ] Export types

### **Day 5: Intelligence Engine**
- [ ] Create `AIIntelligenceEngine.ts`
  - [ ] Implement `analyzeTask()` with caching
  - [ ] Implement `chat()` with history
  - [ ] Implement `research()` with caching
  - [ ] Implement `generateSubTasks()`
  - [ ] Add rate limiting
  - [ ] Test all functions

### **Day 6-7: Testing & Polish**
- [ ] Write unit tests
- [ ] Test API integration
- [ ] Test caching
- [ ] Test rate limiting
- [ ] Test error handling
- [ ] Document all functions
- [ ] Code review

---

## 🎯 DELIVERABLES (End of Phase 1)

### **What You'll Have:**
1. ✅ Working Perplexity API integration
2. ✅ Smart caching system (MMKV)
3. ✅ Feature flag system
4. ✅ Central AI intelligence engine
5. ✅ Complete TypeScript types
6. ✅ Unit tests
7. ✅ Documentation

### **What You Can Test:**
```typescript
// In React Native debugger console

// Test 1: Analyze a task
const task = { title: 'Doctor appointment', description: 'Annual checkup' };
const analysis = await AIIntelligenceEngine.analyzeTask(task);
console.log(analysis);
// Output: { taskType: 'medical', suggestions: [...], timeEstimate: '1 hour' }

// Test 2: Chat with task
const response = await AIIntelligenceEngine.chat(
  task,
  'What should I bring?',
  []
);
console.log(response.message);
// Output: "For a doctor appointment, you should bring..."

// Test 3: Research task
const research = await AIIntelligenceEngine.research(task);
console.log(research.checklist);
// Output: ["Bring insurance card", "Prepare questions", ...]

// Test 4: Generate sub-tasks
const subTasks = await AIIntelligenceEngine.generateSubTasks(task);
console.log(subTasks);
// Output: [{ title: "Bring insurance card" }, { title: "Check traffic" }, ...]

// Test 5: Check cache stats
const stats = await AIResponseCache.getCacheStats();
console.log(stats);
// Output: { totalItems: 5, hitRate: 0.8, ... }
```

### **What Users See:**
- Nothing! App looks exactly the same
- All changes are backend only

---

## 💰 COST ESTIMATE (Phase 1)

### **Development Time:**
- 5-7 days of implementation
- ~40 hours total

### **API Costs (Testing):**
- ~100 test requests during development
- Cost: ~$0.02 (negligible)

### **No User Impact:**
- Zero API calls from users (no UI yet)
- Zero cost in production

---

## ✅ SUCCESS CRITERIA

Phase 1 is complete when:

1. ✅ All 5 files created and working
2. ✅ Perplexity API integration tested
3. ✅ Caching working (hit/miss)
4. ✅ Feature flags working
5. ✅ Rate limiting working
6. ✅ Error handling working
7. ✅ Unit tests passing
8. ✅ Documentation complete
9. ✅ App still works exactly as before (no regressions)

---

## 🚀 READY TO START PHASE 1?

**What I Need:**
1. ✅ **Perplexity API Key**
   - Sign up at https://www.perplexity.ai/
   - Get API key
   - Share with me

2. ✅ **Confirmation**
   - Confirm you want to start Phase 1
   - Confirm local cache only (no database changes)

**Once you provide the API key, I'll start building immediately!**

---

## 📝 SUMMARY

**Phase 1 in One Sentence:**  
*"Build the AI brain and caching system with zero UI changes - pure infrastructure that future phases will use."*

**Files Created:** 5 new files  
**Files Modified:** 1 file (constants)  
**User Impact:** Zero  
**Risk:** Zero  
**Duration:** 5-7 days  

**Ready to begin?** 🚀
