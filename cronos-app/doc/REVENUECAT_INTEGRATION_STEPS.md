# RevenueCat Integration - Step by Step

## What We've Created

### 1. New Files Created:
- ✅ `services/PurchaseService.ts` - RevenueCat SDK wrapper
- ✅ `core/store/useProStore.ts` - Pro subscription state management
- ✅ `components/PaywallModal.tsx` - Subscription purchase UI
- ✅ `components/ProBadge.tsx` - Pro/Free badge component
- ✅ `REVENUECAT_IMPLEMENTATION_GUIDE.md` - Complete setup guide

### 2. Files Modified:
- ✅ `core/constants.ts` - Added RevenueCat API keys placeholders

### 3. Files to Modify (Next Steps):
- ⏳ `app/index.tsx` - Initialize RevenueCat & gate features
- ⏳ `components/VoiceInputButton.tsx` - Check Pro status before recording

---

## Installation Command

Run this command to install RevenueCat SDK:

```bash
cd cronos-app
npx expo install react-native-purchases
```

---

## Next Steps

### Step 1: Install RevenueCat SDK

```bash
cd cronos-app
npx expo install react-native-purchases
```

### Step 2: Add Your API Keys

Open `cronos-app/core/constants.ts` and replace:

```typescript
export const REVENUECAT_API_KEY_IOS = 'appl_YOUR_KEY_HERE';
export const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_KEY_HERE';
```

With your actual keys from RevenueCat dashboard.

### Step 3: Modify app/index.tsx

Add these imports at the top:

```typescript
import { PaywallModal } from '../components/PaywallModal';
import { ProBadge } from '../components/ProBadge';
import { useProStore } from '../core/store/useProStore';
import { initializePurchases } from '../services/PurchaseService';
```

Add state for paywall:

```typescript
const [isPaywallVisible, setIsPaywallVisible] = useState(false);
const { isPro, checkProStatus } = useProStore();
```

Add RevenueCat initialization in useEffect:

```typescript
// Initialize RevenueCat on app launch
useEffect(() => {
    const initRevenueCat = async () => {
        try {
            await initializePurchases(userId || undefined);
            await checkProStatus();
        } catch (error) {
            console.error('[HomeScreen] RevenueCat init error:', error);
        }
    };
    
    initRevenueCat();
}, [userId]);
```

Add ProBadge to header (replace the header View):

```typescript
<View className="flex-row items-center justify-between px-5 pt-16 pb-4 border-b border-zinc-100 dark:border-zinc-800">
    <View className="flex-row items-center gap-3">
        <Text className="text-2xl font-bold text-zinc-900 dark:text-white">
            Cronos
        </Text>
        <ProBadge />
    </View>
    
    {/* Rest of header... */}
</View>
```

Add PaywallModal at the bottom (before closing View):

```typescript
<PaywallModal
    visible={isPaywallVisible}
    onClose={() => setIsPaywallVisible(false)}
/>
```

### Step 4: Modify components/VoiceInputButton.tsx

Add these imports:

```typescript
import { useProStore } from '../core/store/useProStore';
```

Add Pro check in the component:

```typescript
export function VoiceInputButton() {
    const { state, startRecording, stopRecordingAndProcess } = useVoiceInput();
    const { addTask } = useTaskStore();
    const { isPro } = useProStore();
    const [showPaywall, setShowPaywall] = useState(false);
    const scale = useSharedValue(1);
```

Modify handlePress to check Pro status:

```typescript
const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (state.isRecording) {
        // Stop recording and process (existing code)
        // ...
    } else {
        // Check if user is Pro before starting recording
        if (!isPro) {
            console.log('[VoiceInputButton] User is not Pro, showing paywall');
            setShowPaywall(true);
            return;
        }
        
        // Start recording (existing code)
        console.log('[VoiceInputButton] Starting recording...');
        await startRecording();
    }
};
```

Add PaywallModal at the end:

```typescript
return (
    <>
        <Animated.View style={animatedStyle}>
            {/* Existing button code */}
        </Animated.View>
        
        <PaywallModal
            visible={showPaywall}
            onClose={() => setShowPaywall(false)}
        />
    </>
);
```

### Step 5: Rebuild Native Apps

**CRITICAL:** RevenueCat requires native code. You MUST rebuild:

```bash
# iOS
npx expo run:ios

# Android
./run-android.sh
```

---

## Testing Checklist

After rebuilding, test these scenarios:

### 1. Free User Flow
- [ ] Launch app
- [ ] See "Free" badge in header
- [ ] Tap voice button
- [ ] Paywall appears
- [ ] Can close paywall

### 2. Purchase Flow
- [ ] Open paywall
- [ ] See Monthly and Annual options
- [ ] Select Annual (should be pre-selected)
- [ ] Tap "Start Pro Subscription"
- [ ] Complete sandbox purchase
- [ ] See "Pro" badge appear
- [ ] Tap voice button - should work!

### 3. Restore Flow
- [ ] Uninstall app
- [ ] Reinstall app
- [ ] Tap voice button (shows paywall)
- [ ] Tap "Restore Purchases"
- [ ] See "Pro" badge appear
- [ ] Voice button works

### 4. Subscription Management
- [ ] Cancel subscription in App Store/Play Store
- [ ] Wait for expiration
- [ ] App reverts to Free
- [ ] Voice button shows paywall again

---

## Debug Logs to Watch

Look for these logs in console:

```
[RevenueCat] Initializing SDK...
[RevenueCat] SDK initialized successfully
[ProStore] Checking Pro status...
[ProStore] Pro status updated: false
[VoiceInputButton] User is not Pro, showing paywall
[PaywallModal] Loading offerings...
[RevenueCat] Found 2 packages
[RevenueCat] Purchase started: pro_annual
[RevenueCat] Purchase successful! User is now Pro
[ProStore] Pro status updated: true
```

---

## Common Issues

### "Cannot find module 'react-native-purchases'"
**Solution:** Run `npx expo install react-native-purchases` and rebuild

### "API key not configured"
**Solution:** Add your RevenueCat API keys to `core/constants.ts`

### "No offerings found"
**Solution:** 
1. Check RevenueCat dashboard has products
2. Verify offering "default" exists
3. Wait 24 hours for Apple to process products

### "Purchase fails immediately"
**Solution:**
1. Make sure you're using sandbox test account
2. Sign out of real App Store account
3. Clear app data and retry

---

## File Structure After Implementation

```
cronos-app/
├── services/
│   ├── OpenAIService.ts
│   ├── SyncService.ts
│   └── PurchaseService.ts ✨ NEW
├── core/
│   ├── store/
│   │   ├── useTaskStore.ts
│   │   └── useProStore.ts ✨ NEW
│   └── constants.ts (modified)
├── components/
│   ├── VoiceInputButton.tsx (modified)
│   ├── PaywallModal.tsx ✨ NEW
│   └── ProBadge.tsx ✨ NEW
└── app/
    └── index.tsx (modified)
```

---

## Revenue Potential

With 1000 users and 5% conversion:
- 50 paying users
- $9.99/month average
- **$499.50 MRR**
- **$5,994 ARR**

With 10,000 users and 10% conversion:
- 1000 paying users
- Mix of monthly/annual
- **$7,992 MRR**
- **$95,904 ARR**

---

## Support

Need help? Check:
1. RevenueCat docs: https://docs.revenuecat.com
2. Debug logs in console
3. RevenueCat dashboard for customer info
4. This guide's troubleshooting section

---

Ready to monetize! 🚀💰
