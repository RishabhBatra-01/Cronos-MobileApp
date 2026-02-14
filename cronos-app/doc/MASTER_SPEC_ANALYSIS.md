# Master Spec Analysis & Implementation Strategy

## 📊 Complexity Assessment

### Feature Breakdown

| Feature | Complexity | Dependencies | Risk Level |
|---------|-----------|--------------|------------|
| Active/Inactive Toggle | Low | None | Low |
| Repeat Logic | High | Active Toggle | Medium |
| Notify Before | Medium | Active Toggle, Repeat | Medium |
| Snooze | Medium | Active Toggle | Low |
| Feature Interactions | High | All features | High |

### Total Estimated Effort: 12-17 hours

---

## 🎯 Implementation Phases

### Phase 1: Foundation (2-3 hours)
**Goal:** Data model + Active/Inactive toggle

**Why First:**
- Foundation for all other features
- Simplest to implement and test
- Provides immediate value
- No dependencies

**Deliverables:**
- Updated Task interface
- Active/Inactive toggle UI
- Notification cancellation
- Database migration

### Phase 2: Repeat Logic (4-5 hours)
**Goal:** Automatic rescheduling

**Why Second:**
- Core scheduling feature
- Most complex logic
- Requires solid foundation
- Affects all other features

**Deliverables:**
- Repeat type selection
- Next occurrence calculation
- Timezone-aware scheduling
- Automatic rescheduling

### Phase 3: Notify Before (2-3 hours)
**Goal:** Pre-notifications

**Why Third:**
- Builds on repeat logic
- Simpler than repeat
- Independent of snooze

**Deliverables:**
- Offset configuration UI
- Multiple notification scheduling
- Offset calculation

### Phase 4: Snooze (2-3 hours)
**Goal:** Temporary delay

**Why Fourth:**
- Requires active notifications
- Simpler than repeat
- User-facing feature

**Deliverables:**
- Snooze button in notification
- Duration picker
- Temporary rescheduling

### Phase 5: Integration (2-3 hours)
**Goal:** Test all interactions

**Why Last:**
- Verify feature coordination
- Edge case testing
- Non-regression verification

**Deliverables:**
- Comprehensive tests
- Edge case verification
- Documentation

---

## 🔍 Critical Analysis Points

### 1. Timezone Handling

**Spec Requirement:**
> "Repeat calculations must be based on the stored ISO timestamp (absolute instant)"

**Implementation Strategy:**

```typescript
// Store absolute instant with timezone
const task = {
    scheduledDate: "2026-02-15",
    scheduledTime: "15:00",
    timezone: "America/Los_Angeles"
};

// Calculate trigger as ISO timestamp
const mainTrigger = createZonedDateTime(
    task.scheduledDate,
    task.scheduledTime,
    task.timezone
);
// Result: "2026-02-15T15:00:00-08:00"

// For repeat: add interval to ISO timestamp
const nextTrigger = addDays(mainTrigger, task.repeatConfig.intervalDays);
// Preserves absolute instant, not wall-clock time
```

**Key Points:**
- Store timezone explicitly
- Calculate trigger as ISO timestamp
- Repeat adds to absolute instant
- Display converts to current timezone

### 2. Feature Independence

**Spec Requirement:**
> "These features are independent, but must coordinate strictly"

**Coordination Matrix:**

| Feature | Affects | Affected By |
|---------|---------|-------------|
| Active/Inactive | All features | None |
| Repeat | Future triggers | Active state |
| Notify Before | Pre-notifications | Active state, Repeat |
| Snooze | Current trigger | Active state |

**Implementation Rules:**
1. Active/Inactive is the master switch
2. Each feature checks active state independently
3. No feature modifies another's configuration
4. Coordination happens at scheduling time

### 3. Data Model Evolution

**Current State:**
```typescript
interface Task {
    dueDate?: string;  // ISO timestamp
}
```

**Target State:**
```typescript
interface Task {
    // Legacy (keep for backward compatibility)
    dueDate?: string;
    
    // New scheduling model
    scheduledDate?: string;  // "YYYY-MM-DD"
    scheduledTime?: string;  // "HH:mm"
    timezone?: string;       // "America/Los_Angeles"
    isActive: boolean;
    
    // Repeat
    repeatType?: RepeatType;
    repeatConfig?: RepeatConfig;
    
    // Notify Before
    preNotifyOffsets?: string[];  // ["PT5M", "PT15M"]
    
    // Snooze
    snoozeEnabled?: boolean;
    snoozeDuration?: string;  // "PT10M"
    snoozedUntil?: string;    // ISO timestamp
}
```

**Migration Strategy:**
1. Add new fields as optional
2. Keep `dueDate` for backward compatibility
3. New tasks use new model
4. Old tasks continue to work
5. Gradual migration over time

### 4. Notification Architecture

**Current:**
```
Task → Single Notification
```

**Target:**
```
Task → Main Notification
    → Pre-notification 1 (if configured)
    → Pre-notification 2 (if configured)
    → Pre-notification N (if configured)
    → Snoozed Notification (if snoozed)
```

**Implementation:**
- Each notification has unique ID
- All notifications tagged with taskId
- Cancel by taskId cancels all
- Snooze only affects current trigger

### 5. Edge Cases to Handle

#### Edge Case 1: Inactive Task with Pending Notifications
```
Scenario: Task has notifications scheduled, user deactivates
Expected: All notifications cancelled immediately
Implementation: cancelTaskNotifications(taskId)
```

#### Edge Case 2: Reactivate Past Task
```
Scenario: Task scheduled for yesterday, user reactivates
Expected: 
  - One-time: Keep inactive or mark expired
  - Repeating: Calculate next occurrence
Implementation: Check if trigger is future before scheduling
```

#### Edge Case 3: Snooze Then Deactivate
```
Scenario: User snoozes notification, then deactivates task
Expected: Snoozed notification cancelled
Implementation: cancelTaskNotifications includes snoozed
```

#### Edge Case 4: DST Transition
```
Scenario: Task scheduled during DST transition
Expected: Use stored timezone offset at creation time
Implementation: ISO timestamp preserves offset
```

#### Edge Case 5: Monthly Repeat on 31st
```
Scenario: Task repeats monthly on day 31
Expected: Skip months without day 31
Implementation: Check if day exists in target month
```

#### Edge Case 6: User Travels Across Timezones
```
Scenario: Task created in LA, user travels to NYC
Expected: Notification fires at equivalent local time
Implementation: ISO timestamp auto-converts
```

---

## 🚨 Critical Implementation Rules

### Rule 1: Never Infer Behavior
```typescript
// ❌ WRONG: Inferring default
if (!task.repeatType) {
    task.repeatType = 'DAILY';  // DON'T INFER!
}

// ✅ CORRECT: Explicit check
if (task.repeatType === 'DAILY') {
    // Only execute if explicitly set
}
```

### Rule 2: Never Modify Unrelated Configuration
```typescript
// ❌ WRONG: Modifying repeat when toggling active
toggleTaskActive: (id) => {
    task.isActive = !task.isActive;
    task.repeatType = 'NONE';  // DON'T MODIFY!
}

// ✅ CORRECT: Only toggle active state
toggleTaskActive: (id) => {
    task.isActive = !task.isActive;
    // Preserve all other configuration
}
```

### Rule 3: Always Check Active State
```typescript
// ❌ WRONG: Scheduling without checking
scheduleNotification(task);

// ✅ CORRECT: Check active state first
if (task.isActive) {
    scheduleNotification(task);
}
```

### Rule 4: Preserve Absolute Instant for Repeat
```typescript
// ❌ WRONG: Using wall-clock time
const next = new Date(task.scheduledDate);
next.setDate(next.getDate() + 1);

// ✅ CORRECT: Using ISO timestamp
const trigger = new Date(task.mainTrigger);
const next = new Date(trigger.getTime() + 86400000);
```

### Rule 5: Cancel All Notifications on Deactivate
```typescript
// ❌ WRONG: Only cancelling main notification
cancelNotification(task.mainNotificationId);

// ✅ CORRECT: Cancel all task notifications
cancelTaskNotifications(task.id);
```

---

## 📋 Implementation Checklist

### Before Starting
- [ ] Read Master Spec completely
- [ ] Understand all feature interactions
- [ ] Review timezone guide
- [ ] Set up test environment

### Phase 1: Foundation
- [ ] Update Task interface
- [ ] Add isActive field with default true
- [ ] Implement toggle action
- [ ] Create ActiveToggle component
- [ ] Update notification manager
- [ ] Add database migration
- [ ] Test all scenarios
- [ ] Verify backward compatibility

### Phase 2: Repeat Logic
- [ ] Define RepeatType enum
- [ ] Create RepeatConfig interface
- [ ] Implement next occurrence calculation
- [ ] Handle timezone correctly
- [ ] Add repeat UI
- [ ] Test all repeat types
- [ ] Verify DST handling

### Phase 3: Notify Before
- [ ] Add preNotifyOffsets field
- [ ] Implement offset calculation
- [ ] Schedule multiple notifications
- [ ] Handle past offsets
- [ ] Add offset picker UI
- [ ] Test with repeat
- [ ] Verify active state check

### Phase 4: Snooze
- [ ] Add snooze fields
- [ ] Implement snooze action
- [ ] Add snooze button to notification
- [ ] Create duration picker
- [ ] Handle snooze cancellation
- [ ] Test with active toggle
- [ ] Verify no repeat modification

### Phase 5: Integration
- [ ] Test all feature combinations
- [ ] Verify edge cases
- [ ] Check non-regression
- [ ] Update documentation
- [ ] Performance testing
- [ ] User acceptance testing

---

## 🎯 Success Metrics

### Functional Metrics
- [ ] All features work independently
- [ ] All features coordinate correctly
- [ ] No unintended side effects
- [ ] Backward compatibility maintained

### Quality Metrics
- [ ] Zero regressions in existing features
- [ ] All edge cases handled
- [ ] Timezone handling correct
- [ ] Performance acceptable

### User Experience Metrics
- [ ] UI is intuitive
- [ ] Feedback is clear
- [ ] Errors are handled gracefully
- [ ] Documentation is complete

---

## 🔄 Rollback Strategy

If issues arise during implementation:

### Phase 1 Rollback
- Remove isActive field
- Restore original notification logic
- Revert database migration

### Phase 2 Rollback
- Remove repeat fields
- Keep Phase 1 changes
- Disable repeat UI

### Phase 3 Rollback
- Remove preNotifyOffsets
- Keep Phase 1-2 changes
- Disable offset UI

### Phase 4 Rollback
- Remove snooze fields
- Keep Phase 1-3 changes
- Disable snooze UI

**Key Principle:** Each phase is independent and can be rolled back without affecting previous phases.

---

## 📚 Reference Documents

1. **Master Spec:** `NewFeatureImplementation.md`
2. **Timezone Guide:** `TIMEZONE_COMPLETE_GUIDE.md`
3. **Phase 1 Spec:** `PHASE_1_ACTIVE_INACTIVE_SPEC.md`
4. **Implementation Plan:** `REMINDER_SCHEDULING_IMPLEMENTATION_PLAN.md`

---

## 🚀 Next Steps

1. **Review this analysis** - Ensure understanding of all requirements
2. **Choose starting phase** - Recommend Phase 1
3. **Set up test environment** - Prepare for testing
4. **Begin implementation** - Follow phase spec exactly
5. **Test thoroughly** - Verify each step
6. **Move to next phase** - Only after current phase is complete

---

**Ready to begin? Reply with "Start Phase 1" to proceed with implementation.**
