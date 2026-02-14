# 🔍 Phase 3: Research Mode - Detailed Implementation Plan

**Date:** February 6, 2026  
**Status:** Planning Phase  
**Duration:** 3-4 days  
**Risk:** 🟢 LOW (additive feature, no breaking changes)

---

## 🎯 GOAL

Add a comprehensive research mode that provides deep analysis, checklists, resources, and expert tips for any task.

**User Flow:**
```
Task Detail Screen
    ↓
Tap "🔍 Research" button
    ↓
Full-screen Research Panel opens
    ↓
Shows: Overview, Checklist, Resources, Expert Tips
    ↓
User can save findings to task notes
```

---

## 📊 WHAT GETS BUILT

### **1 New Component:**
- `components/AIResearchPanel.tsx` (~500 lines)

### **1 New Hook:**
- `hooks/use-task-research.ts` (~150 lines)

### **1 Service Enhancement:**
- `services/AIIntelligenceEngine.ts` (add `researchTask` method)

### **2 Files Modified:**
- `components/ui/TaskItem.tsx` (+5 lines) - Add research button
- `components/EditTaskModal.tsx` (+5 lines) - Add research button

**Total:** ~650 lines of new code, ~10 lines of changes

---

## 🏗️ ARCHITECTURE

### Data Flow

```
User taps "🔍 Research"
    ↓
use-task-research hook
    ↓
AIIntelligenceEngine.researchTask()
    ↓
Check cache (7-day TTL)
    ↓
If miss: PerplexityService.researchTask()
    ↓
Parse response into structured data
    ↓
Cache result
    ↓
Return to UI
    ↓
AIResearchPanel displays results
```

### Data Structure

```typescript
interface TaskResearch {
  taskId: string;
  overview: string;
  keyPoints: string[];
  checklist: ChecklistItem[];
  resources: Resource[];
  expertTips: string[];
  estimatedTime?: string;
  citations: Citation[];
  generatedAt: string;
  expiresAt: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  category?: string;
  priority?: 'high' | 'medium' | 'low';
}

interface Resource {
  id: string;
  title: string;
  url: string;
  type: 'article' | 'video' | 'tool' | 'guide';
  description?: string;
}
```

---

## 📝 IMPLEMENTATION DETAILS

### File 1: `hooks/use-task-research.ts`

**Purpose:** Manage research state and API calls

**Key Functions:**
```typescript
export function useTaskResearch(taskId: string) {
  const [research, setResearch] = useState<TaskResearch | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load research (from cache or API)
  const loadResearch = async () => {
    // Check cache first
    // If miss, call AIIntelligenceEngine.researchTask()
    // Handle errors
  };
  
  // Save research findings to task notes
  const saveToNotes = async (section: 'all' | 'overview' | 'checklist' | 'tips') => {
    // Format selected section
    // Append to task notes
    // Show success toast
  };
  
  // Refresh research (bypass cache)
  const refreshResearch = async () => {
    // Clear cache
    // Reload research
  };
  
  return {
    research,
    isLoading,
    error,
    loadResearch,
    saveToNotes,
    refreshResearch,
  };
}
```

**State Management:**
- Local state (no Zustand needed - research is ephemeral)
- Cache via AIResponseCache (7-day TTL)
- No persistence needed

---

### File 2: `components/AIResearchPanel.tsx`

**Purpose:** Full-screen research UI with tabs

**UI Structure:**
```
┌─────────────────────────────────────┐
│  🔍 Research: [Task Title]    [X]   │
├─────────────────────────────────────┤
│  [Overview] [Checklist] [Resources] │
│  [Tips]                             │
├─────────────────────────────────────┤
│                                     │
│  📋 OVERVIEW                        │
│  React Native is a framework for... │
│                                     │
│  🎯 KEY POINTS                      │
│  • Cross-platform development       │
│  • JavaScript + Native components   │
│  • Hot reload for fast iteration    │
│                                     │
│  ⏱️ ESTIMATED TIME: 2-3 weeks       │
│                                     │
│  📚 SOURCES (3)                     │
│  [View Citations]                   │
│                                     │
│  [Save to Notes] [Refresh]          │
│                                     │
└─────────────────────────────────────┘
```

**Tabs:**

1. **Overview Tab:**
   - Summary paragraph
   - Key points (bullets)
   - Estimated time
   - Citations

2. **Checklist Tab:**
   ```
   ✅ GETTING STARTED
   □ Install Node.js and npm
   □ Install Expo CLI
   □ Create new project
   
   ✅ CORE CONCEPTS
   □ Learn JSX syntax
   □ Understand components
   □ Master state management
   ```

3. **Resources Tab:**
   ```
   📄 ARTICLES
   • Official React Native Docs [→]
   • Getting Started Guide [→]
   
   🎥 VIDEOS
   • React Native Crash Course [→]
   
   🛠️ TOOLS
   • Expo Snack (online editor) [→]
   ```

4. **Tips Tab:**
   ```
   💡 EXPERT TIPS
   
   1. Start with Expo
      Use Expo for easier setup and faster
      development. You can always eject later.
   
   2. Build Real Projects
      Don't just follow tutorials. Build
      something you actually want to use.
   
   3. Join the Community
      React Native has a huge community.
      Join Discord, follow Twitter accounts.
   ```

**Key Features:**
- Tabbed navigation
- Scrollable content
- Save entire research or specific sections
- Refresh button (bypass cache)
- Loading skeleton
- Error state with retry
- Citations modal
- Haptic feedback

---

### File 3: `services/AIIntelligenceEngine.ts` (Enhancement)

**Add Method:**
```typescript
/**
 * Research a task comprehensively
 * Returns structured analysis with checklist, resources, tips
 */
async researchTask(task: Task): Promise<TaskResearch> {
  console.log('[AIEngine] Researching task:', task.title);
  
  // Check cache first
  const cacheKey = `research:${task.id}`;
  const cached = this.cache.get<TaskResearch>(cacheKey);
  if (cached) {
    console.log('[AIEngine] Research cache hit');
    return cached;
  }
  
  // Check rate limits
  if (!this.canMakeRequest()) {
    throw new Error('Rate limit exceeded');
  }
  
  // Call Perplexity
  const result = await this.perplexity.researchTask(task);
  
  // Parse and structure response
  const research: TaskResearch = {
    taskId: task.id,
    overview: result.overview,
    keyPoints: result.keyPoints,
    checklist: this.parseChecklist(result.checklist),
    resources: this.parseResources(result.resources),
    expertTips: result.expertTips,
    estimatedTime: result.estimatedTime,
    citations: result.citations,
    generatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
  
  // Cache for 7 days
  this.cache.set(cacheKey, research, 7);
  
  return research;
}

/**
 * Parse checklist from AI response
 */
private parseChecklist(text: string): ChecklistItem[] {
  // Parse markdown-style checklist
  // - [ ] Item 1
  // - [ ] Item 2
  // Group by categories if present
}

/**
 * Parse resources from AI response
 */
private parseResources(text: string): Resource[] {
  // Extract URLs and titles
  // Classify by type (article, video, tool)
}
```

---

### File 4: `services/PerplexityService.ts` (Enhancement)

**Add Method:**
```typescript
/**
 * Research a task comprehensively
 */
async researchTask(task: Task): Promise<any> {
  const prompt = `Comprehensive research for task: "${task.title}"

Please provide:

1. OVERVIEW (2-3 sentences)
   Brief explanation of what this task involves

2. KEY POINTS (5-7 bullets)
   Most important things to know

3. CHECKLIST (10-15 items)
   Step-by-step checklist to complete this task
   Group by categories if applicable
   Format: - [ ] Item text

4. RESOURCES (5-10 items)
   Recommended articles, videos, tools with URLs
   Format: [Title](URL) - Brief description

5. EXPERT TIPS (3-5 tips)
   Practical advice from experts
   Format: **Tip Title**: Explanation

6. ESTIMATED TIME
   How long this typically takes

Include citations for all information.`;

  const response = await this.makeRequest({
    model: 'sonar-pro',
    messages: [
      {
        role: 'system',
        content: 'You are a research assistant providing comprehensive, structured information about tasks. Always include citations.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.2, // Lower for more factual responses
    max_tokens: 4000, // Longer for comprehensive research
  });

  return {
    overview: this.extractSection(response.content, 'OVERVIEW'),
    keyPoints: this.extractBullets(response.content, 'KEY POINTS'),
    checklist: this.extractSection(response.content, 'CHECKLIST'),
    resources: this.extractSection(response.content, 'RESOURCES'),
    expertTips: this.extractTips(response.content, 'EXPERT TIPS'),
    estimatedTime: this.extractSection(response.content, 'ESTIMATED TIME'),
    citations: response.citations || [],
  };
}

/**
 * Extract a section from markdown response
 */
private extractSection(content: string, sectionName: string): string {
  const regex = new RegExp(`${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n\\n[A-Z]|$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Extract bullet points
 */
private extractBullets(content: string, sectionName: string): string[] {
  const section = this.extractSection(content, sectionName);
  return section
    .split('\n')
    .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'))
    .map(line => line.replace(/^[•\-]\s*/, '').trim());
}

/**
 * Extract tips with titles
 */
private extractTips(content: string, sectionName: string): string[] {
  const section = this.extractSection(content, sectionName);
  return section
    .split(/\n\d+\.\s+/)
    .filter(tip => tip.trim().length > 0)
    .map(tip => tip.trim());
}
```

---

### File 5: `components/ui/TaskItem.tsx` (Modification)

**Changes:**
```typescript
// Add import
import { AIResearchPanel } from '../AIResearchPanel';

// Add state
const [showResearch, setShowResearch] = useState(false);

// Add button (next to AI chat button)
{featureFlags.aiResearchMode && (
  <TouchableOpacity
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowResearch(true);
    }}
    style={styles.researchButton}
  >
    <Text style={styles.researchIcon}>🔍</Text>
  </TouchableOpacity>
)}

// Add modal
<AIResearchPanel
  visible={showResearch}
  task={task}
  onClose={() => setShowResearch(false)}
/>
```

---

### File 6: `components/EditTaskModal.tsx` (Modification)

**Changes:**
```typescript
// Add import
import { AIResearchPanel } from './AIResearchPanel';

// Add state
const [showResearch, setShowResearch] = useState(false);

// Add button (in header, next to AI chat button)
{featureFlags.aiResearchMode && task.title.trim() && (
  <TouchableOpacity
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowResearch(true);
    }}
    style={styles.researchButton}
  >
    <Text>🔍 Research</Text>
  </TouchableOpacity>
)}

// Add modal
<AIResearchPanel
  visible={showResearch}
  task={{ ...task, title: task.title }}
  onClose={() => setShowResearch(false)}
/>
```

---

## 🎨 UI/UX SPECIFICATIONS

### Colors (Dark Mode)
```typescript
const colors = {
  background: '#1C1C1E',
  card: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  accent: '#0A84FF',
  success: '#30D158',
  border: '#38383A',
  tabActive: '#0A84FF',
  tabInactive: '#8E8E93',
};
```

### Typography
```typescript
const typography = {
  title: { fontSize: 20, fontWeight: '600' },
  sectionHeader: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  caption: { fontSize: 13, fontWeight: '400' },
};
```

### Spacing
```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
```

### Animations
- Modal slide up: 300ms ease-out
- Tab switch: 200ms ease-in-out
- Loading skeleton: pulse animation
- Button press: scale 0.95

---

## 🧪 TESTING STRATEGY

### Test Cases

**Test 1: Basic Research Flow**
```
1. Open app
2. Tap any task
3. See 🔍 button next to ✨ button
4. Tap 🔍 button
5. Research panel opens
6. See loading indicator
7. Research loads with all sections
8. Verify: Overview, Key Points, Checklist, Resources, Tips
9. Tap each tab
10. All tabs work ✅
```

**Test 2: Save to Notes**
```
1. Open research panel
2. Tap "Save to Notes"
3. See options: All, Overview, Checklist, Tips
4. Select "Checklist"
5. Close panel
6. Edit task
7. Verify checklist added to notes ✅
```

**Test 3: Cache Behavior**
```
1. Research a task
2. Close panel
3. Reopen research
4. Should load instantly from cache ✅
5. Tap "Refresh"
6. Should fetch new data
7. Cache updated ✅
```

**Test 4: Error Handling**
```
1. Disable internet
2. Try to research (no cache)
3. See error message
4. Tap "Retry"
5. Enable internet
6. Research loads ✅
```

**Test 5: Citations**
```
1. Research a task
2. Scroll to bottom
3. See "📚 Sources (X)"
4. Tap "View Citations"
5. Citations modal opens
6. Tap a citation link
7. Opens in browser ✅
```

**Test 6: Feature Flag**
```
1. Disable aiResearchMode flag
2. 🔍 buttons disappear
3. Enable aiResearchMode flag
4. 🔍 buttons reappear ✅
```

---

## ⚠️ RISK ASSESSMENT

### Technical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Long API response time | 🟡 MEDIUM | Show loading skeleton, cache aggressively |
| Parsing errors | 🟢 LOW | Robust regex, fallback to raw text |
| Large response size | 🟢 LOW | Limit to 4000 tokens, paginate if needed |
| Cache invalidation | 🟢 LOW | 7-day TTL, manual refresh option |

### UX Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Information overload | 🟡 MEDIUM | Tabbed interface, progressive disclosure |
| Modal stacking | 🟢 LOW | Proper z-index, close other modals |
| Slow loading | 🟡 MEDIUM | Skeleton screen, cache-first |

---

## 💰 COST ESTIMATE

### API Usage

**Per Research Request:**
- Prompt: ~200 tokens
- Response: ~3000 tokens
- Total: ~3200 tokens

**Cost:**
- Sonar Pro: $1.00 per 1M tokens
- Per request: $0.0032

**With 90% cache hit rate:**
- 100 users × 2 research/day × 10% miss rate = 20 requests/day
- Cost: 20 × $0.0032 = **$0.064/day = $1.92/month**

**Conclusion:** Very affordable

---

## 📋 IMPLEMENTATION CHECKLIST

### Day 1: Core Infrastructure
- [ ] Create `hooks/use-task-research.ts`
- [ ] Add `researchTask()` to `AIIntelligenceEngine.ts`
- [ ] Add `researchTask()` to `PerplexityService.ts`
- [ ] Add parsing utilities
- [ ] Test API integration

### Day 2: UI Component
- [ ] Create `AIResearchPanel.tsx`
- [ ] Build tab navigation
- [ ] Build Overview tab
- [ ] Build Checklist tab
- [ ] Build Resources tab
- [ ] Build Tips tab

### Day 3: Integration & Polish
- [ ] Add research button to TaskItem
- [ ] Add research button to EditTaskModal
- [ ] Implement save to notes
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add citations modal

### Day 4: Testing & Refinement
- [ ] Test all user flows
- [ ] Test error cases
- [ ] Test cache behavior
- [ ] Test feature flag
- [ ] Polish animations
- [ ] Update documentation

---

## ✅ SUCCESS CRITERIA

### Functionality
- [x] Research button appears on tasks
- [x] Button opens research panel
- [x] All tabs work correctly
- [x] Save to notes works
- [x] Cache works (instant load)
- [x] Refresh works (bypass cache)
- [x] Citations display correctly
- [x] Error handling works
- [x] Feature flag works

### Performance
- [x] First load < 3 seconds
- [x] Cached load < 100ms
- [x] Smooth tab switching
- [x] No UI lag

### UX
- [x] Clear information hierarchy
- [x] Easy to scan
- [x] Helpful content
- [x] Smooth animations
- [x] Good error messages

---

## 🚀 WHAT USERS WILL SEE

### Before Phase 3:
```
Task Detail:
┌─────────────────────────────────────┐
│ 📋 Learn React Native  🔴 High  ✨  │
│    🕐 2 weeks deadline              │
│                                     │
│    Notes: Need to learn basics     │
└─────────────────────────────────────┘
```

### After Phase 3:
```
Task Detail:
┌─────────────────────────────────────┐
│ 📋 Learn React Native  🔴 High      │
│    ✨ Chat  🔍 Research             │ ← NEW!
│    🕐 2 weeks deadline              │
│                                     │
│    Notes: Need to learn basics     │
└─────────────────────────────────────┘

Tap 🔍 → Research Panel:
┌─────────────────────────────────────┐
│  🔍 Research: Learn React Native    │
│                              [X]    │
├─────────────────────────────────────┤
│  [Overview] Checklist Resources Tips│
├─────────────────────────────────────┤
│                                     │
│  📋 OVERVIEW                        │
│  React Native is a framework for    │
│  building mobile apps using React.  │
│  It allows you to write once and    │
│  deploy to iOS and Android.         │
│                                     │
│  🎯 KEY POINTS                      │
│  • Cross-platform development       │
│  • JavaScript + Native components   │
│  • Hot reload for fast iteration    │
│  • Large ecosystem of libraries     │
│  • Strong community support         │
│                                     │
│  ⏱️ ESTIMATED TIME: 2-3 weeks       │
│                                     │
│  📚 SOURCES (3)                     │
│  [View Citations]                   │
│                                     │
│  [Save to Notes] [Refresh]          │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎉 NEXT STEPS

1. ✅ Review this plan
2. ⏳ Approve implementation approach
3. ⏳ Start Day 1 tasks
4. ⏳ Build and test
5. ⏳ Deploy Phase 3

**Ready to start implementation?** Just confirm and I'll begin building!

---

## 📊 PHASE PROGRESS

- [x] Phase 1: Foundation (Complete)
- [x] Phase 2: Conversational Assistant (Complete)
- [ ] **Phase 3: Research Mode (Current)**
- [ ] Phase 4: Voice Enhancement
- [ ] Phase 5: Real-Time Cards
- [ ] Phase 6: Smart Snooze
- [ ] Phase 7: Proactive Suggestions
- [ ] Phase 8: Weekly Planning

**Status:** Ready to implement Phase 3! 🚀
