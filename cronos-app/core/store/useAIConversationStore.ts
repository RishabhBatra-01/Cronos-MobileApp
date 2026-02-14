/**
 * AI Conversation Store
 * Phase 2: Conversational Assistant
 * 
 * Manages chat history for each task
 * - Stores conversations per task
 * - Persists to MMKV
 * - Survives app restarts
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from './storage';
import { TaskConversation, ChatMessage } from '../types/ai-assistant';
import { v4 as uuidv4 } from 'uuid';

interface AIConversationState {
  conversations: Record<string, TaskConversation>;
  
  // Actions
  getConversation: (taskId: string) => TaskConversation | null;
  addMessage: (taskId: string, message: Omit<ChatMessage, 'id'>) => void;
  clearConversation: (taskId: string) => void;
  clearAllConversations: () => void;
  getConversationCount: () => number;
  hasConversation: (taskId: string) => boolean;
}

export const useAIConversationStore = create<AIConversationState>()(
  persist(
    (set, get) => ({
      conversations: {},
      
      // Get conversation for a task
      getConversation: (taskId: string) => {
        const conversations = get().conversations;
        return conversations[taskId] || null;
      },
      
      // Add message to conversation
      addMessage: (taskId: string, message: Omit<ChatMessage, 'id'>) => {
        const now = new Date().toISOString();
        const messageWithId: ChatMessage = {
          ...message,
          id: uuidv4(),
        };
        
        set((state) => {
          const existingConversation = state.conversations[taskId];
          
          if (existingConversation) {
            // Update existing conversation
            return {
              conversations: {
                ...state.conversations,
                [taskId]: {
                  ...existingConversation,
                  messages: [...existingConversation.messages, messageWithId],
                  updatedAt: now,
                },
              },
            };
          } else {
            // Create new conversation
            return {
              conversations: {
                ...state.conversations,
                [taskId]: {
                  taskId,
                  messages: [messageWithId],
                  createdAt: now,
                  updatedAt: now,
                },
              },
            };
          }
        });
        
        console.log('[AIConversation] Message added:', {
          taskId,
          role: message.role,
          messageCount: get().conversations[taskId]?.messages.length,
        });
      },
      
      // Clear conversation for a task
      clearConversation: (taskId: string) => {
        set((state) => {
          const { [taskId]: removed, ...remaining } = state.conversations;
          return { conversations: remaining };
        });
        
        console.log('[AIConversation] Conversation cleared:', taskId);
      },
      
      // Clear all conversations
      clearAllConversations: () => {
        set({ conversations: {} });
        console.log('[AIConversation] All conversations cleared');
      },
      
      // Get total conversation count
      getConversationCount: () => {
        return Object.keys(get().conversations).length;
      },
      
      // Check if task has conversation
      hasConversation: (taskId: string) => {
        const conversation = get().conversations[taskId];
        return !!conversation && conversation.messages.length > 0;
      },
    }),
    {
      name: 'cronos-ai-conversations',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

// Helper function to get message count for a task
export function getMessageCount(taskId: string): number {
  const conversation = useAIConversationStore.getState().getConversation(taskId);
  return conversation?.messages.length || 0;
}

// Helper function to get last message for a task
export function getLastMessage(taskId: string): ChatMessage | null {
  const conversation = useAIConversationStore.getState().getConversation(taskId);
  if (!conversation || conversation.messages.length === 0) {
    return null;
  }
  return conversation.messages[conversation.messages.length - 1];
}
