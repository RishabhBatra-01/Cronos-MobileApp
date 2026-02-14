/**
 * Sub-Task Suggestions Hook
 * Phase 4: Voice Enhancement
 * 
 * Manages sub-task suggestion state and operations
 */

import { useState, useCallback } from 'react';
import { Task, TaskPriority } from '../core/store/useTaskStore';
import { SubTask, AIServiceError } from '../core/types/ai-assistant';
import * as AIIntelligenceEngine from '../services/AIIntelligenceEngine';
import { useFeatureFlagStore } from '../core/store/useFeatureFlagStore';

export interface SubTaskSuggestion extends SubTask {
  id: string;
  selected: boolean;
}

interface SubTaskSuggestionsData {
  parentTaskId: string;
  parentTaskTitle: string;
  suggestions: SubTaskSuggestion[];
  generatedAt: string;
}

interface UseSubTaskSuggestionsResult {
  suggestions: SubTaskSuggestionsData | null;
  isLoading: boolean;
  error: string | null;
  selectedIds: Set<string>;
  generateSuggestions: (task: Task) => Promise<void>;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  getSelectedSuggestions: () => SubTaskSuggestion[];
  clearSuggestions: () => void;
  clearError: () => void;
}

/**
 * Hook for managing sub-task suggestions
 */
export function useSubTaskSuggestions(): UseSubTaskSuggestionsResult {
  const [suggestions, setSuggestions] = useState<SubTaskSuggestionsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const { isFeatureEnabled } = useFeatureFlagStore();
  
  /**
   * Generate suggestions for a task
   */
  const generateSuggestions = useCallback(async (task: Task) => {
    // Check if feature is enabled
    if (!isFeatureEnabled('aiVoiceEnhancement')) {
      setError('Voice enhancement is not enabled');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[useSubTaskSuggestions] Generating suggestions for:', task.title);
      
      // Call AI engine to generate sub-tasks
      const subTasks = await AIIntelligenceEngine.generateSubTasks(task);
      
      if (!subTasks || subTasks.length === 0) {
        console.log('[useSubTaskSuggestions] No suggestions generated');
        setSuggestions(null);
        setIsLoading(false);
        return;
      }
      
      // Convert to suggestions with IDs and selection state
      const suggestionsWithIds: SubTaskSuggestion[] = subTasks.map((subTask, index) => ({
        ...subTask,
        id: `suggestion-${Date.now()}-${index}`,
        selected: true, // All selected by default
      }));
      
      // Calculate due dates relative to parent task
      const parentDueDate = task.dueDate ? new Date(task.dueDate) : null;
      if (parentDueDate) {
        suggestionsWithIds.forEach(suggestion => {
          if (suggestion.estimatedTime) {
            // Parse estimated time and set due date before parent
            const timeMatch = suggestion.estimatedTime.match(/(\d+)\s*(minute|hour|day)/i);
            if (timeMatch) {
              const value = parseInt(timeMatch[1]);
              const unit = timeMatch[2].toLowerCase();
              
              const suggestedDueDate = new Date(parentDueDate);
              if (unit.startsWith('minute')) {
                suggestedDueDate.setMinutes(suggestedDueDate.getMinutes() - value);
              } else if (unit.startsWith('hour')) {
                suggestedDueDate.setHours(suggestedDueDate.getHours() - value);
              } else if (unit.startsWith('day')) {
                suggestedDueDate.setDate(suggestedDueDate.getDate() - value);
              }
              
              // Only set if it's in the future
              if (suggestedDueDate > new Date()) {
                suggestion.dueDate = suggestedDueDate.toISOString();
              }
            }
          }
        });
      }
      
      const suggestionsData: SubTaskSuggestionsData = {
        parentTaskId: task.id,
        parentTaskTitle: task.title,
        suggestions: suggestionsWithIds,
        generatedAt: new Date().toISOString(),
      };
      
      setSuggestions(suggestionsData);
      
      // Select all by default
      const allIds = new Set(suggestionsWithIds.map(s => s.id));
      setSelectedIds(allIds);
      
      console.log('[useSubTaskSuggestions] Generated', suggestionsWithIds.length, 'suggestions');
    } catch (err) {
      console.error('[useSubTaskSuggestions] Error generating suggestions:', err);
      
      if (err instanceof AIServiceError) {
        setError(err.message);
      } else {
        setError('Failed to generate suggestions. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isFeatureEnabled]);
  
  /**
   * Toggle selection of a suggestion
   */
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);
  
  /**
   * Select all suggestions
   */
  const selectAll = useCallback(() => {
    if (!suggestions) return;
    
    const allIds = new Set(suggestions.suggestions.map(s => s.id));
    setSelectedIds(allIds);
  }, [suggestions]);
  
  /**
   * Deselect all suggestions
   */
  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);
  
  /**
   * Get selected suggestions
   */
  const getSelectedSuggestions = useCallback((): SubTaskSuggestion[] => {
    if (!suggestions) return [];
    
    return suggestions.suggestions.filter(s => selectedIds.has(s.id));
  }, [suggestions, selectedIds]);
  
  /**
   * Clear suggestions and reset state
   */
  const clearSuggestions = useCallback(() => {
    setSuggestions(null);
    setSelectedIds(new Set());
    setError(null);
  }, []);
  
  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    suggestions,
    isLoading,
    error,
    selectedIds,
    generateSuggestions,
    toggleSelection,
    selectAll,
    deselectAll,
    getSelectedSuggestions,
    clearSuggestions,
    clearError,
  };
}
