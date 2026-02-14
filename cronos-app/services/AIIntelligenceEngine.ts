/**
 * AI Intelligence Engine
 * Phase 1: Foundation
 * 
 * Central orchestration layer for all AI features
 * - Combines Perplexity API + Caching + Rate limiting
 * - Provides clean interface for UI components
 * - Handles all AI logic in one place
 */

import { Task } from '../core/store/useTaskStore';
import {
  TaskAnalysis,
  ChatResponse,
  ChatMessage,
  TaskResearch,
  SubTask,
  RateLimitState,
  AIServiceError,
} from '../core/types/ai-assistant';
import { useFeatureFlagStore } from '../core/store/useFeatureFlagStore';
import {
  getCachedResponse,
  setCachedResponse,
  generateCacheKey,
} from './AIResponseCache';
import * as PerplexityService from './PerplexityService';
import { AI_CONFIG } from '../core/constants';

// Rate limiting state (in-memory)
let rateLimitState: RateLimitState = {
  requestsThisMinute: 0,
  requestsToday: 0,
  minuteResetAt: new Date(Date.now() + 60000).toISOString(),
  dayResetAt: new Date(Date.now() + 86400000).toISOString(),
};

/**
 * Check and update rate limits
 */
function checkRateLimit(): boolean {
  const now = new Date();
  const { maxRequestsPerMinute, maxRequestsPerDay } = useFeatureFlagStore.getState();
  
  // Reset minute counter if needed
  if (now > new Date(rateLimitState.minuteResetAt)) {
    rateLimitState.requestsThisMinute = 0;
    rateLimitState.minuteResetAt = new Date(now.getTime() + 60000).toISOString();
  }
  
  // Reset day counter if needed
  if (now > new Date(rateLimitState.dayResetAt)) {
    rateLimitState.requestsToday = 0;
    rateLimitState.dayResetAt = new Date(now.getTime() + 86400000).toISOString();
  }
  
  // Check limits
  if (rateLimitState.requestsThisMinute >= maxRequestsPerMinute) {
    console.warn('[AIEngine] Rate limit exceeded (per minute)');
    return false;
  }
  
  if (rateLimitState.requestsToday >= maxRequestsPerDay) {
    console.warn('[AIEngine] Rate limit exceeded (per day)');
    return false;
  }
  
  // Increment counters
  rateLimitState.requestsThisMinute++;
  rateLimitState.requestsToday++;
  
  return true;
}

/**
 * Check if AI features are available
 */
function checkAvailability(): void {
  const { canMakeRequest } = useFeatureFlagStore.getState();
  
  if (!canMakeRequest()) {
    throw new AIServiceError(
      'AI Assistant is not available. Please enable it in settings and configure your API key.',
      'FEATURE_DISABLED',
      undefined,
      false
    );
  }
}

/**
 * Analyze a task with caching
 */
export async function analyzeTask(task: Task): Promise<TaskAnalysis> {
  console.log('[AIEngine] Analyzing task:', task.title);
  
  // Check availability
  checkAvailability();
  
  // Check cache first
  const { cacheEnabled } = useFeatureFlagStore.getState();
  if (cacheEnabled) {
    const cacheKey = generateCacheKey(
      `${task.title}|${task.description || ''}`,
      'analyze'
    );
    
    const cached = await getCachedResponse<TaskAnalysis>(cacheKey);
    if (cached) {
      console.log('[AIEngine] Returning cached analysis');
      return cached.data;
    }
  }
  
  // Check rate limit
  if (!checkRateLimit()) {
    throw new AIServiceError(
      'Rate limit exceeded. Please try again later.',
      'RATE_LIMIT_EXCEEDED',
      429,
      true
    );
  }
  
  // Call Perplexity API
  const startTime = Date.now();
  const analysis = await PerplexityService.analyzeTask(task);
  const responseTime = Date.now() - startTime;
  
  console.log('[AIEngine] Analysis complete:', {
    taskType: analysis.taskType,
    responseTime: `${responseTime}ms`,
  });
  
  // Cache result
  if (cacheEnabled) {
    const cacheKey = generateCacheKey(
      `${task.title}|${task.description || ''}`,
      'analyze'
    );
    await setCachedResponse(cacheKey, analysis);
  }
  
  return analysis;
}

/**
 * Chat with AI about a task
 */
export async function chat(
  task: Task,
  message: string,
  history: ChatMessage[] = []
): Promise<ChatResponse> {
  console.log('[AIEngine] Chat request:', { task: task.title, message });
  
  // Check availability
  checkAvailability();
  
  // Check rate limit
  if (!checkRateLimit()) {
    throw new AIServiceError(
      'Rate limit exceeded. Please try again later.',
      'RATE_LIMIT_EXCEEDED',
      429,
      true
    );
  }
  
  // Convert ChatMessage[] to conversation history format
  const conversationHistory = history.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));
  
  // Call Perplexity API
  const startTime = Date.now();
  const response = await PerplexityService.chatWithTask(
    task,
    message,
    conversationHistory
  );
  const responseTime = Date.now() - startTime;
  
  console.log('[AIEngine] Chat response received:', {
    responseTime: `${responseTime}ms`,
    citations: response.citations.length,
  });
  
  return response;
}

/**
 * Deep research on a task with caching
 */
export async function research(task: Task): Promise<TaskResearch> {
  console.log('[AIEngine] Researching task:', task.title);
  
  // Check availability
  checkAvailability();
  
  // Check cache first
  const { cacheEnabled } = useFeatureFlagStore.getState();
  if (cacheEnabled) {
    const cacheKey = generateCacheKey(
      `${task.title}|${task.description || ''}`,
      'research'
    );
    
    const cached = await getCachedResponse<TaskResearch>(cacheKey);
    if (cached) {
      console.log('[AIEngine] Returning cached research');
      return cached.data;
    }
  }
  
  // Check rate limit
  if (!checkRateLimit()) {
    throw new AIServiceError(
      'Rate limit exceeded. Please try again later.',
      'RATE_LIMIT_EXCEEDED',
      429,
      true
    );
  }
  
  // Call Perplexity API
  const startTime = Date.now();
  const researchData = await PerplexityService.researchTask(task);
  const responseTime = Date.now() - startTime;
  
  console.log('[AIEngine] Research complete:', {
    keyPoints: researchData.keyPoints.length,
    resources: researchData.resources.length,
    responseTime: `${responseTime}ms`,
  });
  
  // Cache result
  if (cacheEnabled) {
    const cacheKey = generateCacheKey(
      `${task.title}|${task.description || ''}`,
      'research'
    );
    await setCachedResponse(cacheKey, researchData);
  }
  
  return researchData;
}

/**
 * Generate sub-tasks with caching
 */
export async function generateSubTasks(task: Task): Promise<SubTask[]> {
  console.log('[AIEngine] Generating sub-tasks for:', task.title);
  
  // Check availability
  checkAvailability();
  
  // Check cache first
  const { cacheEnabled } = useFeatureFlagStore.getState();
  if (cacheEnabled) {
    const cacheKey = generateCacheKey(
      `${task.title}|${task.description || ''}`,
      'subtasks'
    );
    
    const cached = await getCachedResponse<SubTask[]>(cacheKey);
    if (cached) {
      console.log('[AIEngine] Returning cached sub-tasks');
      return cached.data;
    }
  }
  
  // Check rate limit
  if (!checkRateLimit()) {
    throw new AIServiceError(
      'Rate limit exceeded. Please try again later.',
      'RATE_LIMIT_EXCEEDED',
      429,
      true
    );
  }
  
  // Call Perplexity API
  const startTime = Date.now();
  const subTasks = await PerplexityService.generateSubTasks(task);
  const responseTime = Date.now() - startTime;
  
  console.log('[AIEngine] Sub-tasks generated:', {
    count: subTasks.length,
    responseTime: `${responseTime}ms`,
  });
  
  // Cache result
  if (cacheEnabled) {
    const cacheKey = generateCacheKey(
      `${task.title}|${task.description || ''}`,
      'subtasks'
    );
    await setCachedResponse(cacheKey, subTasks);
  }
  
  return subTasks;
}

/**
 * Get current rate limit state
 */
export function getRateLimitState(): RateLimitState {
  return { ...rateLimitState };
}

/**
 * Reset rate limits (for testing)
 */
export function resetRateLimits(): void {
  rateLimitState = {
    requestsThisMinute: 0,
    requestsToday: 0,
    minuteResetAt: new Date(Date.now() + 60000).toISOString(),
    dayResetAt: new Date(Date.now() + 86400000).toISOString(),
  };
  console.log('[AIEngine] Rate limits reset');
}
