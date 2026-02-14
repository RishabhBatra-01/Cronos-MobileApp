/**
 * AI Feature Flag Store
 * Phase 1: Foundation
 * 
 * Manages feature flags for AI assistant features
 * All features are OFF by default for safety
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from './storage';
import { AIFeatureFlags } from '../types/ai-assistant';
import { AI_CONFIG, PERPLEXITY_API_KEY } from '../constants';

interface FeatureFlagState extends AIFeatureFlags {
  // Actions
  setApiKey: (key: string) => void;
  toggleFeature: (feature: keyof AIFeatureFlags) => void;
  setFeature: (feature: keyof AIFeatureFlags, value: boolean) => void;
  resetToDefaults: () => void;
  
  // Getters
  isFeatureEnabled: (feature: keyof AIFeatureFlags) => boolean;
  canMakeRequest: () => boolean;
}

// Default feature flags (all OFF for safety)
const DEFAULT_FLAGS: AIFeatureFlags = {
  // Master switch
  aiAssistantEnabled: true, // Phase 2: Enabled for testing
  
  // Individual features (Phase 2-8)
  aiConversationalChat: true, // Phase 2: Enabled
  aiVoiceEnhancement: true, // Phase 4: Enabled for testing
  aiProactiveSuggestions: false,
  aiRealTimeCards: false,
  aiResearchMode: true, // Phase 3: Enabled for testing
  aiSmartSnooze: false,
  aiWeeklyPlanning: false,
  
  // API Configuration
  perplexityApiKey: PERPLEXITY_API_KEY,
  
  // Cache settings
  cacheEnabled: true,
  cacheTTLDays: AI_CONFIG.CACHE_TTL_DAYS,
  maxCacheSize: AI_CONFIG.MAX_CACHE_SIZE,
  
  // Usage limits
  maxRequestsPerMinute: AI_CONFIG.MAX_REQUESTS_PER_MINUTE,
  maxRequestsPerDay: AI_CONFIG.MAX_REQUESTS_PER_DAY,
};

export const useFeatureFlagStore = create<FeatureFlagState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_FLAGS,
      
      // Set API key
      setApiKey: (key: string) => {
        console.log('[FeatureFlags] Setting Perplexity API key');
        set({ perplexityApiKey: key });
      },
      
      // Toggle a feature on/off
      toggleFeature: (feature: keyof AIFeatureFlags) => {
        const currentValue = get()[feature];
        if (typeof currentValue === 'boolean') {
          console.log(`[FeatureFlags] Toggling ${feature}: ${currentValue} → ${!currentValue}`);
          set({ [feature]: !currentValue } as any);
        }
      },
      
      // Set a feature to specific value
      setFeature: (feature: keyof AIFeatureFlags, value: boolean) => {
        console.log(`[FeatureFlags] Setting ${feature} to ${value}`);
        set({ [feature]: value } as any);
      },
      
      // Reset all flags to defaults
      resetToDefaults: () => {
        console.log('[FeatureFlags] Resetting to defaults');
        set(DEFAULT_FLAGS);
      },
      
      // Check if a feature is enabled
      isFeatureEnabled: (feature: keyof AIFeatureFlags) => {
        const state = get();
        
        // Master switch must be ON
        if (!state.aiAssistantEnabled) {
          return false;
        }
        
        // Check specific feature
        const featureValue = state[feature];
        return typeof featureValue === 'boolean' ? featureValue : false;
      },
      
      // Check if we can make an API request
      canMakeRequest: () => {
        const state = get();
        
        // Check master switch
        if (!state.aiAssistantEnabled) {
          console.log('[FeatureFlags] AI Assistant disabled');
          return false;
        }
        
        // Check API key
        if (!state.perplexityApiKey || state.perplexityApiKey.trim() === '') {
          console.log('[FeatureFlags] No API key configured');
          return false;
        }
        
        return true;
      },
    }),
    {
      name: 'cronos-feature-flags',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

// Helper function to check if AI features are available
export function isAIAvailable(): boolean {
  const { aiAssistantEnabled, perplexityApiKey } = useFeatureFlagStore.getState();
  return aiAssistantEnabled && !!perplexityApiKey;
}

// Helper function to get API key
export function getPerplexityApiKey(): string | null {
  const { perplexityApiKey } = useFeatureFlagStore.getState();
  return perplexityApiKey || null;
}
