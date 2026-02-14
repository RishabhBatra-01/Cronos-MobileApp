/**
 * AI Assistant Type Definitions
 * Phase 1: Foundation
 * 
 * All TypeScript interfaces for AI features
 */

import { TaskPriority } from '../store/useTaskStore';

// ============================================================================
// TASK ANALYSIS
// ============================================================================

export interface TaskAnalysis {
  taskType: string;           // "meeting", "shopping", "work", "medical", etc.
  summary: string;            // Brief overview
  suggestions: string[];      // Quick actionable tips
  timeEstimate: string;       // "30 minutes", "2 hours", "1 week"
  complexity: 'low' | 'medium' | 'high';
  relevantInfo?: string;      // Additional context
  citations: Citation[];
}

// ============================================================================
// CONVERSATIONAL CHAT
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Citation[];
}

export interface ChatResponse {
  message: string;
  citations: Citation[];
  suggestedFollowUps?: string[];
}

export interface TaskConversation {
  taskId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// TASK RESEARCH
// ============================================================================

export interface TaskResearch {
  overview: string;
  keyPoints: string[];
  resources: Resource[];
  checklist: string[];
  estimatedTime: string;
  expertTips: string[];
  citations: Citation[];
}

export interface Resource {
  title: string;
  url: string;
  description?: string;
  type: 'article' | 'video' | 'course' | 'documentation' | 'tool';
}

// ============================================================================
// SUB-TASK GENERATION
// ============================================================================

export interface SubTask {
  title: string;
  description?: string;
  priority?: TaskPriority;
  estimatedTime?: string;
  dueDate?: string;
  order?: number;
}

// ============================================================================
// CITATIONS & SOURCES
// ============================================================================

export interface Citation {
  title: string;
  url: string;
  source: string;
  snippet?: string;
  publishedDate?: string;
}

// ============================================================================
// CACHE
// ============================================================================

export interface CachedResponse<T = any> {
  data: T;
  cachedAt: string;
  expiresAt: string;
  cacheKey: string;
}

export interface CacheStats {
  totalItems: number;
  totalSizeBytes: number;
  hitRate: number;
  oldestEntry?: string;
  newestEntry?: string;
}

// ============================================================================
// PERPLEXITY API
// ============================================================================

export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PerplexityRequest {
  model: string;
  messages: PerplexityMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  return_citations?: boolean;
  return_images?: boolean;
  search_recency_filter?: 'month' | 'week' | 'day' | 'hour';
}

export interface PerplexityResponse {
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations?: string[];
  object: string;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta?: {
      role?: string;
      content?: string;
    };
  }>;
}

// ============================================================================
// RATE LIMITING
// ============================================================================

export interface RateLimitState {
  requestsThisMinute: number;
  requestsToday: number;
  minuteResetAt: string;
  dayResetAt: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export type AIErrorCode =
  | 'API_KEY_MISSING'
  | 'API_KEY_INVALID'
  | 'RATE_LIMIT_EXCEEDED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'FEATURE_DISABLED'
  | 'CACHE_ERROR'
  | 'UNKNOWN_ERROR';

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export interface AIFeatureFlags {
  // Master switch
  aiAssistantEnabled: boolean;
  
  // Individual features
  aiConversationalChat: boolean;
  aiVoiceEnhancement: boolean;
  aiProactiveSuggestions: boolean;
  aiRealTimeCards: boolean;
  aiResearchMode: boolean;
  aiSmartSnooze: boolean;
  aiWeeklyPlanning: boolean;
  
  // API Configuration
  perplexityApiKey: string;
  
  // Cache settings
  cacheEnabled: boolean;
  cacheTTLDays: number;
  maxCacheSize: number;
  
  // Usage limits
  maxRequestsPerMinute: number;
  maxRequestsPerDay: number;
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface AIUsageLog {
  id: string;
  featureType: 'chat' | 'research' | 'analysis' | 'subtasks';
  taskId?: string;
  tokensUsed: number;
  responseTime: number;
  cacheHit: boolean;
  timestamp: string;
}
