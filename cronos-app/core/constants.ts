// Supabase Configuration (public keys - safe to expose)
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// OpenAI Configuration
// SECURITY: Use environment variables - never hardcode API keys
export const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

// RevenueCat API Keys
export const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || '';
export const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || '';

// ============================================================================
// AI ASSISTANT CONFIGURATION (Phase 1)
// ============================================================================

// Perplexity API Configuration
export const PERPLEXITY_API_BASE = 'https://api.perplexity.ai';
export const PERPLEXITY_MODEL = 'sonar'; // Lightweight, cost-effective search model with grounding
export const PERPLEXITY_API_KEY = process.env.EXPO_PUBLIC_PERPLEXITY_API_KEY || '';

// AI Feature Configuration
export const AI_CONFIG = {
  // Cache settings
  CACHE_TTL_DAYS: 7,                    // Cache responses for 7 days
  MAX_CACHE_SIZE: 100,                  // Maximum 100 cached responses

  // Rate limiting
  MAX_REQUESTS_PER_MINUTE: 10,          // Max 10 API calls per minute
  MAX_REQUESTS_PER_DAY: 100,            // Max 100 API calls per day

  // Request settings
  REQUEST_TIMEOUT_MS: 30000,            // 30 second timeout
  RETRY_ATTEMPTS: 2,                    // Retry failed requests twice
  RETRY_DELAY_MS: 1000,                 // 1 second delay between retries

  // Response settings
  MAX_TOKENS: 1000,                     // Maximum tokens per response
  TEMPERATURE: 0.2,                     // Low temperature for consistent responses

  // Feature defaults
  DEFAULT_FEATURES_ENABLED: false,      // All AI features OFF by default
};
