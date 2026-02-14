/**
 * PurchaseService - RevenueCat SDK Wrapper
 * 
 * IMPORTANT: This service requires native code and CANNOT be tested in Expo Go.
 * You must rebuild the native app to test purchases:
 * - iOS: npx expo run:ios
 * - Android: ./run-android.sh
 * 
 * Make sure to add your RevenueCat API keys to core/constants.ts before testing.
 */

import Purchases, {
    CustomerInfo,
    PurchasesOffering,
    PurchasesPackage,
    LOG_LEVEL,
} from 'react-native-purchases';
import { Platform, Alert } from 'react-native';
import { REVENUECAT_API_KEY_IOS, REVENUECAT_API_KEY_ANDROID } from '../core/constants';

// Entitlement identifier from RevenueCat dashboard
export const PRO_ENTITLEMENT_ID = 'pro';

// Flag to track if we've shown the demo message
let hasShownDemoMessage = false;

/**
 * Show a friendly demo message instead of RevenueCat's scary warning
 */
function showDemoMessage() {
    if (hasShownDemoMessage) return;
    hasShownDemoMessage = true;

    Alert.alert(
        '🎉 Welcome to Cronos Demo',
        'You\'re using the demo version with test subscriptions. All features are available for you to explore!\n\nPremium features are unlocked for testing purposes.',
        [
            {
                text: 'Got it!',
                style: 'default',
            }
        ],
        { cancelable: false }
    );
}

/**
 * Initialize RevenueCat SDK
 * Call this once when the app launches
 */
export async function initializePurchases(userId?: string): Promise<void> {
    try {
        console.log('[RevenueCat] Initializing SDK...');

        // Enable debug logs in development
        if (__DEV__) {
            Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        // Configure SDK with platform-specific API key
        const apiKey = Platform.OS === 'ios' 
            ? REVENUECAT_API_KEY_IOS 
            : REVENUECAT_API_KEY_ANDROID;

        if (!apiKey || apiKey.includes('YOUR_KEY_HERE')) {
            console.error('[RevenueCat] API key not configured! Add your keys to core/constants.ts');
            console.warn('[RevenueCat] Continuing without RevenueCat - premium features disabled');
            return; // Don't crash - just return
        }

        // Check if it's a test key - show friendly message
        const isTestKey = apiKey.includes('test_');
        if (isTestKey) {
            console.log('[RevenueCat] Using test API key - will show demo message');
        }

        Purchases.configure({ apiKey });

        // Set user ID if provided (for tracking across devices)
        if (userId) {
            await Purchases.logIn(userId);
            console.log('[RevenueCat] User logged in:', userId);
        }

        console.log('[RevenueCat] SDK initialized successfully');

        // Show friendly demo message for test keys (after a delay)
        if (isTestKey) {
            setTimeout(() => {
                showDemoMessage();
            }, 2000); // Show after RevenueCat's warning
        }
    } catch (error) {
        console.error('[RevenueCat] Initialization error:', error);
        // Don't throw - just log and continue
        console.warn('[RevenueCat] Failed to initialize, continuing without premium features');
    }
}

/**
 * Check if user has Pro entitlement
 * Returns true if user has active "pro" subscription
 */
export async function checkProStatus(): Promise<boolean> {
    try {
        console.log('[RevenueCat] Checking Pro status...');
        
        const customerInfo = await Purchases.getCustomerInfo();
        const isPro = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
        
        console.log('[RevenueCat] Pro status:', isPro);
        
        if (isPro) {
            const entitlement = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID];
            console.log('[RevenueCat] Pro details:', {
                productIdentifier: entitlement.productIdentifier,
                expirationDate: entitlement.expirationDate,
                willRenew: entitlement.willRenew,
            });
        }
        
        return isPro;
    } catch (error) {
        console.error('[RevenueCat] Error checking Pro status:', error);
        return false;
    }
}

/**
 * Get available subscription packages
 * Returns offerings from RevenueCat (Monthly, Annual, etc.)
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
    try {
        console.log('[RevenueCat] Fetching offerings...');
        
        const offerings = await Purchases.getOfferings();
        
        if (offerings.current !== null) {
            const packageCount = offerings.current.availablePackages.length;
            console.log(`[RevenueCat] Found ${packageCount} packages:`, 
                offerings.current.availablePackages.map(p => ({
                    identifier: p.identifier,
                    product: p.product.identifier,
                    price: p.product.priceString,
                }))
            );
            return offerings.current;
        }
        
        console.warn('[RevenueCat] No offerings found. Check RevenueCat dashboard.');
        return null;
    } catch (error) {
        console.error('[RevenueCat] Error fetching offerings:', error);
        return null;
    }
}

/**
 * Purchase a subscription package
 * Triggers native purchase flow (Apple/Google)
 */
export async function purchasePackage(
    packageToPurchase: PurchasesPackage
): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
    try {
        console.log('[RevenueCat] Starting purchase:', packageToPurchase.identifier);
        
        const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
        
        const isPro = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
        
        if (isPro) {
            console.log('[RevenueCat] Purchase successful! User is now Pro');
            return { success: true, customerInfo };
        } else {
            console.warn('[RevenueCat] Purchase completed but Pro entitlement not granted');
            return { 
                success: false, 
                error: 'Purchase completed but entitlement not granted' 
            };
        }
    } catch (error: any) {
        console.error('[RevenueCat] Purchase error:', error);
        
        // Handle user cancellation gracefully
        if (error.userCancelled) {
            console.log('[RevenueCat] User cancelled purchase');
            return { success: false, error: 'cancelled' };
        }
        
        return { 
            success: false, 
            error: error.message || 'Purchase failed' 
        };
    }
}

/**
 * Restore previous purchases
 * Use this for users who reinstalled the app or switched devices
 */
export async function restorePurchases(): Promise<{ 
    success: boolean; 
    isPro: boolean; 
    error?: string 
}> {
    try {
        console.log('[RevenueCat] Restoring purchases...');
        
        const customerInfo = await Purchases.restorePurchases();
        const isPro = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
        
        if (isPro) {
            console.log('[RevenueCat] Purchases restored! User is Pro');
        } else {
            console.log('[RevenueCat] No active purchases found');
        }
        
        return { success: true, isPro };
    } catch (error: any) {
        console.error('[RevenueCat] Restore error:', error);
        return { 
            success: false, 
            isPro: false, 
            error: error.message || 'Restore failed' 
        };
    }
}

/**
 * Get customer info
 * Returns current subscription status and details
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
        const customerInfo = await Purchases.getCustomerInfo();
        return customerInfo;
    } catch (error) {
        console.error('[RevenueCat] Error getting customer info:', error);
        return null;
    }
}

/**
 * Log out current user
 * Call this when user signs out of your app
 */
export async function logoutUser(): Promise<void> {
    try {
        console.log('[RevenueCat] Logging out user...');
        await Purchases.logOut();
        console.log('[RevenueCat] User logged out');
    } catch (error) {
        console.error('[RevenueCat] Logout error:', error);
    }
}
