# 🤖 Dynamic AI Assistant Architecture - Perplexity Integration

**Feature:** Contextual AI help for ANY task using Perplexity API  
**Status:** Architecture & Planning Phase  
**Date:** February 5, 2026

---

## 📋 EXECUTIVE SUMMARY

### Goal
Add a dynamic AI assistant that analyzes task content and provides contextual help automatically - research, checklists, preparation tips, etc. - without hardcoded use cases.

### Core Principles
1. **Zero Breaking Changes** - Existing flows untouched
2. **Offline-First** - Cache responses locally
3. **Feature Flag Controlled** - Easy enable/disable
4. **Smart Caching** - Minimize API calls
5. **Performance First** - No impact on app speed

---

## 🏗️ HIGH-LEVEL ARCHITECTURE

### Architecture Pattern: **Lazy-Loaded Optional Enhancement**

```
┌─────────────────────────────────────────────────────────────┐
│                    EXISTING APP (UNTOUCHED)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ AddTaskModal │  │ EditTaskModal│  │ TaskItem         │ │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘ │
│         │                 │                    │            │
│         └─────────────────┼────────────────────┘            │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │ INJECTION POINT│
                    │ (Feature Flag) │
                    └───────┬────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              NEW: AI ASSISTANT LAYER (OPTIONAL)             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ AIAssistantButton.tsx (NEW)                          │  │
│  │ • Sparkle icon button                                │  │
│  │ • Only shows if feature enabled                      │  │
│  │ • Triggers AI analysis on tap                        │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                   │
│  ┌──────────────────────▼───────────────────────────────┐  │
│  │ AIAssistantModal.tsx (NEW)                           │  │
│  │ • Full-screen modal with AI response                 │  │
│  │ • Loading states, error handling                     │  │
│  │ • Copy to clipboard, share options                   │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                   │
│  ┌──────────────────────▼───────────────────────────────┐  │
│  │ PerplexityService.ts (NEW)                           │  │
│  │ • analyzeTask(task): Promise<AIResponse>             │  │
│  │ • Smart prompt generation                            │  │
│  │ • Response parsing & formatting                      │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                   │
│  ┌──────────────────────▼───────────────────────────────┐  │
│  │ AIResponseCache.ts (NEW)                             │  │
│  │ • MMKV-based local cache                             │  │
│  │ • TTL: 7 days (configurable)                         │  │
│  │ • Cache key: hash(task.title + task.description)     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ useAIAssistant.ts (NEW)                              │  │
│  │ • Custom hook for AI state management                │  │
│  │ • Loading, error, success states                     │  │
│  │ • Cache-first strategy                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                  FEATURE FLAG STORE (NEW)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ useFeatureFlagStore.ts (NEW)                         │  │
│  │ • aiAssistantEnabled: boolean                        │  │
│  │ • perplexityApiKey: string                           │  │
│  │ • cacheEnabled: boolean                              │  │
│  │ • cacheTTL: number (days)                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ DATABASE SCHEMA CHANGES

### Option 1: No Database Changes (Recommended)
**Rationale:** AI responses are ephemeral, cache-only data. No need for sync.


**Pros:**
- Zero migration needed
- No sync complexity
- Faster implementation
- Cache invalidation is simple (just clear MMKV)

**Cons:**
- AI responses don't sync across devices
- User must re-request on each device

### Option 2: Add Optional Database Table (Future Enhancement)
```sql
CREATE TABLE ai_responses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  task_id UUID REFERENCES tasks(id),
  task_hash TEXT NOT NULL,  -- hash(title + description)
  prompt TEXT NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  UNIQUE(user_id, task_hash)
);

CREATE INDEX idx_ai_responses_user_hash ON ai_responses(user_id, task_hash);
CREATE INDEX idx_ai_responses_expires ON ai_responses(expires_at);
```

**Pros:**
- Responses sync across devices
- Persistent history
- Analytics potential

**Cons:**
- Migration required
- Sync complexity
- Storage costs

**Recommendation:** Start with Option 1, add Option 2 if users request cross-device AI history.

---

## 🔌 SAFE INJECTION POINTS

### 1. TaskItem Component (View Mode)
**File:** `components/ui/TaskItem.tsx`  
**Location:** After task title, before due date  
**Risk:** 🟢 LOW

```typescript
// INJECTION POINT 1: TaskItem.tsx (line ~45, after title)
<View className="flex-row items-center gap-2">
  <Text className="text-base font-medium">{task.title}</Text>
  
  {/* NEW: AI Assistant Button (only if feature enabled) */}
  {featureFlags.aiAssistantEnabled && (
    <AIAssistantButton task={task} size="small" />
  )}
</View>
```

**Why Safe:**
- Purely additive (no existing code modified)
- Conditional rendering (no impact when disabled)
- No state changes to task
- No interference with existing tap handlers

---

### 2. AddTaskModal (Creation Mode)
**File:** `components/AddTaskModal.tsx`  
**Location:** After "Create" button, as separate action  
**Risk:** 🟢 LOW

```typescript
// INJECTION POINT 2: AddTaskModal.tsx (line ~180, after Create button)
<View className="flex-row items-center justify-between pb-4">
  <TouchableOpacity onPress={handleDatePress}>
    {/* Existing date picker */}
  </TouchableOpacity>

  <View className="flex-row gap-2">
    {/* NEW: AI Help Button (only if title entered) */}
    {featureFlags.aiAssistantEnabled && title.trim() && (
      <AIAssistantButton 
        task={{ title, description, priority }} 
        onSuggestionApply={(suggestion) => {
          // Optional: Apply AI suggestions to form
          if (suggestion.description) setDescription(suggestion.description);
        }}
      />
    )}
    
    <TouchableOpacity onPress={handleSubmit}>
      {/* Existing Create button */}
    </TouchableOpacity>
  </View>
</View>
```

**Why Safe:**
- Separate button (doesn't modify Create flow)
- Only shows when title exists
- Optional suggestion application
- No blocking behavior

---

### 3. EditTaskModal (Edit Mode)
**File:** `components/EditTaskModal.tsx`  
**Location:** Same as AddTaskModal  
**Risk:** 🟢 LOW

```typescript
// INJECTION POINT 3: EditTaskModal.tsx (line ~200, after Save button)
// Same pattern as AddTaskModal
```

**Why Safe:**
- Identical pattern to AddTaskModal
- No modification to save flow
- Purely optional enhancement

---

### 4. Settings Screen (Future)
**File:** `app/settings.tsx` (NEW)  
**Location:** New screen for feature flags  
**Risk:** 🟢 ZERO (new screen)

```typescript
// INJECTION POINT 4: New Settings Screen
<View>
  <Switch 
    value={featureFlags.aiAssistantEnabled}
    onValueChange={toggleAIAssistant}
  />
  <TextInput 
    placeholder="Perplexity API Key"
    value={featureFlags.perplexityApiKey}
    onChangeText={setPerplexityApiKey}
    secureTextEntry
  />
</View>
```

**Why Safe:**
- Completely new screen
- No impact on existing flows
- User-controlled feature toggle

---

## ⚠️ RISK ASSESSMENT

### Integration Point 1: TaskItem Component
**Risk Level:** 🟢 LOW  
**Potential Issues:**
- Layout shift if button too large
- Performance if many tasks render simultaneously

**Mitigation:**
- Small icon button (24x24px)
- Lazy render (only visible tasks)
- Memoize component with React.memo()

**Rollback Strategy:**
- Remove `<AIAssistantButton />` line
- Feature flag to false

---

### Integration Point 2: AddTaskModal
**Risk Level:** 🟢 LOW  
**Potential Issues:**
- Modal stacking (AI modal over task modal)
- Form state confusion if AI suggestions applied

**Mitigation:**
- Close task modal before opening AI modal
- Clear "apply suggestion" UX
- Confirmation before applying suggestions

**Rollback Strategy:**
- Remove AI button from modal
- Feature flag to false

---

### Integration Point 3: EditTaskModal
**Risk Level:** 🟢 LOW  
**Potential Issues:**
- Same as AddTaskModal

**Mitigation:**
- Same as AddTaskModal

**Rollback Strategy:**
- Same as AddTaskModal

---

### Integration Point 4: API Rate Limiting
**Risk Level:** 🟡 MEDIUM  
**Potential Issues:**
- Perplexity API rate limits (depends on plan)
- Cost overruns if users spam requests
- Network errors in poor connectivity

**Mitigation:**
- **Cache-first strategy** (check cache before API)
- **Debounce requests** (500ms delay)
- **Request throttling** (max 10 requests/minute per user)
- **Offline detection** (don't attempt if offline)
- **Error handling** (graceful fallback messages)
- **Cost monitoring** (log API usage)

**Rollback Strategy:**
- Disable feature flag
- Cache remains functional

---

### Integration Point 5: Performance Impact
**Risk Level:** 🟢 LOW  
**Potential Issues:**
- MMKV cache reads on every task render
- Large cached responses slow down app

**Mitigation:**
- **Lazy loading** (only load when button tapped)
- **Cache size limit** (max 100 responses, LRU eviction)
- **Response size limit** (max 5KB per response)
- **Background processing** (cache operations off main thread)

**Rollback Strategy:**
- Clear cache
- Disable feature

---

## 📦 NEW COMPONENTS & FILES

### Components (6 new files)
```
components/
├── AIAssistantButton.tsx       # Sparkle icon button
├── AIAssistantModal.tsx        # Full-screen AI response modal
└── AIAssistantSettings.tsx     # Settings UI for API key, etc.
```

### Services (2 new files)
```
services/
├── PerplexityService.ts        # API integration
└── AIResponseCache.ts          # MMKV cache layer
```

### Hooks (1 new file)
```
hooks/
└── use-ai-assistant.ts         # State management hook
```

### Store (1 new file)
```
core/store/
└── useFeatureFlagStore.ts      # Feature flags + API key
```

### Types (1 new file)
```
core/types/
└── ai-assistant.ts             # TypeScript interfaces
```

### Constants (update existing)
```
core/constants.ts               # Add PERPLEXITY_API_BASE
```

**Total:** 9 new files, 1 modified file

---

## 🔄 CACHING STRATEGY

### Cache Key Generation
```typescript
function generateCacheKey(task: Task): string {
  const content = `${task.title}|${task.description || ''}|${task.priority || 'medium'}`;
  return hashString(content); // Simple hash function
}
```

### Cache Flow
```
1. User taps AI button
2. Generate cache key from task content
3. Check MMKV cache
   ├─ HIT: Return cached response (instant)
   └─ MISS: Call Perplexity API
       ├─ SUCCESS: Cache response + return
       └─ ERROR: Show error message
```

### Cache Invalidation
- **TTL:** 7 days (configurable)
- **Manual:** Clear cache button in settings
- **Automatic:** LRU eviction when cache > 100 entries
- **On Edit:** If task title/description changes significantly (>30% diff)

### Cache Storage
```typescript
// MMKV storage structure
{
  "ai_cache_<hash>": {
    "response": { /* AI response */ },
    "createdAt": "2026-02-05T10:00:00Z",
    "expiresAt": "2026-02-12T10:00:00Z"
  }
}
```

---

## 🎯 PERPLEXITY API INTEGRATION

### API Endpoint
```
POST https://api.perplexity.ai/chat/completions
```

### Request Format
```typescript
{
  "model": "llama-3.1-sonar-small-128k-online", // Fast, cheap, online search
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful task assistant..."
    },
    {
      "role": "user",
      "content": "Analyze this task: [TASK_DETAILS]"
    }
  ],
  "temperature": 0.2,
  "max_tokens": 1000
}
```

### Dynamic Prompt Generation
```typescript
function generatePrompt(task: Task): string {
  const basePrompt = `Analyze this task and provide helpful context:

Task: ${task.title}
${task.description ? `Details: ${task.description}` : ''}
Priority: ${task.priority || 'medium'}
${task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleString()}` : ''}

Provide:
1. Task type classification (meeting, shopping, work, personal, etc.)
2. Relevant research or information
3. Preparation checklist (if applicable)
4. Time estimates
5. Pro tips

Keep response concise (max 500 words).`;

  return basePrompt;
}
```

### Response Parsing
```typescript
interface AIResponse {
  taskType: string;           // "meeting", "shopping", "work", etc.
  research: string;           // Relevant information
  checklist: string[];        // Preparation steps
  timeEstimate: string;       // "30 minutes", "2 hours", etc.
  tips: string[];             // Pro tips
  rawResponse: string;        // Full AI response
}
```

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Foundation (Day 1)
**Goal:** Core infrastructure without UI

**Tasks:**
1. Create `useFeatureFlagStore.ts` with MMKV persistence
2. Create `AIResponseCache.ts` with TTL logic
3. Create `PerplexityService.ts` with API integration
4. Create `use-ai-assistant.ts` hook
5. Add feature flag to constants

**Deliverable:** Working API integration + caching (testable via console)

**Risk:** 🟢 ZERO (no UI changes)

---

### Phase 2: UI Components (Day 2)
**Goal:** Build AI assistant UI

**Tasks:**
1. Create `AIAssistantButton.tsx` (sparkle icon)
2. Create `AIAssistantModal.tsx` (response display)
3. Create `AIAssistantSettings.tsx` (API key input)
4. Add loading/error states
5. Add copy/share functionality

**Deliverable:** Standalone AI components (not integrated yet)

**Risk:** 🟢 ZERO (components not injected)

---

### Phase 3: Safe Integration (Day 3)
**Goal:** Inject AI buttons into existing screens

**Tasks:**
1. Add AI button to `TaskItem.tsx` (conditional render)
2. Add AI button to `AddTaskModal.tsx` (conditional render)
3. Add AI button to `EditTaskModal.tsx` (conditional render)
4. Add settings screen link
5. Test feature flag toggle

**Deliverable:** Fully integrated AI assistant (feature flag OFF by default)

**Risk:** 🟢 LOW (conditional rendering, easy rollback)

---

### Phase 4: Polish & Testing (Day 4)
**Goal:** Production-ready

**Tasks:**
1. Add analytics (track API usage)
2. Add error boundaries
3. Add offline detection
4. Add rate limiting
5. Performance testing (100+ tasks)
6. Cache eviction testing
7. API error handling testing

**Deliverable:** Production-ready feature

**Risk:** 🟢 LOW (testing phase)

---

## 📊 PERFORMANCE BENCHMARKS

### Target Metrics
- **Button render:** < 16ms (60fps)
- **Cache lookup:** < 10ms
- **API response:** < 3s (Perplexity is fast)
- **Modal open:** < 100ms
- **Memory overhead:** < 5MB (cache + components)

### Monitoring
```typescript
// Add performance logging
console.time('ai_cache_lookup');
const cached = await cache.get(key);
console.timeEnd('ai_cache_lookup');

console.time('ai_api_request');
const response = await perplexity.analyze(task);
console.timeEnd('ai_api_request');
```

---

## 🔒 SECURITY CONSIDERATIONS

### API Key Storage
- Store in MMKV (encrypted on iOS, secure on Android)
- Never log API key
- Never sync API key to Supabase
- User-provided (not hardcoded)

### Data Privacy
- Task data sent to Perplexity API (user consent required)
- No PII in prompts (sanitize task titles/descriptions)
- Cache stored locally only (no cloud sync)
- Clear cache on logout

### Rate Limiting
- Max 10 requests/minute per user
- Max 100 requests/day per user (configurable)
- Exponential backoff on errors

---

## 🎛️ FEATURE FLAG CONFIGURATION

### Default Settings
```typescript
{
  aiAssistantEnabled: false,        // OFF by default
  perplexityApiKey: '',             // User must provide
  cacheEnabled: true,               // Cache always on
  cacheTTL: 7,                      // 7 days
  maxCacheSize: 100,                // 100 responses
  maxRequestsPerMinute: 10,
  maxRequestsPerDay: 100,
  offlineMode: true,                // Work offline with cache
}
```

### User Controls (Settings Screen)
- Toggle AI Assistant ON/OFF
- Enter Perplexity API Key
- Clear cache button
- View cache size
- View API usage stats

---

## 🧪 TESTING STRATEGY

### Unit Tests
- `PerplexityService.ts`: API request/response parsing
- `AIResponseCache.ts`: Cache CRUD operations, TTL, eviction
- `use-ai-assistant.ts`: Hook state management

### Integration Tests
- Cache-first flow (hit/miss scenarios)
- API error handling (network errors, rate limits)
- Feature flag toggle (enable/disable)

### Manual Testing Checklist
- [ ] AI button appears when feature enabled
- [ ] AI button hidden when feature disabled
- [ ] Cache hit returns instant response
- [ ] Cache miss calls API
- [ ] API errors show user-friendly message
- [ ] Offline mode works with cache
- [ ] Modal opens/closes smoothly
- [ ] Copy/share functionality works
- [ ] Settings screen saves API key
- [ ] Clear cache button works
- [ ] No impact on existing task flows
- [ ] Performance: 100+ tasks with AI buttons

---

## 📈 SUCCESS METRICS

### Technical Metrics
- Zero crashes related to AI feature
- < 5% increase in app bundle size
- < 10ms cache lookup time
- > 90% cache hit rate (after warmup)
- Zero impact on existing task CRUD performance

### User Metrics (Future)
- % of users who enable AI assistant
- Average AI requests per user per day
- Cache hit rate
- API error rate
- User feedback (in-app survey)

---

## 🚨 ROLLBACK PLAN

### Immediate Rollback (< 1 minute)
```typescript
// In useFeatureFlagStore.ts
export const EMERGENCY_KILL_SWITCH = false; // Set to true to disable

// In AIAssistantButton.tsx
if (EMERGENCY_KILL_SWITCH) return null;
```

### Graceful Rollback (< 5 minutes)
1. Set feature flag to `false` in store
2. Push app update (if needed)
3. Clear cache on all devices (optional)

### Complete Removal (< 1 hour)
1. Remove AI button from TaskItem.tsx
2. Remove AI button from AddTaskModal.tsx
3. Remove AI button from EditTaskModal.tsx
4. Remove AI components (keep services for future)
5. Deploy update

---

## 💰 COST ESTIMATION

### Perplexity API Pricing (as of Feb 2026)
- **Model:** llama-3.1-sonar-small-128k-online
- **Cost:** ~$0.20 per 1M tokens
- **Avg Request:** ~500 tokens (prompt + response)
- **Cost per Request:** ~$0.0001 (negligible)

### Monthly Cost Estimate
- **100 users:** 10 requests/day = 1,000 requests/day = 30,000/month
- **Cost:** 30,000 × $0.0001 = **$3/month**
- **With 90% cache hit rate:** **$0.30/month**

**Conclusion:** Extremely cost-effective with caching.

---

## 🎯 NEXT STEPS

### Before Implementation
1. ✅ Review this architecture document
2. ⏳ Get Perplexity API key (free tier available)
3. ⏳ Decide on database schema (Option 1 vs Option 2)
4. ⏳ Approve injection points
5. ⏳ Set success metrics

### Implementation Order
1. Phase 1: Foundation (Day 1)
2. Phase 2: UI Components (Day 2)
3. Phase 3: Safe Integration (Day 3)
4. Phase 4: Polish & Testing (Day 4)

### Post-Launch
1. Monitor API usage and costs
2. Collect user feedback
3. Iterate on prompt engineering
4. Consider adding more AI features (task suggestions, smart scheduling, etc.)

---

## 📚 REFERENCES

### Perplexity API Docs
- https://docs.perplexity.ai/

### Similar Implementations
- Notion AI (contextual help)
- Todoist AI Assistant
- ClickUp AI

### Code Patterns
- Feature flags: https://martinfowler.com/articles/feature-toggles.html
- Cache strategies: https://web.dev/cache-api-quick-guide/

---

## ✅ APPROVAL CHECKLIST

- [ ] Architecture reviewed and approved
- [ ] Database schema decision made
- [ ] Injection points approved
- [ ] Risk assessment acceptable
- [ ] Performance targets agreed
- [ ] Cost estimation acceptable
- [ ] Rollback plan understood
- [ ] Ready to implement

---

**Status:** ⏳ AWAITING APPROVAL  
**Next Action:** Review and approve architecture, then proceed to Phase 1 implementation

