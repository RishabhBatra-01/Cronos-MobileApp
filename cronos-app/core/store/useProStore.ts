/**
 * useProStore - Manages Pro subscription state
 * 
 * This store tracks whether the user has an active Pro subscription
 * and provides functions to check/update Pro status.
 */

import { create } from 'zustand';
import { checkProStatus, restorePurchases } from '../../services/PurchaseService';

interface ProStore {
    // State
    isPro: boolean;
    isLoading: boolean;
    lastChecked: Date | null;
    
    // Actions
    setProStatus: (isPro: boolean) => void;
    checkProStatus: () => Promise<void>;
    restorePurchases: () => Promise<boolean>;
    reset: () => void;
}

export const useProStore = create<ProStore>((set, get) => ({
    // Initial state
    isPro: false,
    isLoading: false,
    lastChecked: null,
    
    /**
     * Set Pro status manually
     */
    setProStatus: (isPro: boolean) => {
        console.log('[ProStore] Setting Pro status:', isPro);
        set({ 
            isPro, 
            lastChecked: new Date() 
        });
    },
    
    /**
     * Check Pro status from RevenueCat
     * Call this on app launch and after purchases
     */
    checkProStatus: async () => {
        const { isLoading } = get();
        
        // Prevent concurrent checks
        if (isLoading) {
            console.log('[ProStore] Already checking Pro status, skipping...');
            return;
        }
        
        try {
            console.log('[ProStore] Checking Pro status...');
            set({ isLoading: true });
            
            const isPro = await checkProStatus();
            
            set({ 
                isPro, 
                isLoading: false,
                lastChecked: new Date() 
            });
            
            console.log('[ProStore] Pro status updated:', isPro);
        } catch (error) {
            console.error('[ProStore] Error checking Pro status:', error);
            set({ 
                isLoading: false,
                // Keep previous status on error
            });
        }
    },
    
    /**
     * Restore previous purchases
     * Returns true if Pro status was restored
     */
    restorePurchases: async () => {
        try {
            console.log('[ProStore] Restoring purchases...');
            set({ isLoading: true });
            
            const result = await restorePurchases();
            
            if (result.success) {
                set({ 
                    isPro: result.isPro,
                    isLoading: false,
                    lastChecked: new Date()
                });
                
                console.log('[ProStore] Restore complete. Pro status:', result.isPro);
                return result.isPro;
            } else {
                set({ isLoading: false });
                console.error('[ProStore] Restore failed:', result.error);
                return false;
            }
        } catch (error) {
            console.error('[ProStore] Restore error:', error);
            set({ isLoading: false });
            return false;
        }
    },
    
    /**
     * Reset Pro store to initial state
     * Call this on user logout
     */
    reset: () => {
        console.log('[ProStore] Resetting Pro store');
        set({
            isPro: false,
            isLoading: false,
            lastChecked: null,
        });
    },
}));
