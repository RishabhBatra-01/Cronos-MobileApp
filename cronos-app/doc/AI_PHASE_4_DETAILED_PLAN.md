# 🎤 Phase 4: Voice Enhancement - Detailed Implementation Plan

**Date:** February 6, 2026  
**Status:** Planning Phase  
**Duration:** 2-3 days  
**Risk:** 🟢 LOW (additive feature, no breaking changes)

---

## 🎯 GOAL

Enhance voice input with AI-generated sub-task suggestions that appear after task creation, allowing users to quickly add related tasks with one tap.

**User Flow:**
```
User says: "Doctor appointment tomorrow at 10 AM"
    ↓
Task created
    ↓
AI suggests sub-tasks:
- Bring insurance card and ID
- Check traffic to clinic
- Prepare questions for doctor
- Refill prescription if needed
    ↓
User taps to add suggestions
    ↓
Sub-tasks created automatically
```

---

## 📊 WHAT GETS BUILT

### **1 New Component:**
- `components/AISubTaskSuggestions.tsx` (~400 lines)

### **1 New Hook:**
- `hooks/use-sub-task-suggestions.ts` (~150 lines)

### **1 File Modified:**
- `components/VoiceInputButton.tsx` (+30 lines) - Trigger suggestions after task creation

**Total:** ~550 lines of new code, ~30 lines of changes

---

## 🏗️ ARCHITECTURE

### Data Flow

```
User completes voice input
    ↓
Tasks created (existing flow)
    ↓
Check if aiVoiceEnhancement enabled
    ↓
For each created task:
    ↓
AIIntelligenceEngine.generateSubTasks()
    ↓
Check cache (7-day TTL)
    ↓
If miss: PerplexityService.generateSubTasks()
    ↓
Parse response
    ↓
Cache result
    ↓
Show AISubTaskSuggestions modal
    ↓
User selects suggestions
    ↓
Create selected tasks
    ↓
Schedule notifications
    ↓
Sync to Supabase
```

### Data Structure

```typescript
interface SubTaskSuggestion {
  id: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  estimatedTime?: string;
  dueDate?: string; // Relative to parent task
  selected: boolean; // For UI selection
}

interface SubTaskSuggestionsData {
  parentTaskId: string;
  parentTaskTitle: string;
  suggestions: SubTaskSuggestion[];
  generatedAt: string;
}
```

---

## 📝 IMPLEMENTATION DETAILS

### File 1: `hooks/use-sub-task-suggestions.ts`

**Purpose:** Manage sub-task suggestion state and operations

**Key Functions:**
```typescript
export function useSubTaskSuggestions() {
  const [suggestions, setSuggestions] = useState<SubTaskSuggestionsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Generate suggestions for a task
  const generateSuggestions = async (task: Task) => {
    // Check feature flag
    // Call AIIntelligenceEngine.generateSubTasks()
    // Parse and format suggestions
    // Set default selections (all selected)
  };
  
  // Toggle selection of a suggestion
  const toggleSelection = (id: string) => {
    // Add/remove from selectedIds set
  };
  
  // Select all suggestions
  const selectAll = () => {
    // Add all suggestion IDs to selectedIds
  };
  
  // Deselect all suggestions
  const deselectAll = () => {
    // Clear selectedIds
  };
  
  // Get selected suggestions
  const getSelectedSuggestions = () => {
    // Filter suggestions by selectedIds
  };
  
  // Clear suggestions
  const clearSuggestions = () => {
    // Reset all state
  };
  
  return {
    suggestions,
    isLoading,
    error,
    selectedIds,
    generateSuggestions,
    toggleSelection,
    selectAll,
    deselectAll,
    getSelectedSuggestions,
    clearSuggestions,
  };
}
```

**State Management:**
- Local state (no Zustand needed - suggestions are ephemeral)
- Cache via AIResponseCache (7-day TTL)
- No persistence needed

---

### File 2: `components/AISubTaskSuggestions.tsx`

**Purpose:** Modal to display and select sub-task suggestions

**UI Structure:**
```
┌─────────────────────────────────────┐
│  💡 Suggested Sub-Tasks       [X]   │
├─────────────────────────────────────┤
│  For: Doctor appointment            │
├─────────────────────────────────────┤
│                                     │
│  ☑ Bring insurance card and ID      │
│     📝 Essential documents           │
│     ⏱️ 5 minutes                    │
│                                     │
│  ☑ Check traffic to clinic          │
│     🚗 Plan your route              │
│     ⏱️ 2 minutes                    │
│                                     │
│  ☑ Prepare questions for doctor     │
│     📋 List your concerns           │
│     ⏱️ 10 minutes                   │
│                                     │
│  ☑ Refill prescription if needed    │
│     💊 Check medication supply      │
│     ⏱️ 5 minutes                    │
│                                     │
│  [Select All] [Deselect All]        │
│                                     │
│  [Add Selected (4)] [Skip]          │
└─────────────────────────────────────┘
```

**Key Features:**
- Checkbox selection for each suggestion
- Show description and estimated time
- Select all / Deselect all buttons
- Add selected button (shows count)
- Skip button (dismiss without adding)
- Loading state
- Error state with retry
- Haptic feedback
- Auto-dismiss after adding

**Component Structure:**
```typescript
interface AISubTaskSuggestionsProps {
  visible: boolean;
  parentTask: Task;
  onAdd: (suggestions: SubTaskSuggestion[]) => void;
  onSkip: () => void;
}

export function AISubTaskSuggestions({
  visible,
  parentTask,
  onAdd,
  onSkip,
}: AISubTaskSuggestionsProps) {
  const {
    suggestions,
    isLoading,
    error,
    selectedIds,
    generateSuggestions,
    toggleSelection,
    selectAll,
    deselectAll,
    getSelectedSuggestions,
    clearSuggestions,
  } = useSubTaskSuggestions();
  
  // Load suggestions when modal opens
  useEffect(() => {
    if (visible && !suggestions && !isLoading) {
      generateSuggestions(parentTask);
    }
  }, [visible]);
  
  // Handle add selected
  const handleAdd = () => {
    const selected = getSelectedSuggestions();
    if (selected.length > 0) {
      onAdd(selected);
      clearSuggestions();
    }
  };
  
  // Handle skip
  const handleSkip = () => {
    clearSuggestions();
    onSkip();
  };
  
  // Render suggestion item
  const renderSuggestion = (suggestion: SubTaskSuggestion) => (
    <TouchableOpacity
      onPress={() => toggleSelection(suggestion.id)}
      style={styles.suggestionItem}
    >
      <View style={styles.checkbox}>
        {selectedIds.has(suggestion.id) && <CheckIcon />}
      </View>
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
        {suggestion.description && (
          <Text style={styles.suggestionDescription}>
            {suggestion.description}
          </Text>
        )}
        {suggestion.estimatedTime && (
          <Text style={styles.suggestionTime}>
            ⏱️ {suggestion.estimatedTime}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
  
  return (
    <Modal visible={visible} animationType="slide">
      {/* Header */}
      {/* Parent task info */}
      {/* Loading state */}
      {/* Error state */}
      {/* Suggestions list */}
      {/* Select all / Deselect all */}
      {/* Add / Skip buttons */}
    </Modal>
  );
}
```

---

### File 3: `components/VoiceInputButton.tsx` (Modification)

**Changes:**

1. **Add state for suggestions modal:**
```typescript
const [showSuggestions, setShowSuggestions] = useState(false);
const [currentTaskForSuggestions, setCurrentTaskForSuggestions] = useState<Task | null>(null);
```

2. **Modify handleSaveTasks to trigger suggestions:**
```typescript
const handleSaveTasks = async (tasks: ParsedTaskData[]) => {
  console.log(`[VoiceInputButton] Saving ${tasks.length} task(s)`);

  // Create all tasks (existing code)
  const createdTaskIds: string[] = [];
  for (const taskData of tasks) {
    const taskId = addTask(...);
    createdTaskIds.push(taskId);
    // ... existing notification scheduling
  }

  // Sync to Supabase (existing code)
  // ...

  // Close review modal
  setShowReviewModal(false);
  setPendingTasks([]);

  // NEW: Check if voice enhancement is enabled
  const { isFeatureEnabled } = useFeatureFlagStore.getState();
  if (isFeatureEnabled('aiVoiceEnhancement') && tasks.length === 1) {
    // Only show suggestions for single task creation
    // (Multiple tasks would be overwhelming)
    const createdTask = useTaskStore.getState().tasks.find(
      t => t.id === createdTaskIds[0]
    );
    
    if (createdTask) {
      console.log('[VoiceInputButton] Triggering sub-task suggestions');
      setCurrentTaskForSuggestions(createdTask);
      setShowSuggestions(true);
    }
  }

  // Success haptic and alert (existing code)
  // ...
};
```

3. **Add handler for adding suggestions:**
```typescript
const handleAddSuggestions = async (suggestions: SubTaskSuggestion[]) => {
  console.log(`[VoiceInputButton] Adding ${suggestions.length} sub-task(s)`);
  
  for (const suggestion of suggestions) {
    // Create sub-task
    const taskId = addTask(
      suggestion.title,
      suggestion.dueDate,
      suggestion.priority || 'medium',
      suggestion.description
    );
    
    // Schedule notification if needed
    if (suggestion.dueDate) {
      const dueDate = new Date(suggestion.dueDate);
      if (dueDate > new Date()) {
        await scheduleTaskNotification({
          id: taskId,
          title: suggestion.title,
          dueDate: suggestion.dueDate,
          status: 'pending',
          createdAt: new Date().toISOString(),
          isActive: true,
        });
      }
    }
  }
  
  // Sync to Supabase
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await syncAll(session.user.id);
    }
  } catch (error) {
    console.error('[VoiceInputButton] Sync error:', error);
  }
  
  // Close modal
  setShowSuggestions(false);
  setCurrentTaskForSuggestions(null);
  
  // Success feedback
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  Alert.alert('Success', `Added ${suggestions.length} sub-task(s)!`);
};
```

4. **Add handler for skipping suggestions:**
```typescript
const handleSkipSuggestions = () => {
  console.log('[VoiceInputButton] Skipped sub-task suggestions');
  setShowSuggestions(false);
  setCurrentTaskForSuggestions(null);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};
```

5. **Add modal at the end:**
```typescript
return (
  <>
    {/* Existing voice button */}
    {/* Existing PaywallModal */}
    {/* Existing TaskReviewModal */}
    
    {/* NEW: Sub-task suggestions modal */}
    {currentTaskForSuggestions && (
      <AISubTaskSuggestions
        visible={showSuggestions}
        parentTask={currentTaskForSuggestions}
        onAdd={handleAddSuggestions}
        onSkip={handleSkipSuggestions}
      />
    )}
  </>
);
```

---

### File 4: `services/PerplexityService.ts` (Already Exists!)

The `generateSubTasks()` method already exists from Phase 1. No changes needed!

---

### File 5: `services/AIIntelligenceEngine.ts` (Already Exists!)

The `generateSubTasks()` method already exists from Phase 1. No changes needed!

---

## 🎨 UI/UX SPECIFICATIONS

### Colors (Dark Mode)
```typescript
const colors = {
  background: '#000000',
  card: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  accent: '#0A84FF',
  success: '#30D158',
  border: '#2C2C2E',
  checkbox: '#0A84FF',
  checkboxBorder: '#3A3A3C',
};
```

### Typography
```typescript
const typography = {
  title: { fontSize: 20, fontWeight: '600' },
  subtitle: { fontSize: 14, fontWeight: '400' },
  suggestionTitle: { fontSize: 16, fontWeight: '500' },
  suggestionDescription: { fontSize: 14, fontWeight: '400' },
  suggestionTime: { fontSize: 12, fontWeight: '400' },
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
- Checkbox toggle: 200ms ease-in-out
- Button press: scale 0.95
- Loading pulse: 1000ms infinite

---

## 🧪 TESTING STRATEGY

### Test Cases

**Test 1: Basic Suggestion Flow**
```
1. Open app
2. Tap voice button
3. Say: "Doctor appointment tomorrow at 10 AM"
4. Stop recording
5. Review modal shows
6. Tap "Save"
7. Task created
8. Suggestions modal appears automatically
9. See 3-5 suggested sub-tasks
10. All selected by default
11. Tap "Add Selected"
12. Sub-tasks created ✅
```

**Test 2: Selective Addition**
```
1. Create task via voice
2. Suggestions modal appears
3. Deselect some suggestions
4. Tap "Add Selected (X)"
5. Only selected sub-tasks created ✅
```

**Test 3: Skip Suggestions**
```
1. Create task via voice
2. Suggestions modal appears
3. Tap "Skip"
4. Modal closes
5. No sub-tasks created ✅
```

**Test 4: Select All / Deselect All**
```
1. Create task via voice
2. Suggestions modal appears
3. Tap "Deselect All"
4. All checkboxes unchecked
5. Tap "Select All"
6. All checkboxes checked ✅
```

**Test 5: Cache Behavior**
```
1. Create task: "Doctor appointment"
2. See suggestions
3. Skip
4. Create same task again
5. Suggestions load instantly (cached) ✅
```

**Test 6: Multiple Tasks**
```
1. Say: "Buy milk and call mom"
2. Creates 2 tasks
3. Suggestions modal does NOT appear
4. (Only shows for single task) ✅
```

**Test 7: Feature Flag**
```
1. Disable aiVoiceEnhancement
2. Create task via voice
3. Suggestions modal does NOT appear ✅
```

**Test 8: Error Handling**
```
1. Disable internet
2. Create task via voice (no cache)
3. Suggestions modal shows error
4. Tap "Retry"
5. Enable internet
6. Suggestions load ✅
```

---

## ⚠️ RISK ASSESSMENT

### Technical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| API response time | 🟡 MEDIUM | Show loading state, cache aggressively |
| Parsing errors | 🟢 LOW | Robust parsing, fallback to empty array |
| Modal timing | 🟢 LOW | Delay modal until task creation complete |
| Multiple tasks | 🟢 LOW | Only show for single task creation |

### UX Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Interrupting flow | 🟡 MEDIUM | Make skipping easy, remember preference |
| Too many suggestions | 🟡 MEDIUM | Limit to 5-7 suggestions |
| Irrelevant suggestions | 🟡 MEDIUM | Improve prompts, allow feedback |
| Modal fatigue | 🟡 MEDIUM | Only show for single tasks |

---

## 💰 COST ESTIMATE

### API Usage

**Per Sub-Task Generation:**
- Prompt: ~150 tokens
- Response: ~500 tokens
- Total: ~650 tokens

**Cost:**
- Sonar: $0.20 per 1M tokens
- Per request: $0.00013

**With 90% cache hit rate:**
- 100 users × 1 voice task/day × 10% miss rate = 10 requests/day
- Cost: 10 × $0.00013 = **$0.0013/day = $0.04/month**

**Total Cost (All Phases):**
- Phase 2 (Chat): $0.30/month
- Phase 3 (Research): $1.92/month
- Phase 4 (Voice): $0.04/month
- **Total: $2.26/month for 100 users**

**Conclusion:** Negligible cost increase

---

## 📋 IMPLEMENTATION CHECKLIST

### Day 1: Core Infrastructure
- [ ] Create `hooks/use-sub-task-suggestions.ts`
- [ ] Implement state management
- [ ] Implement generateSuggestions()
- [ ] Implement selection logic
- [ ] Test hook in isolation

### Day 2: UI Component
- [ ] Create `components/AISubTaskSuggestions.tsx`
- [ ] Build modal structure
- [ ] Build suggestion list
- [ ] Build checkbox selection
- [ ] Build select all / deselect all
- [ ] Build add / skip buttons
- [ ] Add loading state
- [ ] Add error state

### Day 3: Integration & Polish
- [ ] Modify VoiceInputButton.tsx
- [ ] Add suggestion trigger
- [ ] Add handlers for add/skip
- [ ] Test full flow
- [ ] Add haptic feedback
- [ ] Polish animations
- [ ] Update documentation

---

## ✅ SUCCESS CRITERIA

### Functionality
- [x] Suggestions appear after voice task creation
- [x] All suggestions selected by default
- [x] Can toggle individual selections
- [x] Select all / Deselect all works
- [x] Add selected creates sub-tasks
- [x] Skip dismisses without creating
- [x] Cache works (instant reload)
- [x] Error handling works
- [x] Feature flag works

### Performance
- [x] First load < 2 seconds
- [x] Cached load < 100ms
- [x] Smooth animations
- [x] No UI lag

### UX
- [x] Clear suggestion titles
- [x] Helpful descriptions
- [x] Easy to select/deselect
- [x] Easy to skip
- [x] Good loading states
- [x] Clear error messages

---

## 🚀 WHAT USERS WILL SEE

### Before Phase 4:
```
Voice Input:
1. Tap mic
2. Say task
3. Review modal
4. Tap "Save"
5. Task created
✅ Done
```

### After Phase 4:
```
Voice Input:
1. Tap mic
2. Say task
3. Review modal
4. Tap "Save"
5. Task created
6. Suggestions modal appears ← NEW!
7. Select suggestions
8. Tap "Add Selected"
9. Sub-tasks created
✅ Done with sub-tasks!
```

---

## 💡 EXAMPLE SUGGESTIONS

### Medical Task: "Doctor appointment tomorrow"
```
💡 Suggested Sub-Tasks:
☑ Bring insurance card and ID
   📝 Essential documents
   ⏱️ 5 minutes

☑ Check traffic to clinic
   🚗 Plan your route
   ⏱️ 2 minutes

☑ Prepare questions for doctor
   📋 List your concerns
   ⏱️ 10 minutes

☑ Refill prescription if needed
   💊 Check medication supply
   ⏱️ 5 minutes
```

### Shopping Task: "Buy groceries for dinner party"
```
💡 Suggested Sub-Tasks:
☑ Make guest list
   👥 Count attendees
   ⏱️ 5 minutes

☑ Plan menu
   🍽️ Choose dishes
   ⏱️ 15 minutes

☑ Create shopping list
   📝 List ingredients
   ⏱️ 10 minutes

☑ Check pantry inventory
   🏠 See what you have
   ⏱️ 10 minutes

☑ Buy decorations
   🎈 Party supplies
   ⏱️ 30 minutes
```

### Work Task: "Prepare presentation for Friday"
```
💡 Suggested Sub-Tasks:
☑ Gather data and metrics
   📊 Collect information
   ⏱️ 2 hours

☑ Create slide deck
   📽️ Design presentation
   ⏱️ 3 hours

☑ Practice presentation
   🎤 Rehearse delivery
   ⏱️ 1 hour

☑ Prepare handouts
   📄 Print materials
   ⏱️ 30 minutes

☑ Test equipment
   💻 Check tech setup
   ⏱️ 15 minutes
```

---

## 🎯 NEXT STEPS

1. ✅ Review this plan
2. ⏳ Approve implementation approach
3. ⏳ Start Day 1 tasks
4. ⏳ Build and test
5. ⏳ Deploy Phase 4

**Ready to start implementation?** Just confirm and I'll begin building!

---

## 📊 PHASE PROGRESS

- [x] Phase 1: Foundation (Complete)
- [x] Phase 2: Conversational Assistant (Complete)
- [x] Phase 3: Research Mode (Complete)
- [ ] **Phase 4: Voice Enhancement (Current)**
- [ ] Phase 5: Real-Time Cards
- [ ] Phase 6: Smart Snooze
- [ ] Phase 7: Proactive Suggestions
- [ ] Phase 8: Weekly Planning

**Status:** Ready to implement Phase 4! 🚀

---

## 🔑 KEY POINTS

1. **Non-Intrusive:** Only shows for single task creation
2. **Smart Defaults:** All suggestions selected by default
3. **Easy to Skip:** One tap to dismiss
4. **Cached:** Instant responses for repeated tasks
5. **Feature Flag:** Can disable anytime
6. **Zero Breaking Changes:** Completely additive
7. **Low Cost:** Only $0.04/month for 100 users

**Phase 4 will make voice input even more powerful!** 🎤
