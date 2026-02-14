# RevenueCat Monetization Implementation Guide

## Overview

This guide walks you through adding a subscription model to your Cronos app using RevenueCat.

---

## Prerequisites

### 1. RevenueCat Account Setup

**Step 1: Create RevenueCat Account**
1. Go to https://app.revenuecat.com/signup
2. Sign up for a free account
3. Create a new project called "Cronos"

**Step 2: Get Your API Keys**
1. In RevenueCat dashboard, go to **Project Settings** → **API Keys**
2. Copy these keys (you'll need them later):
   - **Public SDK Key (iOS)** - starts with `appl_`
   - **Public SDK Key (Android)** - starts with `goog_`

**Step 3: Create Products**
1. Go to **Products** in RevenueCat dashboard
2. Create two products:
   - **Monthly Pro**: `pro_monthly` - $9.99/month
   - **Annual Pro**: `pro_annual` - $99.99/year

**Step 4: Create Entitlement**
1. Go to **Entitlements**
2. Create entitlement called: `pro`
3. Attach both products to this entitlement

**Step 5: Create Offering**
1. Go to **Offerings**
2. Create offering called: `default`
3. Add both packages:
   - Package 1: `$rc_monthly` → `pro_monthly`
   - Package 2: `$rc_annual` → `pro_annual`

### 2. App Store Connect Setup (iOS)

**Step 1: Create App in App Store Connect**
1. Go to https://appstoreconnect.apple.com
2. Create new app with bundle ID: `com.anonymous.cronos-app`

**Step 2: Create In-App Purchases**
1. Go to your app → **In-App Purchases**
2. Create two **Auto-Renewable Subscriptions**:
   - Product ID: `pro_monthly` - $9.99/month
   - Product ID: `pro_annual` - $99.99/year
3. Create a **Subscription Group** called "Pro Subscription"
4. Add both subscriptions to this group

**Step 3: Link to RevenueCat**
1. In RevenueCat dashboard, go to **Project Settings** → **Apple App Store**
2. Enter your **App Store Connect credentials**
3. RevenueCat will sync your products automatically

### 3. Google Play Console Setup (Android)

**Step 1: Create App in Google Play Console**
1. Go to https://play.google.com/console
2. Create new app with package name: `com.anonymous.cronosapp`

**Step 2: Create Subscriptions**
1. Go to **Monetize** → **Subscriptions**
2. Create two subscriptions:
   - Product ID: `pro_monthly` - $9.99/month
   - Product ID: `pro_annual` - $99.99/year

**Step 3: Link to RevenueCat**
1. In RevenueCat dashboard, go to **Project Settings** → **Google Play**
2. Upload your **Service Account JSON** file
3. RevenueCat will sync your products

---

## Installation Steps

### Step 1: Install RevenueCat SDK

```bash
cd cronos-app
npx expo install react-native-purchases
```

This installs the RevenueCat SDK compatible with your Expo SDK 54.

### Step 2: Add API Keys to Constants

Open `cronos-app/core/constants.ts` and add:

```typescript
// RevenueCat API Keys
export const REVENUECAT_API_KEY_IOS = 'appl_YOUR_KEY_HERE';
export const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_KEY_HERE';
```

Replace with your actual keys from RevenueCat dashboard.

### Step 3: Rebuild Native Apps

**IMPORTANT:** RevenueCat requires native code. You CANNOT test in Expo Go!

```bash
# iOS
npx expo run:ios

# Android
./run-android.sh
```

This rebuilds your app with RevenueCat native modules.

---

## Implementation Overview

### Files Created/Modified

**New Files:**
1. `core/store/useProStore.ts` - Pro subscription state management
2. `services/PurchaseService.ts` - RevenueCat SDK wrapper
3. `components/PaywallModal.tsx` - Subscription purchase UI
4. `components/ProBadge.tsx` - Visual indicator for Pro users

**Modified Files:**
1. `app/index.tsx` - Gate features behind Pro subscription
2. `core/constants.ts` - Add RevenueCat API keys

### Architecture

```
┌─────────────────────────────────────────┐
│         App Launch                      │
│  PurchaseService.initialize()           │
│  useProStore.checkProStatus()           │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│      User Taps Voice Button             │
└─────────────────────────────────────────┘
                    │
                    ▼
         ┌──────────────────┐
         │  Is User Pro?    │
         └──────────────────┘
              │         │
         NO   │         │  YES
              ▼         ▼
    ┌──────────────┐  ┌──────────────┐
    │ Show Paywall │  │ Allow Voice  │
    └──────────────┘  └──────────────┘
              │
              ▼
    ┌──────────────────────┐
    │ User Selects Package │
    │ (Monthly/Annual)     │
    └──────────────────────┘
              │
              ▼
    ┌──────────────────────┐
    │ Native Purchase Flow │
    │ (Apple/Google)       │
    └──────────────────────┘
              │
              ▼
    ┌──────────────────────┐
    │ RevenueCat Validates │
    │ Grants "pro"         │
    └──────────────────────┘
              │
              ▼
    ┌──────────────────────┐
    │ useProStore Updates  │
    │ isPro = true         │
    └──────────────────────┘
              │
              ▼
    ┌──────────────────────┐
    │ User Can Use Voice!  │
    └──────────────────────┘
```

---

## Feature Gating Strategy

### Free Users Can:
- ✅ View tasks
- ✅ Add tasks manually (+ button)
- ✅ Edit/delete tasks
- ✅ Mark tasks complete
- ✅ See notifications

### Pro Users Get:
- ✨ **AI Voice Input** - Create tasks by speaking
- ✨ **Cloud Sync** - Sync across devices (already implemented)
- ✨ **Unlimited Tasks** - No limits (optional future feature)
- ✨ **Priority Support** - Email support

### Gated Features:
1. **Voice Input Button** - Shows paywall if free
2. **Cloud Sync Button** - Shows paywall if free (optional)

---

## Testing Strategy

### Development Testing

**Step 1: Enable Sandbox Testing**

**iOS:**
1. Settings → App Store → Sandbox Account
2. Sign in with test Apple ID

**Android:**
1. Add your Google account to license testers
2. Use that account on test device

**Step 2: Test Purchase Flow**

```bash
# Start dev server
npx expo start --dev-client

# Open on device (NOT Expo Go!)
# Press 'i' for iOS or 'a' for Android
```

**Step 3: Test Scenarios**

1. **First Launch (Free User)**
   - Tap voice button → Should show paywall
   - Verify "Free" badge in header

2. **Purchase Monthly**
   - Tap "Monthly Pro" in paywall
   - Complete sandbox purchase
   - Verify "Pro" badge appears
   - Tap voice button → Should work!

3. **Restore Purchases**
   - Uninstall app
   - Reinstall
   - Tap "Restore Purchases"
   - Verify Pro status restored

4. **Cancel Subscription**
   - Cancel in App Store/Play Store
   - Wait for expiration
   - Verify reverts to Free

### Production Testing

**Step 1: TestFlight (iOS)**
```bash
# Build for TestFlight
eas build --platform ios --profile production
```

**Step 2: Internal Testing (Android)**
```bash
# Build for Play Store
eas build --platform android --profile production
```

---

## Debug Logs

RevenueCat logs are enabled in development. Look for:

```
[RevenueCat] Configuring SDK...
[RevenueCat] SDK configured successfully
[RevenueCat] Checking entitlements...
[RevenueCat] User has entitlement: pro
[RevenueCat] Fetching offerings...
[RevenueCat] Offerings loaded: 2 packages
[RevenueCat] Purchase started: pro_monthly
[RevenueCat] Purchase successful!
```

---

## Common Issues & Solutions

### Issue 1: "Cannot test in Expo Go"
**Solution:** You MUST rebuild native app:
```bash
npx expo run:ios
./run-android.sh
```

### Issue 2: "No products found"
**Solution:** 
- Verify products created in App Store Connect / Play Console
- Check RevenueCat dashboard shows products
- Wait 24 hours for Apple to process new products

### Issue 3: "Purchase fails in sandbox"
**Solution:**
- Sign out of real App Store account
- Sign in with sandbox test account
- Clear app data and retry

### Issue 4: "Entitlement not granted"
**Solution:**
- Check product IDs match exactly
- Verify entitlement "pro" exists in RevenueCat
- Check offering includes both packages

### Issue 5: "Restore doesn't work"
**Solution:**
- Must use same Apple ID / Google account
- Subscription must be active
- Check RevenueCat dashboard for customer

---

## Revenue Tracking

### RevenueCat Dashboard

Monitor these metrics:
- **Active Subscriptions** - Current paying users
- **MRR (Monthly Recurring Revenue)** - Monthly income
- **Churn Rate** - Cancellation rate
- **Trial Conversions** - Free to paid conversion

### Analytics Events

The implementation tracks:
- `paywall_shown` - User saw paywall
- `purchase_started` - User tapped package
- `purchase_completed` - Successful purchase
- `purchase_cancelled` - User cancelled
- `restore_started` - User tapped restore
- `restore_completed` - Restore successful

---

## Pricing Strategy

### Recommended Pricing:
- **Monthly:** $9.99/month
- **Annual:** $99.99/year (save 17%)

### Why This Pricing?
- Industry standard for productivity apps
- Annual plan incentivizes long-term commitment
- Competitive with similar apps

### Future Pricing Options:
- **Lifetime:** $199.99 one-time
- **Free Trial:** 7 days free, then $9.99/month
- **Family Plan:** $14.99/month for 5 users

---

## Next Steps

### Phase 1: Basic Implementation (This PR)
- ✅ Install RevenueCat SDK
- ✅ Create Pro store
- ✅ Build paywall UI
- ✅ Gate voice input feature
- ✅ Test purchase flow

### Phase 2: Enhanced Features
- Add free trial (7 days)
- Add promotional offers
- Add referral system
- Add usage analytics

### Phase 3: Optimization
- A/B test pricing
- Optimize paywall copy
- Add social proof
- Implement win-back campaigns

---

## Support

### RevenueCat Resources:
- **Docs:** https://docs.revenuecat.com
- **Community:** https://community.revenuecat.com
- **Support:** support@revenuecat.com

### Implementation Help:
- Check debug logs in console
- Review RevenueCat dashboard
- Test in sandbox environment first

---

## Summary Checklist

Before going live:

**RevenueCat Setup:**
- [ ] Account created
- [ ] API keys added to constants.ts
- [ ] Products created (monthly/annual)
- [ ] Entitlement "pro" created
- [ ] Offering "default" created

**App Store Setup:**
- [ ] App created in App Store Connect
- [ ] In-app purchases created
- [ ] Subscription group created
- [ ] Linked to RevenueCat

**Google Play Setup:**
- [ ] App created in Play Console
- [ ] Subscriptions created
- [ ] Service account linked to RevenueCat

**Code Implementation:**
- [ ] RevenueCat SDK installed
- [ ] PurchaseService created
- [ ] useProStore created
- [ ] PaywallModal created
- [ ] Features gated

**Testing:**
- [ ] Tested in sandbox (iOS)
- [ ] Tested in sandbox (Android)
- [ ] Tested restore purchases
- [ ] Tested subscription expiration
- [ ] Verified analytics tracking

**Production:**
- [ ] TestFlight build uploaded
- [ ] Internal testing completed
- [ ] App Store submission
- [ ] Play Store submission

---

## Estimated Timeline

- **Setup (RevenueCat + Stores):** 2-3 hours
- **Implementation:** 1-2 hours (code provided)
- **Testing:** 1-2 hours
- **App Store Review:** 1-3 days
- **Total:** ~1 week to production

---

## Revenue Projections

**Conservative Estimate:**
- 1000 users
- 5% conversion rate = 50 paying users
- Average $9.99/month
- **MRR: $499.50/month**
- **ARR: $5,994/year**

**Optimistic Estimate:**
- 10,000 users
- 10% conversion rate = 1000 paying users
- 60% monthly, 40% annual
- **MRR: $7,992/month**
- **ARR: $95,904/year**

---

Ready to implement! 🚀
