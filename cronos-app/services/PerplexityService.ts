/**
 * Perplexity AI Service
 * Phase 1: Foundation
 * 
 * API integration with Perplexity Sonar
 * - Task analysis
 * - Conversational chat
 * - Deep research
 * - Sub-task generation
 */

import axios, { AxiosError } from 'axios';
import { AI_CONFIG, PERPLEXITY_API_BASE, PERPLEXITY_MODEL } from '../core/constants';
import { getPerplexityApiKey } from '../core/store/useFeatureFlagStore';
import { Task } from '../core/store/useTaskStore';
import {
  AIServiceError,
  ChatResponse,
  Citation,
  PerplexityRequest,
  PerplexityResponse,
  SubTask,
  TaskAnalysis,
  TaskResearch,
} from '../core/types/ai-assistant';

/**
 * Make a request to Perplexity API
 */
async function callPerplexityAPI(
  request: PerplexityRequest,
  retryCount = 0
): Promise<PerplexityResponse> {
  const apiKey = getPerplexityApiKey();

  if (!apiKey) {
    throw new AIServiceError(
      'Perplexity API key not configured',
      'API_KEY_MISSING',
      undefined,
      false
    );
  }

  try {
    console.log('[Perplexity] Making API request:', {
      model: request.model,
      messages: request.messages.length,
      attempt: retryCount + 1,
    });

    const response = await axios.post<PerplexityResponse>(
      `${PERPLEXITY_API_BASE}/chat/completions`,
      request,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: AI_CONFIG.REQUEST_TIMEOUT_MS,
      }
    );

    console.log('[Perplexity] API response received:', {
      id: response.data.id,
      tokens: response.data.usage?.total_tokens,
      citations: response.data.citations?.length || 0,
    });

    return response.data;
  } catch (error) {
    return handlePerplexityError(error as AxiosError, request, retryCount);
  }
}

/**
 * Handle Perplexity API errors with retry logic
 */
async function handlePerplexityError(
  error: AxiosError,
  request: PerplexityRequest,
  retryCount: number
): Promise<PerplexityResponse> {
  console.error('[Perplexity] API error:', {
    status: error.response?.status,
    statusText: error.response?.statusText,
    message: error.message,
    data: error.response?.data,
    attempt: retryCount + 1,
  });

  // Check if retryable
  const isRetryable =
    error.code === 'ECONNABORTED' ||
    error.message?.includes('timeout') ||
    error.message?.includes('Network Error') ||
    error.response?.status === 429 || // Rate limit
    (error.response?.status ? error.response.status >= 500 : false); // Server errors

  if (isRetryable && retryCount < AI_CONFIG.RETRY_ATTEMPTS) {
    const delayMs = AI_CONFIG.RETRY_DELAY_MS * Math.pow(2, retryCount);
    console.log(`[Perplexity] Retrying in ${delayMs}ms...`);

    await new Promise(resolve => setTimeout(resolve, delayMs));
    return callPerplexityAPI(request, retryCount + 1);
  }

  // Throw appropriate error
  if (error.response?.status === 400) {
    const errorData = error.response?.data as any;
    throw new AIServiceError(
      `Bad request: ${errorData?.error?.message || 'Invalid request format'}`,
      'BAD_REQUEST',
      400,
      false
    );
  }

  if (error.response?.status === 401) {
    throw new AIServiceError(
      'Invalid Perplexity API key',
      'API_KEY_INVALID',
      401,
      false
    );
  }

  if (error.response?.status === 429) {
    throw new AIServiceError(
      'Rate limit exceeded. Please try again later.',
      'RATE_LIMIT_EXCEEDED',
      429,
      true
    );
  }

  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    throw new AIServiceError(
      'Request timed out. Please try again.',
      'TIMEOUT',
      undefined,
      true
    );
  }

  throw new AIServiceError(
    `API request failed: ${error.message}`,
    'NETWORK_ERROR',
    error.response?.status,
    isRetryable
  );
}

/**
 * Parse citations from Perplexity response
 */
function parseCitations(response: PerplexityResponse): Citation[] {
  if (!response.citations || response.citations.length === 0) {
    return [];
  }

  return response.citations.map((url, index) => ({
    title: `Source ${index + 1}`,
    url,
    source: new URL(url).hostname,
  }));
}

/**
 * Analyze a task and get AI insights
 */
export async function analyzeTask(task: Task): Promise<TaskAnalysis> {
  const prompt = `Analyze this task and provide helpful insights:

Task: ${task.title}
${task.description ? `Details: ${task.description}` : ''}
${task.priority ? `Priority: ${task.priority}` : ''}
${task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleString()}` : ''}

Provide a JSON response with:
1. taskType: Category (meeting, shopping, work, personal, medical, etc.)
2. summary: Brief, conversational overview (1-2 sentences, no markdown)
3. suggestions: Array of 3-5 short, actionable tips (plain text, no markdown)
4. timeEstimate: Estimated time needed (e.g., "30 minutes", "2 hours")
5. complexity: low, medium, or high

Format as valid JSON only.`;

  const request: PerplexityRequest = {
    model: PERPLEXITY_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are a helpful task assistant for a mobile app. Provide concise, conversational, actionable insights in plain text (no markdown). Always respond with valid JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: AI_CONFIG.TEMPERATURE,
    max_tokens: AI_CONFIG.MAX_TOKENS,
    return_citations: true,
  };

  const response = await callPerplexityAPI(request);
  const content = response.choices[0].message.content;

  try {
    const parsed = JSON.parse(content);
    return {
      ...parsed,
      citations: parseCitations(response),
    };
  } catch (error) {
    // Fallback if JSON parsing fails
    return {
      taskType: 'general',
      summary: content.substring(0, 200),
      suggestions: ['Review task details', 'Set a reminder', 'Break into smaller steps'],
      timeEstimate: 'Unknown',
      complexity: 'medium',
      citations: parseCitations(response),
    };
  }
}

/**
 * Chat with AI about a task
 */
export async function chatWithTask(
  task: Task,
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<ChatResponse> {
  const systemPrompt = `You are a helpful task assistant in a mobile chat app. The user is asking about this task:

Task: ${task.title}
${task.description ? `Details: ${task.description}` : ''}
${task.priority ? `Priority: ${task.priority}` : ''}
${task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleString()}` : ''}

CRITICAL RESPONSE STYLE RULES:
- Write like you're texting a friend - casual, warm, conversational
- Use Markdown for structure:
  - Use ### for headers
  - Use - for bullet points
  - Use ** for emphasis
- Use natural line breaks between paragraphs
- Use emojis sparingly for emphasis (1-2 max)
- Keep responses under 200 words when possible
- Be direct and actionable
- Avoid formal documentation style

Example GOOD response:
"Hey! For your doctor appointment, here's what I'd bring:
### Essentials
- **Insurance card**
- **Photo ID**
- Current medications

### Helpful Extras
If you have recent test results or a list of symptoms, bring those too. It helps the doctor understand your situation better.

Want me to help you create a quick checklist?"

Provide helpful, concise answers with citations when possible.`;

  // Filter conversation history to ensure alternating messages
  // Remove the last message if it's a user message (we're adding a new one)
  let filteredHistory = conversationHistory.filter(msg => msg.content && msg.content.trim());

  // If the last message in history is from user, remove it (we're adding the new user message)
  if (filteredHistory.length > 0 && filteredHistory[filteredHistory.length - 1].role === 'user') {
    filteredHistory = filteredHistory.slice(0, -1);
  }

  // Ensure messages alternate between user and assistant
  const alternatingHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  let lastRole: 'user' | 'assistant' | null = null;

  for (const msg of filteredHistory) {
    if (msg.role !== lastRole) {
      alternatingHistory.push(msg);
      lastRole = msg.role;
    }
  }

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...alternatingHistory,
    { role: 'user' as const, content: userMessage },
  ];

  const request: PerplexityRequest = {
    model: PERPLEXITY_MODEL,
    messages,
    temperature: AI_CONFIG.TEMPERATURE,
    max_tokens: AI_CONFIG.MAX_TOKENS,
    return_citations: true,
  };

  const response = await callPerplexityAPI(request);
  const content = response.choices[0].message.content;

  return {
    message: content,
    citations: parseCitations(response),
    suggestedFollowUps: [], // Could be enhanced later
  };
}

/**
 * Deep research on a task
 */
export async function researchTask(task: Task): Promise<TaskResearch> {
  const prompt = `Provide comprehensive research for this task:

Task: ${task.title}
${task.description ? `Details: ${task.description}` : ''}

Provide a JSON response with:
1. overview: Brief, conversational overview (2-3 sentences, no markdown)
2. keyPoints: Array of 5-7 short key points (plain text, no markdown)
3. resources: Array of helpful resources (each with title, url, description, type)
4. checklist: Array of 5-10 short step-by-step items (plain text, no markdown)
5. estimatedTime: Time estimate (e.g., "2-3 hours", "1 week")
6. expertTips: Array of 3-5 short pro tips (plain text, no markdown)

Format as valid JSON only. Use plain text throughout - no markdown formatting.`;

  const request: PerplexityRequest = {
    model: PERPLEXITY_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are a research assistant for a mobile app. Provide comprehensive, well-structured information in plain text (no markdown). Keep language conversational and mobile-friendly. Always respond with valid JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: AI_CONFIG.TEMPERATURE,
    max_tokens: AI_CONFIG.MAX_TOKENS,
    return_citations: true,
  };

  const response = await callPerplexityAPI(request);
  const content = response.choices[0].message.content;

  try {
    const parsed = JSON.parse(content);
    return {
      ...parsed,
      citations: parseCitations(response),
    };
  } catch (error) {
    // Fallback if JSON parsing fails
    return {
      overview: content.substring(0, 300),
      keyPoints: ['Review task requirements', 'Plan your approach', 'Set milestones'],
      resources: [],
      checklist: ['Start with research', 'Create a plan', 'Execute step by step'],
      estimatedTime: 'Unknown',
      expertTips: ['Break it down', 'Stay organized', 'Ask for help when needed'],
      citations: parseCitations(response),
    };
  }
}

/**
 * Generate sub-tasks for a task
 */
export async function generateSubTasks(task: Task): Promise<SubTask[]> {
  const prompt = `Generate helpful sub-tasks for this task:

Task: ${task.title}
${task.description ? `Details: ${task.description}` : ''}
${task.priority ? `Priority: ${task.priority}` : ''}

Respond with ONLY a JSON array of sub-tasks. Each sub-task must have:
- title: string (required, short and actionable, no markdown)
- description: string (optional, conversational, no markdown)
- priority: "low" | "medium" | "high" (optional)
- estimatedTime: string like "5 minutes" or "1 hour" (optional)

Example format:
[
  {
    "title": "Bring insurance card",
    "description": "Essential for check-in",
    "estimatedTime": "5 minutes"
  }
]

Generate 3-5 relevant sub-tasks. Keep titles short and descriptions conversational. Return ONLY the JSON array, no other text.`;

  const request: PerplexityRequest = {
    model: PERPLEXITY_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are a task planning assistant for a mobile app. Generate practical, actionable sub-tasks with short titles and conversational descriptions (no markdown). Always respond with valid JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: AI_CONFIG.TEMPERATURE,
    max_tokens: 500,
    return_citations: false,
  };

  const response = await callPerplexityAPI(request);
  let content = response.choices[0].message.content;

  // Try to extract JSON from markdown code blocks
  const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\]|\{[\s\S]*?\})\s*```/);
  if (jsonMatch) {
    content = jsonMatch[1];
  }

  // Remove any leading/trailing text that's not JSON
  content = content.trim();
  if (!content.startsWith('[') && !content.startsWith('{')) {
    // Try to find JSON array or object in the content
    const arrayMatch = content.match(/\[[\s\S]*\]/);
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (arrayMatch) {
      content = arrayMatch[0];
    } else if (objectMatch) {
      content = objectMatch[0];
    }
  }

  try {
    const parsed = JSON.parse(content);
    const subTasks = Array.isArray(parsed) ? parsed : parsed.subTasks || [];

    // Validate and sanitize sub-tasks
    return subTasks.map((subTask: any) => ({
      title: String(subTask.title || ''),
      description: typeof subTask.description === 'string' ? subTask.description : undefined,
      priority: subTask.priority,
      estimatedTime: typeof subTask.estimatedTime === 'string' ? subTask.estimatedTime : undefined,
      dueDate: subTask.dueDate,
      order: subTask.order,
    })).filter((subTask: SubTask) => subTask.title.trim() !== '');
  } catch (error) {
    console.error('[Perplexity] Error parsing sub-tasks:', error);
    console.error('[Perplexity] Content was:', content);
    return [];
  }
}
