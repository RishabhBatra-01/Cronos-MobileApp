/**
 * Task Research Hook
 * Phase 3: Research Mode
 * 
 * Manages research state and operations for tasks
 */

import { useState, useEffect, useCallback } from 'react';
import { Task } from '../core/store/useTaskStore';
import { TaskResearch, AIServiceError } from '../core/types/ai-assistant';
import * as AIIntelligenceEngine from '../services/AIIntelligenceEngine';
import { useFeatureFlagStore } from '../core/store/useFeatureFlagStore';

interface UseTaskResearchResult {
  research: TaskResearch | null;
  isLoading: boolean;
  error: string | null;
  loadResearch: () => Promise<void>;
  refreshResearch: () => Promise<void>;
  saveToNotes: (section: 'all' | 'overview' | 'checklist' | 'tips' | 'resources') => string;
  clearError: () => void;
}

/**
 * Hook for managing task research
 */
export function useTaskResearch(task: Task): UseTaskResearchResult {
  const [research, setResearch] = useState<TaskResearch | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isFeatureEnabled } = useFeatureFlagStore();
  
  /**
   * Load research for the task
   */
  const loadResearch = useCallback(async () => {
    // Check if feature is enabled
    if (!isFeatureEnabled('aiResearchMode')) {
      setError('Research mode is not enabled');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[useTaskResearch] Loading research for:', task.title);
      const researchData = await AIIntelligenceEngine.research(task);
      setResearch(researchData);
      console.log('[useTaskResearch] Research loaded successfully');
    } catch (err) {
      console.error('[useTaskResearch] Error loading research:', err);
      
      if (err instanceof AIServiceError) {
        setError(err.message);
      } else {
        setError('Failed to load research. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [task, isFeatureEnabled]);
  
  /**
   * Refresh research (bypass cache)
   */
  const refreshResearch = useCallback(async () => {
    // Clear current research to force reload
    setResearch(null);
    await loadResearch();
  }, [loadResearch]);
  
  /**
   * Format research section for saving to notes
   */
  const saveToNotes = useCallback((
    section: 'all' | 'overview' | 'checklist' | 'tips' | 'resources'
  ): string => {
    if (!research) {
      return '';
    }
    
    let notesText = '\n\n--- AI Research ---\n\n';
    
    switch (section) {
      case 'overview':
        notesText += `📋 OVERVIEW\n${research.overview}\n\n`;
        if (research.keyPoints.length > 0) {
          notesText += '🎯 KEY POINTS\n';
          research.keyPoints.forEach(point => {
            notesText += `• ${point}\n`;
          });
        }
        if (research.estimatedTime) {
          notesText += `\n⏱️ Estimated Time: ${research.estimatedTime}\n`;
        }
        break;
      
      case 'checklist':
        notesText += '✅ CHECKLIST\n';
        research.checklist.forEach((item, index) => {
          notesText += `${index + 1}. ${item}\n`;
        });
        break;
      
      case 'tips':
        notesText += '💡 EXPERT TIPS\n';
        research.expertTips.forEach((tip, index) => {
          notesText += `\n${index + 1}. ${tip}\n`;
        });
        break;
      
      case 'resources':
        if (research.resources.length > 0) {
          notesText += '📚 RESOURCES\n';
          research.resources.forEach(resource => {
            notesText += `\n• ${resource.title}\n`;
            notesText += `  ${resource.url}\n`;
            if (resource.description) {
              notesText += `  ${resource.description}\n`;
            }
          });
        }
        break;
      
      case 'all':
        // Overview
        notesText += `📋 OVERVIEW\n${research.overview}\n\n`;
        
        // Key Points
        if (research.keyPoints.length > 0) {
          notesText += '🎯 KEY POINTS\n';
          research.keyPoints.forEach(point => {
            notesText += `• ${point}\n`;
          });
          notesText += '\n';
        }
        
        // Checklist
        if (research.checklist.length > 0) {
          notesText += '✅ CHECKLIST\n';
          research.checklist.forEach((item, index) => {
            notesText += `${index + 1}. ${item}\n`;
          });
          notesText += '\n';
        }
        
        // Expert Tips
        if (research.expertTips.length > 0) {
          notesText += '💡 EXPERT TIPS\n';
          research.expertTips.forEach((tip, index) => {
            notesText += `\n${index + 1}. ${tip}\n`;
          });
          notesText += '\n';
        }
        
        // Resources
        if (research.resources.length > 0) {
          notesText += '📚 RESOURCES\n';
          research.resources.forEach(resource => {
            notesText += `\n• ${resource.title}\n`;
            notesText += `  ${resource.url}\n`;
            if (resource.description) {
              notesText += `  ${resource.description}\n`;
            }
          });
          notesText += '\n';
        }
        
        // Estimated Time
        if (research.estimatedTime) {
          notesText += `⏱️ Estimated Time: ${research.estimatedTime}\n`;
        }
        break;
    }
    
    // Add citations
    if (research.citations.length > 0) {
      notesText += '\n📚 SOURCES\n';
      research.citations.forEach((citation, index) => {
        notesText += `${index + 1}. ${citation.url}\n`;
      });
    }
    
    return notesText;
  }, [research]);
  
  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    research,
    isLoading,
    error,
    loadResearch,
    refreshResearch,
    saveToNotes,
    clearError,
  };
}
