# RevenueCat Implementation Checklist

## ✅ Completed (By AI)

- [x] Created `services/PurchaseService.ts` - RevenueCat SDK wrapper
- [x] Created `core/store/useProStore.ts` - Pro state management
- [x] Created `components/PaywallModal.tsx` - Subscription UI
- [x] Created `components/ProBadge.tsx` - Pro/Free badge
- [x] Modified `core/constants.ts` - Added API key placeholders
- [x] Created `REVENUECAT_IMPLEMENTATION_GUIDE.md` - Complete setup guide
- [x] Created `REVENUECAT_INTEGRATION_STEPS.md` - Step-by-step integration
- [x] Created `MONETIZATION_SUMMARY.md` - Quick overview
- [x] Created `INSTALL_REVENUECAT.sh` - Installation script

## 📋 Your Tasks

### Phase 1: Setup (2-3 hours)

#### RevenueCat Account
- [ ] Create account at https://app.revenuecat.com/signup
- [ ] Create project "Cronos"
- [ ] Get API keys (iOS & Android)
- [ ] Create products:
  - [ ] `pro_monthly` - $9.99/month
  - [ ] `pro_annual` - $99.99/year
- [ ] Create entitlement: `pro`
- [ ] Create offering: `default`
- [ ] Attach products to offering

#### App Store Connect (iOS)
- [ ] Create app with bundle ID: `com.anonymous.cronos-app`
- [ ] Create subscription group: "Pro Subscription"
- [ ] Create in-app purchases:
  - [ ] `pro_monthly` - $9.99/month
  - [ ] `pro_annual` - $99.99/year
- [ ] Link to RevenueCat

#### Google Play Console (Android)
- [ ] Create app with package: `com.anonymous.cronosapp`
- [ ] Create subscriptions:
  - [ ] `pro_monthly` - $9.99/month
  - [ ] `pro_annual` - $99.99/year
- [ ] Upload service account JSON to RevenueCat
- [ ] Link to RevenueCat

### Phase 2: Installation (15 minutes)

- [ ] Run: `./INSTALL_REVENUECAT.sh` or `npx expo install react-native-purchases`
- [ ] Add RevenueCat API keys to `core/constants.ts`:
  ```typescript
  export const REVENUECAT_API_KEY_IOS = 'appl_YOUR_ACTUAL_KEY';
  export const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_ACTUAL_KEY';
  ```

### Phase 3: Code Integration (30 minutes)

#### Modify `app/index.tsx`

**Add imports:**
```typescript
import { PaywallModal } from '../components/PaywallModal';
import { ProBadge } from '../components/ProBadge';
import { useProStore } from '../core/store/useProStore';
import { initializePurchases } from '../services/PurchaseService';
```

**Add state:**
```typescript
const [isPaywallVisible, setIsPaywallVisible] = useState(false);
const { isPro, checkProStatus } = useProStore();
```

**Add initialization:**
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

**Add ProBadge to header:**
```typescript
<View className="flex-row items-center gap-3">
    <Text className="text-2xl font-bold text-zinc-900 dark:text-white">
        Cronos
    </Text>
    <ProBadge />
</View>
```

**Add PaywallModal before closing View:**
```typescript
<PaywallModal
    visible={isPaywallVisible}
    onClose={() => setIsPaywallVisible(false)}
/>
```

#### Modify `components/VoiceInputButton.tsx`

**Add imports:**
```typescript
import { useProStore } from '../core/store/useProStore';
import { PaywallModal } from './PaywallModal';
```

**Add state:**
```typescript
const { isPro } = useProStore();
const [showPaywall, setShowPaywall] = useState(false);
```

**Modify handlePress:**
```typescript
const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (state.isRecording) {
        // Existing stop recording code...
    } else {
        // Check Pro status before recording
        if (!isPro) {
            console.log('[VoiceInputButton] User is not Pro, showing paywall');
            setShowPaywall(true);
            return;
        }
        
        // Existing start recording code...
    }
};
```

**Add PaywallModal:**
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

### Phase 4: Rebuild (10 minutes)

**CRITICAL:** RevenueCat requires native code!

- [ ] iOS: `npx expo run:ios`
- [ ] Android: `./run-android.sh`

### Phase 5: Testing (1 hour)

#### Free User Flow
- [ ] Launch app
- [ ] See "Free" badge in header
- [ ] Tap voice button
- [ ] Paywall appears
- [ ] Can close paywall
- [ ] Voice button still shows paywall

#### Purchase Flow (Sandbox)
- [ ] Setup sandbox account (iOS) or test account (Android)
- [ ] Open paywall
- [ ] See Monthly and Annual options
- [ ] Prices load from RevenueCat
- [ ] Select Annual
- [ ] Tap "Start Pro Subscription"
- [ ] Complete sandbox purchase
- [ ] See "Pro" badge appear
- [ ] Tap voice button - works!
- [ ] Can record voice commands

#### Restore Flow
- [ ] Uninstall app
- [ ] Reinstall app
- [ ] See "Free" badge
- [ ] Tap voice button (shows paywall)
- [ ] Tap "Restore Purchases"
- [ ] See "Pro" badge appear
- [ ] Voice button works

#### Subscription Management
- [ ] Cancel subscription in store
- [ ] Wait for expiration (or use RevenueCat sandbox)
- [ ] App reverts to "Free"
- [ ] Voice button shows paywall again

### Phase 6: Production (1 week)

- [ ] TestFlight build (iOS)
- [ ] Internal testing track (Android)
- [ ] Test with real purchases
- [ ] Submit to App Store
- [ ] Submit to Play Store
- [ ] Monitor RevenueCat dashboard
- [ ] Track conversion rates

## 🐛 Troubleshooting

### Issue: "Cannot test in Expo Go"
- [x] This is expected - RevenueCat needs native code
- [ ] Solution: Rebuild with `npx expo run:ios` or `./run-android.sh`

### Issue: "No products found"
- [ ] Check products exist in App Store Connect / Play Console
- [ ] Verify products synced to RevenueCat dashboard
- [ ] Wait 24 hours for Apple to process new products
- [ ] Check product IDs match exactly

### Issue: "Purchase fails"
- [ ] Sign out of real App Store account
- [ ] Sign in with sandbox test account
- [ ] Clear app data and retry
- [ ] Check console logs for errors

### Issue: "Entitlement not granted"
- [ ] Verify "pro" entitlement exists in RevenueCat
- [ ] Check products attached to entitlement
- [ ] Verify offering includes packages
- [ ] Check RevenueCat dashboard for customer

## 📊 Success Metrics

Track these in RevenueCat dashboard:

- [ ] Active Subscriptions
- [ ] Monthly Recurring Revenue (MRR)
- [ ] Conversion Rate (Free → Pro)
- [ ] Churn Rate
- [ ] Average Revenue Per User (ARPU)

## 🎯 Goals

### Month 1:
- [ ] 100 users
- [ ] 5% conversion = 5 Pro users
- [ ] $50 MRR

### Month 3:
- [ ] 1,000 users
- [ ] 7% conversion = 70 Pro users
- [ ] $700 MRR

### Month 6:
- [ ] 5,000 users
- [ ] 10% conversion = 500 Pro users
- [ ] $5,000 MRR

### Year 1:
- [ ] 10,000+ users
- [ ] 10%+ conversion = 1,000+ Pro users
- [ ] $10,000+ MRR
- [ ] $120,000+ ARR

## 📚 Resources

- **RevenueCat Docs:** https://docs.revenuecat.com
- **Community:** https://community.revenuecat.com
- **Support:** support@revenuecat.com

## ✨ Final Check

Before going live:

- [ ] All code integrated
- [ ] Native apps rebuilt
- [ ] Sandbox testing complete
- [ ] API keys configured
- [ ] Products created in stores
- [ ] RevenueCat dashboard configured
- [ ] TestFlight/Internal testing done
- [ ] App Store/Play Store submissions ready

---

**Estimated Total Time:** 4-6 hours
**Estimated Time to Production:** 1 week
**Estimated Revenue (Year 1):** $5,000 - $100,000+

🚀 Ready to monetize! Let's go! 💰
