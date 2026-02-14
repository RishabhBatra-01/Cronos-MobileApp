/**
 * useAIConversation Hook
 * Phase 2: Conversational Assistant
 * 
 * React hook for managing chat UI state
 * - Load conversation history
 * - Send messages to AI
 * - Handle loading/error states
 * - Auto-retry on failure
 */

import { useState, useEffect, useCallback } from 'react';
import { Task } from '../core/store/useTaskStore';
import { ChatMessage } from '../core/types/ai-assistant';
import { useAIConversationStore } from '../core/store/useAIConversationStore';
import * as AIEngine from '../services/AIIntelligenceEngine';

interface UseAIConversationReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearConversation: () => void;
  retry: () => Promise<void>;
  hasHistory: boolean;
}

export function useAIConversation(task: Task): UseAIConversationReturn {
  const { getConversation, addMessage, clearConversation: clearStore } = useAIConversationStore();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string>('');
  
  // Load conversation history on mount
  useEffect(() => {
    const conversation = getConversation(task.id);
    if (conversation) {
      setMessages(conversation.messages);
      console.log('[useAIConversation] Loaded history:', conversation.messages.length, 'messages');
    }
  }, [task.id, getConversation]);
  
  // Send message to AI
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setLastUserMessage(text);
    
    // Add user message immediately
    const userMessage: Omit<ChatMessage, 'id'> = {
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    
    addMessage(task.id, userMessage);
    
    // Update local state
    setMessages(prev => [...prev, { ...userMessage, id: Date.now().toString() }]);
    
    try {
      console.log('[useAIConversation] Sending message to AI...');
      
      // Get conversation history for context
      const conversation = getConversation(task.id);
      const history = conversation?.messages || [];
      
      // Call AI engine
      const response = await AIEngine.chat(task, text, history);
      
      console.log('[useAIConversation] AI response received');
      
      // Add AI response
      const aiMessage: Omit<ChatMessage, 'id'> = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
        citations: response.citations,
      };
      
      addMessage(task.id, aiMessage);
      
      // Update local state
      setMessages(prev => [...prev, { ...aiMessage, id: Date.now().toString() }]);
      
      setIsLoading(false);
    } catch (err: any) {
      console.error('[useAIConversation] Error:', err);
      
      setError(err.message || 'Failed to get AI response. Please try again.');
      setIsLoading(false);
      
      // Remove user message on error (optional - you can keep it)
      // setMessages(prev => prev.slice(0, -1));
    }
  }, [task, addMessage, getConversation]);
  
  // Retry last message
  const retry = useCallback(async () => {
    if (lastUserMessage) {
      // Remove last failed message pair if exists
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'user') {
          return prev.slice(0, -1);
        }
        return prev;
      });
      
      await sendMessage(lastUserMessage);
    }
  }, [lastUserMessage, sendMessage]);
  
  // Clear conversation
  const clearConversation = useCallback(() => {
    clearStore(task.id);
    setMessages([]);
    setError(null);
    setLastUserMessage('');
    console.log('[useAIConversation] Conversation cleared');
  }, [task.id, clearStore]);
  
  // Check if has history
  const hasHistory = messages.length > 0;
  
  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearConversation,
    retry,
    hasHistory,
  };
}
