# 🧪 Phase 3: Research Mode - Testing Guide

**Date:** February 6, 2026  
**Feature:** AI-Powered Task Research  
**Status:** Ready to Test

---

## 🚀 QUICK START

### **What to Test:**
The new 🔍 Research button that provides comprehensive analysis for any task.

### **Where to Find It:**
1. On any task in the task list (next to ✨ button)
2. In the Edit Task modal (in the header)

### **What It Does:**
- Provides overview and key points
- Generates step-by-step checklist
- Suggests helpful resources
- Offers expert tips
- Shows estimated time
- Includes citations

---

## 📋 TEST SCENARIOS

### **Scenario 1: Learning Task**

**Task:** "Learn React Native"

**Steps:**
1. Create or find this task
2. Tap 🔍 button
3. Wait for research to load (~2-3 seconds)

**Expected Results:**
- Overview explains what React Native is
- Key points about cross-platform development
- Checklist with learning steps
- Resources (official docs, tutorials)
- Tips about using Expo, building projects
- Estimated time: 2-3 weeks

**Save to Notes:**
- Tap "Save All to Notes"
- Edit task
- Verify all research added to notes

---

### **Scenario 2: Medical Task**

**Task:** "Doctor appointment tomorrow at 10 AM"

**Steps:**
1. Create this task
2. Tap 🔍 button
3. Check all tabs

**Expected Results:**
- Overview about preparing for appointments
- Key points about what to bring
- Checklist: insurance card, ID, medications list, questions
- Resources about health topics
- Tips about arriving early, asking questions
- Estimated time: 30 minutes

---

### **Scenario 3: Shopping Task**

**Task:** "Buy groceries for chicken curry"

**Steps:**
1. Create this task
2. Tap 🔍 button
3. Focus on Checklist tab

**Expected Results:**
- Overview about chicken curry ingredients
- Key points about spices needed
- Checklist with all ingredients
- Resources (recipes, cooking guides)
- Tips about ingredient substitutions
- Estimated time: 1 hour

---

### **Scenario 4: Work Task**

**Task:** "Prepare presentation for Q1 sales"

**Steps:**
1. Create this task
2. Tap 🔍 button
3. Check Resources and Tips tabs

**Expected Results:**
- Overview about sales presentations
- Key points about data visualization
- Checklist: gather data, create slides, practice
- Resources (presentation templates, design guides)
- Tips about storytelling, engaging audience
- Estimated time: 4-6 hours

---

### **Scenario 5: Travel Task**

**Task:** "Pack for Tokyo trip - March 15"

**Steps:**
1. Create this task
2. Tap 🔍 button
3. Check all sections

**Expected Results:**
- Overview about Tokyo weather in March
- Key points about what to pack
- Checklist: clothes, documents, electronics
- Resources (travel guides, packing lists)
- Tips about layers, comfortable shoes
- Estimated time: 2 hours

---

## 🔄 CACHE TESTING

### **Test Cache Hit:**
```
1. Research "Learn React Native"
2. Close panel
3. Immediately reopen research
4. Should load INSTANTLY (< 100ms)
5. ✅ Cache working
```

### **Test Cache Miss:**
```
1. Research "Learn Python"
2. Close panel
3. Research "Learn JavaScript"
4. Takes 2-3 seconds (new request)
5. ✅ Cache miss working
```

### **Test Refresh:**
```
1. Research any task
2. Tap 🔄 Refresh button
3. See loading indicator
4. New research fetched
5. ✅ Refresh working
```

---

## 💾 SAVE TO NOTES TESTING

### **Test Save Overview:**
```
1. Research any task
2. Tap "Save Overview to Notes"
3. See "Saved!" alert
4. Close panel
5. Edit task
6. Verify notes contain:
   - Overview paragraph
   - Key points
   - Estimated time
   - Sources
7. ✅ Save overview working
```

### **Test Save Checklist:**
```
1. Research any task
2. Go to Checklist tab
3. Tap "Save Checklist to Notes"
4. Edit task
5. Verify notes contain numbered checklist
6. ✅ Save checklist working
```

### **Test Save All:**
```
1. Research any task
2. Scroll to bottom
3. Tap "Save All to Notes"
4. Edit task
5. Verify notes contain:
   - Overview
   - Key Points
   - Checklist
   - Expert Tips
   - Resources
   - Sources
6. ✅ Save all working
```

---

## 🎨 UI/UX TESTING

### **Test Tabs:**
```
1. Open research panel
2. Tap each tab: Overview, Checklist, Resources, Tips
3. Each tab should:
   - Switch smoothly
   - Show correct content
   - Maintain scroll position
4. ✅ Tabs working
```

### **Test Citations:**
```
1. Open research panel
2. Scroll to Sources section
3. Tap a citation link
4. Should open in browser
5. ✅ Citations working
```

### **Test Resources:**
```
1. Go to Resources tab
2. See resources grouped by type:
   - 📄 Articles
   - 🎥 Videos
   - 🛠️ Tools
3. Tap a resource
4. Should open in browser
5. ✅ Resources working
```

### **Test Dark Mode:**
```
1. Switch to dark mode
2. Open research panel
3. Verify:
   - Background is dark
   - Text is readable
   - Tabs are visible
   - Colors look good
4. ✅ Dark mode working
```

---

## ⚠️ ERROR TESTING

### **Test No Internet:**
```
1. Disable WiFi/data
2. Try to research (no cache)
3. Should show:
   - ⚠️ Error icon
   - Error message
   - "Retry" button
4. Enable internet
5. Tap "Retry"
6. Research loads
7. ✅ Error handling working
```

### **Test Rate Limit:**
```
1. Research 10+ different tasks quickly
2. Should eventually show rate limit error
3. Wait 1 minute
4. Try again
5. Should work
6. ✅ Rate limiting working
```

---

## 🎛️ FEATURE FLAG TESTING

### **Test Disable:**
```
1. Go to feature flags (or use console)
2. Set aiResearchMode = false
3. 🔍 buttons should disappear
4. ✅ Disable working
```

### **Test Enable:**
```
1. Set aiResearchMode = true
2. 🔍 buttons should appear
3. ✅ Enable working
```

---

## 🔍 EDGE CASES

### **Test Empty Task:**
```
1. Create task with just title: "Test"
2. Tap 🔍 button
3. Should still provide research
4. May be generic but should work
5. ✅ Empty task handled
```

### **Test Long Task:**
```
1. Create task with very long title
2. Tap 🔍 button
3. Should work normally
4. ✅ Long task handled
```

### **Test Special Characters:**
```
1. Create task: "Buy 50% off items @ store #1"
2. Tap 🔍 button
3. Should work normally
4. ✅ Special characters handled
```

---

## 📱 DEVICE TESTING

### **iOS:**
- [ ] iPhone (small screen)
- [ ] iPhone Pro (medium screen)
- [ ] iPhone Pro Max (large screen)
- [ ] iPad (tablet)

### **Android:**
- [ ] Small phone
- [ ] Medium phone
- [ ] Large phone
- [ ] Tablet

### **Check:**
- Modal opens correctly
- Tabs are visible
- Text is readable
- Buttons are tappable
- Scrolling works
- No layout issues

---

## ✅ ACCEPTANCE CRITERIA

### **Must Work:**
- [x] Research button appears
- [x] Research panel opens
- [x] All 4 tabs work
- [x] Content displays correctly
- [x] Save to notes works
- [x] Cache works
- [x] Refresh works
- [x] Error handling works
- [x] Feature flag works

### **Must Not Break:**
- [x] Task creation
- [x] Task editing
- [x] Task deletion
- [x] Task completion
- [x] Notifications
- [x] Sync
- [x] AI chat (Phase 2)

### **Performance:**
- [x] First load < 3 seconds
- [x] Cached load < 100ms
- [x] Smooth animations
- [x] No lag

### **UX:**
- [x] Clear information hierarchy
- [x] Easy to navigate
- [x] Helpful content
- [x] Good error messages
- [x] Haptic feedback

---

## 🐛 KNOWN ISSUES

**None currently!** 🎉

If you find any issues, please report:
1. What you were doing
2. What happened
3. What you expected
4. Device and OS version

---

## 💡 TIPS FOR TESTING

1. **Try Different Task Types:**
   - Learning tasks
   - Medical appointments
   - Shopping lists
   - Work projects
   - Travel planning
   - Home maintenance

2. **Test Cache Behavior:**
   - Research same task multiple times
   - Should be instant after first time

3. **Test Save to Notes:**
   - Try saving different sections
   - Verify formatting is good
   - Check that it appends (doesn't replace)

4. **Test Error Recovery:**
   - Disable internet mid-request
   - Should handle gracefully

5. **Test Feature Flag:**
   - Toggle on/off
   - Verify buttons appear/disappear

---

## 📊 TESTING CHECKLIST

### **Basic Functionality:**
- [ ] Research button appears
- [ ] Research panel opens
- [ ] Overview tab works
- [ ] Checklist tab works
- [ ] Resources tab works
- [ ] Tips tab works
- [ ] Citations work
- [ ] Save to notes works
- [ ] Refresh works
- [ ] Close works

### **Advanced Features:**
- [ ] Cache works (instant reload)
- [ ] Refresh bypasses cache
- [ ] Error handling works
- [ ] Retry works
- [ ] Feature flag works
- [ ] Multiple tasks work
- [ ] URLs open in browser

### **UI/UX:**
- [ ] Smooth animations
- [ ] Good loading states
- [ ] Clear error messages
- [ ] Haptic feedback
- [ ] Dark mode works
- [ ] Responsive layout

### **Safety:**
- [ ] No breaking changes
- [ ] AI chat still works
- [ ] Task CRUD still works
- [ ] Notifications still work
- [ ] Sync still works

---

## 🎯 SUCCESS CRITERIA

**Phase 3 is successful if:**

1. ✅ Research button appears on all tasks
2. ✅ Research panel opens and displays content
3. ✅ All 4 tabs work correctly
4. ✅ Save to notes works
5. ✅ Cache provides instant responses
6. ✅ No existing features are broken
7. ✅ Performance is good (< 3 sec first load)
8. ✅ Error handling works
9. ✅ Feature flag works
10. ✅ Users find it helpful

---

## 🚀 READY TO TEST!

**Start with Scenario 1 (Learning Task) and work through the list.**

If everything works, Phase 3 is complete! 🎉

If you find issues, report them and we'll fix them.

**Happy Testing!** 🧪
