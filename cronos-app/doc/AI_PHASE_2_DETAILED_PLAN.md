# 🚀 Phase 2: Conversational Assistant - Detailed Implementation Plan

**Duration:** 1 week (5-7 days)  
**Goal:** Add chat interface for AI-powered task assistance  
**User Impact:** HIGH (first visible AI feature!)  
**Risk:** 🟢 LOW (additive only, feature flag controlled)

---

## 🎯 WHAT GETS BUILT IN PHASE 2

Phase 2 adds the **first user-facing AI feature**: a conversational chat interface where users can ask questions about their tasks and get AI-powered responses.

### **What Users Will See:**
- ✨ **Sparkle button** on every task
- **Chat modal** that opens when button is tapped
- **Multi-turn conversation** with AI
- **Save responses** to task notes
- **Citation links** for sources

### **What Users Can Do:**
```
1. Tap ✨ button on any task
2. Ask questions like:
   - "What should I bring?"
   - "How long will this take?"
   - "What are best practices?"
3. Get AI responses with citations
4. Continue conversation (multi-turn)
5. Save helpful responses to task notes
6. Close and reopen to see history
```

---

## 📦 FILES TO CREATE (4 NEW FILES)

### **1. AIConversationModal.tsx**
**Location:** `components/AIConversationModal.tsx`  
**Purpose:** Full-screen chat interface  
**Size:** ~400 lines

**What It Does:**
```typescript
// Main chat modal component

Features:
1. Full-screen modal with header
2. Message list (scrollable)
3. User messages (right-aligned, blue)
4. AI messages (left-aligned, gray)
5. Citations display (expandable)
6. Text input with send button
7. Loading indicator while AI responds
8. Error handling (retry button)
9. Save to notes button
10. Clear conversation button
11. Close button

UI Structure:
┌─────────────────────────────────────┐
│  💬 Chat with AI              [X]   │ ← Header
├─────────────────────────────────────┤
│  Task: Doctor appointment           │ ← Task context
├─────────────────────────────────────┤
│                                     │
│  You: What should I bring?          │ ← User message
│                                     │
│  AI: For a doctor appointment,      │ ← AI message
│  you should bring:                  │
│  • Insurance card and ID            │
│  • List of medications              │
│  • Questions for doctor             │
│                                     │
│  📚 Sources (2)                     │ ← Citations
│                                     │
│  You: How long will it take?        │ ← Multi-turn
│                                     │
│  AI: Typically 30-60 minutes...     │
│                                     │
├─────────────────────────────────────┤
│  [Type your question...]      [→]   │ ← Input
└─────────────────────────────────────┘
```

**Props:**
```typescript
interface AIConversationModalProps {
  visible: boolean;
  task: Task;
  onClose: () => void;
}
```

**State Management:**
```typescript
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [inputText, setInputText] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Key Functions:**
```typescript
// Send message to AI
const handleSendMessage = async () => {
  // Add user message to list
  // Call AIEngine.chat()
  // Add AI response to list
  // Save to conversation store
};

// Save response to task notes
const handleSaveToNotes = (message: string) => {
  // Append to task description
  // Update task in store
  // Show success toast
};

// Clear conversation
const handleClearConversation = () => {
  // Clear messages
  // Clear from store
  // Show confirmation
};
```

---

### **2. AIAssistantButton.tsx**
**Location:** `components/AIAssistantButton.tsx`  
**Purpose:** Sparkle button to trigger AI chat  
**Size:** ~100 lines

**What It Does:**
```typescript
// Reusable AI button component

Features:
1. Sparkle icon (✨)
2. Two sizes: small (task list) and large (modals)
3. Disabled state (when AI unavailable)
4. Loading state (while processing)
5. Tooltip/hint text
6. Haptic feedback on tap
7. Opens AIConversationModal

Variants:
┌──────────────────────────────────┐
│ Small (TaskItem):                │
│ [✨] 16x16px, minimal padding    │
│                                  │
│ Large (Modals):                  │
│ [✨ Ask AI] 24x24px, with text   │
└──────────────────────────────────┘
```

**Props:**
```typescript
interface AIAssistantButtonProps {
  task: Task;
  size?: 'small' | 'large';
  onPress?: () => void;
  disabled?: boolean;
}
```

**Usage Examples:**
```typescript
// In TaskItem (small)
<AIAssistantButton task={task} size="small" />

// In AddTaskModal (large)
<AIAssistantButton 
  task={{ title, description, priority }} 
  size="large" 
/>
```

---

### **3. useAIConversationStore.ts**
**Location:** `core/store/useAIConversationStore.ts`  
**Purpose:** Store chat history per task  
**Size:** ~150 lines

**What It Does:**
```typescript
// Zustand store for conversation history

Data Structure:
{
  conversations: {
    'task-id-1': {
      taskId: 'task-id-1',
      messages: [
        { id: '1', role: 'user', content: '...', timestamp: '...' },
        { id: '2', role: 'assistant', content: '...', citations: [...] },
      ],
      createdAt: '2026-02-05T10:00:00Z',
      updatedAt: '2026-02-05T10:05:00Z',
    },
    'task-id-2': { ... },
  }
}

Actions:
- getConversation(taskId): Get chat history
- addMessage(taskId, message): Add new message
- clearConversation(taskId): Clear history
- clearAllConversations(): Clear all
- getConversationCount(): Total conversations
```

**Store Interface:**
```typescript
interface AIConversationState {
  conversations: Record<string, TaskConversation>;
  
  // Actions
  getConversation: (taskId: string) => TaskConversation | null;
  addMessage: (taskId: string, message: ChatMessage) => void;
  clearConversation: (taskId: string) => void;
  clearAllConversations: () => void;
  getConversationCount: () => number;
}
```

**Persistence:**
- Stored in MMKV (same as tasks)
- Survives app restarts
- Synced across app sessions
- NOT synced to Supabase (local only)

---

### **4. use-ai-conversation.ts**
**Location:** `hooks/use-ai-conversation.ts`  
**Purpose:** Custom hook for chat state management  
**Size:** ~100 lines

**What It Does:**
```typescript
// React hook for managing chat UI state

Features:
1. Load conversation history
2. Send messages to AI
3. Handle loading states
4. Handle errors
5. Auto-scroll to bottom
6. Retry failed messages

Usage:
const {
  messages,
  isLoading,
  error,
  sendMessage,
  clearConversation,
  retry,
} = useAIConversation(task);
```

**Hook Interface:**
```typescript
interface UseAIConversationReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearConversation: () => void;
  retry: () => Promise<void>;
}

function useAIConversation(task: Task): UseAIConversationReturn {
  // Load history from store
  // Send message via AIEngine
  // Update store with new messages
  // Handle errors
}
```

---

## 🔧 FILES TO MODIFY (3 FILES)

### **1. TaskItem.tsx**
**Location:** `components/ui/TaskItem.tsx`  
**Change:** Add AI button next to task title  
**Risk:** 🟢 LOW (additive only)

**What to Add:**
```typescript
// BEFORE (current)
<View className="flex-row items-center">
  <Text className="text-base font-medium">{task.title}</Text>
</View>

// AFTER (with AI button)
<View className="flex-row items-center gap-2">
  <Text className="text-base font-medium">{task.title}</Text>
  
  {/* NEW: AI Assistant Button */}
  {featureFlags.aiConversationalChat && (
    <AIAssistantButton task={task} size="small" />
  )}
</View>
```

**Lines Changed:** ~5 lines  
**Rollback:** Remove AI button lines or disable feature flag

---

### **2. AddTaskModal.tsx**
**Location:** `components/AddTaskModal.tsx`  
**Change:** Add AI button next to Create button  
**Risk:** 🟢 LOW (additive only)

**What to Add:**
```typescript
// BEFORE (current)
<View className="flex-row items-center justify-between pb-4">
  <TouchableOpacity onPress={handleDatePress}>
    {/* Date picker */}
  </TouchableOpacity>

  <TouchableOpacity onPress={handleSubmit}>
    <Text>Create</Text>
  </TouchableOpacity>
</View>

// AFTER (with AI button)
<View className="flex-row items-center justify-between pb-4">
  <TouchableOpacity onPress={handleDatePress}>
    {/* Date picker */}
  </TouchableOpacity>

  <View className="flex-row gap-2">
    {/* NEW: AI Assistant Button (only if title entered) */}
    {featureFlags.aiConversationalChat && title.trim() && (
      <AIAssistantButton 
        task={{ title, description, priority }} 
        size="large" 
      />
    )}
    
    <TouchableOpacity onPress={handleSubmit}>
      <Text>Create</Text>
    </TouchableOpacity>
  </View>
</View>
```

**Lines Changed:** ~10 lines  
**Rollback:** Remove AI button lines or disable feature flag

---

### **3. EditTaskModal.tsx**
**Location:** `components/EditTaskModal.tsx`  
**Change:** Add AI button next to Save button  
**Risk:** 🟢 LOW (additive only)

**What to Add:**
```typescript
// Same pattern as AddTaskModal
// Add AI button next to Save button
// Only show if feature flag enabled
```

**Lines Changed:** ~10 lines  
**Rollback:** Remove AI button lines or disable feature flag

---

## 🎨 UI/UX DESIGN

### **Color Scheme:**
```typescript
// User messages
background: '#007AFF' (iOS blue)
text: '#FFFFFF' (white)
alignment: right

// AI messages
background: '#F2F2F7' (light gray)
text: '#000000' (black)
alignment: left

// Citations
background: '#E5E5EA' (lighter gray)
text: '#007AFF' (blue links)
icon: '📚'

// Input
background: '#FFFFFF' (white)
border: '#E5E5EA' (gray)
placeholder: '#8E8E93' (gray)
```

### **Animations:**
```typescript
// Modal entrance
- Slide up from bottom
- Duration: 300ms
- Easing: ease-out

// Message appearance
- Fade in + slide up
- Duration: 200ms
- Stagger: 50ms between messages

// Loading indicator
- Pulsing dots
- Duration: 1000ms
- Loop: infinite
```

### **Responsive Design:**
```typescript
// Modal height
- Default: 80% of screen
- Keyboard open: Adjust to fit
- Landscape: 90% of screen

// Message width
- Max: 80% of screen width
- Min: 100px
- Padding: 12px

// Font sizes
- Message text: 16px
- Timestamp: 12px
- Citations: 14px
```

---

## 📊 IMPLEMENTATION CHECKLIST

### **Day 1-2: Core Components**
- [ ] Create `AIConversationModal.tsx`
  - [ ] Modal structure
  - [ ] Message list UI
  - [ ] User message component
  - [ ] AI message component
  - [ ] Citations component
  - [ ] Input field
  - [ ] Send button
  - [ ] Loading state
  - [ ] Error state

- [ ] Create `AIAssistantButton.tsx`
  - [ ] Sparkle icon
  - [ ] Small variant
  - [ ] Large variant
  - [ ] Disabled state
  - [ ] Loading state
  - [ ] Haptic feedback
  - [ ] Tooltip

### **Day 3: State Management**
- [ ] Create `useAIConversationStore.ts`
  - [ ] Define store interface
  - [ ] Implement getConversation
  - [ ] Implement addMessage
  - [ ] Implement clearConversation
  - [ ] Add MMKV persistence
  - [ ] Test store operations

- [ ] Create `use-ai-conversation.ts`
  - [ ] Load conversation history
  - [ ] Send message function
  - [ ] Handle loading states
  - [ ] Handle errors
  - [ ] Retry logic

### **Day 4: Integration**
- [ ] Integrate with TaskItem
  - [ ] Add AI button
  - [ ] Test feature flag
  - [ ] Test button tap
  - [ ] Test modal open/close

- [ ] Integrate with AddTaskModal
  - [ ] Add AI button
  - [ ] Test with partial task data
  - [ ] Test modal interaction

- [ ] Integrate with EditTaskModal
  - [ ] Add AI button
  - [ ] Test with full task data

### **Day 5: Features & Polish**
- [ ] Save to notes functionality
  - [ ] Append to task description
  - [ ] Show success feedback
  - [ ] Handle errors

- [ ] Clear conversation
  - [ ] Confirmation dialog
  - [ ] Clear from store
  - [ ] Reset UI

- [ ] Citations display
  - [ ] Expandable list
  - [ ] Open links in browser
  - [ ] Copy link functionality

### **Day 6-7: Testing & Polish**
- [ ] Test all user flows
- [ ] Test error scenarios
- [ ] Test offline behavior
- [ ] Test with long conversations
- [ ] Test with multiple tasks
- [ ] Polish animations
- [ ] Polish styling
- [ ] Add accessibility labels
- [ ] Test on iOS
- [ ] Test on Android

---

## 🧪 TESTING STRATEGY

### **Unit Tests (Optional)**
```typescript
// Test conversation store
test('Should add message to conversation', () => {
  const store = useAIConversationStore.getState();
  store.addMessage('task-1', {
    id: '1',
    role: 'user',
    content: 'Hello',
    timestamp: new Date().toISOString(),
  });
  
  const conversation = store.getConversation('task-1');
  expect(conversation?.messages.length).toBe(1);
});

// Test hook
test('Should send message and get response', async () => {
  const { result } = renderHook(() => useAIConversation(mockTask));
  
  await act(async () => {
    await result.current.sendMessage('What should I bring?');
  });
  
  expect(result.current.messages.length).toBe(2); // User + AI
  expect(result.current.isLoading).toBe(false);
});
```

### **Manual Testing Checklist**
- [ ] **Basic Flow**
  - [ ] Tap AI button → Modal opens
  - [ ] Type message → Send → Get response
  - [ ] Response appears with citations
  - [ ] Close modal → Reopen → History preserved

- [ ] **Multi-turn Conversation**
  - [ ] Send first message
  - [ ] Send follow-up question
  - [ ] AI maintains context
  - [ ] History shows all messages

- [ ] **Save to Notes**
  - [ ] Tap "Save to Notes" on AI message
  - [ ] Open task → Notes updated
  - [ ] Formatting preserved

- [ ] **Error Handling**
  - [ ] Disable internet → Show error
  - [ ] Tap retry → Works
  - [ ] Rate limit exceeded → Show message

- [ ] **Feature Flag**
  - [ ] Disable flag → Button hidden
  - [ ] Enable flag → Button appears
  - [ ] Works across app restart

- [ ] **Performance**
  - [ ] Modal opens quickly (<100ms)
  - [ ] Messages render smoothly
  - [ ] No lag when typing
  - [ ] Scrolling is smooth

- [ ] **Edge Cases**
  - [ ] Very long messages
  - [ ] Many messages (50+)
  - [ ] Empty task title
  - [ ] No internet connection
  - [ ] API errors

---

## 🎯 USER FLOWS

### **Flow 1: First-Time User**
```
1. User creates task: "Doctor appointment"
2. User sees ✨ button (new!)
3. User taps ✨ (curious)
4. Modal opens with welcome message
5. User types: "What should I bring?"
6. AI responds with helpful list
7. User taps "Save to Notes"
8. Success! Notes updated
9. User closes modal
10. User is delighted 🎉
```

### **Flow 2: Returning User**
```
1. User opens existing task
2. User taps ✨ button
3. Modal opens with previous conversation
4. User continues conversation
5. Asks follow-up question
6. AI maintains context
7. User gets helpful response
8. User closes modal
```

### **Flow 3: Power User**
```
1. User creates task while typing
2. User taps ✨ before saving
3. Asks AI for suggestions
4. AI provides checklist
5. User saves to notes
6. User creates task with AI-enhanced notes
7. User is productive 🚀
```

---

## 💡 FEATURES BREAKDOWN

### **Core Features (Must Have)**
✅ Chat interface  
✅ Multi-turn conversation  
✅ AI responses with citations  
✅ Save to notes  
✅ Conversation history  
✅ Feature flag control  

### **Nice to Have (Phase 2.5)**
⏳ Suggested questions  
⏳ Voice input in chat  
⏳ Share conversation  
⏳ Export conversation  
⏳ Search in conversation  

### **Future Enhancements (Phase 3+)**
🔮 Smart suggestions based on task type  
🔮 Proactive AI tips  
🔮 Integration with calendar  
🔮 Collaboration features  

---

## ⚠️ RISK ASSESSMENT

### **Technical Risks**

| Risk | Severity | Mitigation |
|------|----------|------------|
| Modal stacking | 🟡 MEDIUM | Close task modal before opening AI modal |
| Memory leaks | 🟢 LOW | Proper cleanup in useEffect |
| Slow responses | 🟡 MEDIUM | Show loading indicator, cache responses |
| API errors | 🟡 MEDIUM | Retry logic, error messages |
| Large conversations | 🟢 LOW | Limit to 50 messages, pagination |

### **UX Risks**

| Risk | Severity | Mitigation |
|------|----------|------------|
| Button too small | 🟢 LOW | Test on real devices, adjust size |
| Confusing UI | 🟢 LOW | Clear labels, tooltips |
| Slow typing | 🟢 LOW | Debounce, optimize rendering |
| Lost conversations | 🟢 LOW | MMKV persistence, auto-save |

---

## 🚨 ROLLBACK PLAN

### **Level 1: Disable Feature (< 1 minute)**
```typescript
// In useFeatureFlagStore
aiConversationalChat: false
```

### **Level 2: Hide Buttons (< 5 minutes)**
```typescript
// In TaskItem, AddTaskModal, EditTaskModal
// Comment out AI button
{/* <AIAssistantButton task={task} /> */}
```

### **Level 3: Remove Components (< 30 minutes)**
```bash
# Delete new files
rm components/AIConversationModal.tsx
rm components/AIAssistantButton.tsx
rm core/store/useAIConversationStore.ts
rm hooks/use-ai-conversation.ts

# Revert modified files
git checkout components/ui/TaskItem.tsx
git checkout components/AddTaskModal.tsx
git checkout components/EditTaskModal.tsx
```

---

## 💰 COST ESTIMATE

### **Development Time:**
- 5-7 days of implementation
- ~40-50 hours total

### **API Costs (Testing):**
- ~50 test conversations
- ~200 API requests
- Cost: ~$0.04 (negligible)

### **Production (100 users):**
- Assume 5 conversations/user/day
- 500 conversations/day
- With 90% cache hit rate: 50 API calls/day
- Cost: ~$0.01/day = **$0.30/month**

---

## ✅ SUCCESS CRITERIA

Phase 2 is complete when:

1. ✅ AI button appears on tasks (when feature enabled)
2. ✅ Tapping button opens chat modal
3. ✅ Users can send messages and get AI responses
4. ✅ Multi-turn conversations work
5. ✅ Citations display correctly
6. ✅ Save to notes works
7. ✅ Conversation history persists
8. ✅ Feature flag controls visibility
9. ✅ Error handling works
10. ✅ No regressions in existing features
11. ✅ Performance is good (no lag)
12. ✅ Works on iOS and Android

---

## 📋 DELIVERABLES

### **End of Phase 2:**

**Components:**
- ✅ AIConversationModal.tsx
- ✅ AIAssistantButton.tsx

**State Management:**
- ✅ useAIConversationStore.ts
- ✅ use-ai-conversation.ts

**Integration:**
- ✅ TaskItem with AI button
- ✅ AddTaskModal with AI button
- ✅ EditTaskModal with AI button

**Documentation:**
- ✅ Phase 2 completion report
- ✅ User guide
- ✅ Testing guide

---

## 🚀 READY TO START?

**Prerequisites:**
- ✅ Phase 1 complete
- ✅ API key configured
- ✅ Feature flags working

**Once approved:**
- Day 1-2: Build components
- Day 3: State management
- Day 4: Integration
- Day 5: Features & polish
- Day 6-7: Testing

**Estimated completion:** 5-7 days

---

## 📝 NOTES

### **Design Decisions:**
- Full-screen modal (not bottom sheet) for better UX
- Right-aligned user messages (familiar chat pattern)
- Citations expandable (don't clutter main view)
- Save to notes (don't auto-save, user control)
- Local storage only (no Supabase sync yet)

### **Future Improvements:**
- Voice input in chat
- Suggested questions
- Smart context awareness
- Conversation search
- Export/share conversations

**Ready to implement Phase 2?** 🎯
