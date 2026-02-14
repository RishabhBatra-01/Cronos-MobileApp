/**
 * AI Sub-Task Suggestions Component
 * Phase 4: Voice Enhancement
 * 
 * Modal to display and select AI-generated sub-task suggestions
 */

import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Task } from '../core/store/useTaskStore';
import { SubTaskSuggestion, useSubTaskSuggestions } from '../hooks/use-sub-task-suggestions';

interface AISubTaskSuggestionsProps {
  visible: boolean;
  parentTask: Task;
  onAdd: (suggestions: SubTaskSuggestion[]) => void;
  onSkip: () => void;
}

export function AISubTaskSuggestions({
  visible,
  parentTask,
  onAdd,
  onSkip,
}: AISubTaskSuggestionsProps) {
  const {
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
  } = useSubTaskSuggestions();

  // Load suggestions when modal opens
  useEffect(() => {
    if (visible && !suggestions && !isLoading && !error) {
      generateSuggestions(parentTask);
    }
  }, [visible, suggestions, isLoading, error, generateSuggestions, parentTask]);

  // Reset when modal closes
  useEffect(() => {
    if (!visible) {
      clearSuggestions();
    }
  }, [visible, clearSuggestions]);

  /**
   * Handle add selected
   */
  const handleAdd = () => {
    const selected = getSelectedSuggestions();
    if (selected.length === 0) {
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd(selected);
  };

  /**
   * Handle skip
   */
  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip();
  };

  /**
   * Handle retry after error
   */
  const handleRetry = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearError();
    await generateSuggestions(parentTask);
  };

  /**
   * Handle toggle selection
   */
  const handleToggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSelection(id);
  };

  /**
   * Handle select all
   */
  const handleSelectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    selectAll();
  };

  /**
   * Handle deselect all
   */
  const handleDeselectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    deselectAll();
  };

  /**
   * Render suggestion item
   */
  const renderSuggestion = (suggestion: SubTaskSuggestion) => {
    const isSelected = selectedIds.has(suggestion.id);

    return (
      <TouchableOpacity
        key={suggestion.id}
        onPress={() => handleToggle(suggestion.id)}
        style={[
          styles.suggestionItem,
          isSelected && styles.suggestionItemSelected,
        ]}
        activeOpacity={0.7}
      >
        <View style={styles.checkbox}>
          {isSelected && (
            <View style={styles.checkboxChecked}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          )}
          {!isSelected && <View style={styles.checkboxUnchecked} />}
        </View>

        <View style={styles.suggestionContent}>
          <Text style={styles.suggestionTitle}>{suggestion.title}</Text>

          {suggestion.description && (
            <Text style={styles.suggestionDescription}>
              {suggestion.description}
            </Text>
          )}

          <View style={styles.suggestionMeta}>
            {suggestion.estimatedTime && (
              <Text style={styles.suggestionTime}>
                ⏱️ {suggestion.estimatedTime}
              </Text>
            )}
            {suggestion.priority && suggestion.priority !== 'medium' && (
              <Text style={[
                styles.suggestionPriority,
                suggestion.priority === 'high' && styles.priorityHigh,
                suggestion.priority === 'low' && styles.priorityLow,
              ]}>
                {suggestion.priority === 'high' ? '🔴' : '🟢'} {suggestion.priority}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Render loading state
   */
  const renderLoading = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#820AD1" />
      <Text style={styles.loadingText}>Generating suggestions...</Text>
    </View>
  );

  /**
   * Render error state
   */
  const renderError = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Render empty state
   */
  const renderEmpty = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.emptyIcon}>💡</Text>
      <Text style={styles.emptyText}>No suggestions available</Text>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );

  const selectedCount = selectedIds.size;
  const hasSelections = selectedCount > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleSkip}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerIcon}>💡</Text>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Suggested Sub-Tasks</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                For: {typeof parentTask.title === 'string' ? parentTask.title : String(parentTask.title || '')}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleSkip}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {isLoading ? (
          renderLoading()
        ) : error ? (
          renderError()
        ) : !suggestions || suggestions.suggestions.length === 0 ? (
          renderEmpty()
        ) : (
          <>
            {/* Suggestions List */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.instructionText}>
                Select the sub-tasks you want to add:
              </Text>

              {suggestions.suggestions.map(renderSuggestion)}

              <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              {/* Select All / Deselect All */}
              <View style={styles.selectionButtons}>
                <TouchableOpacity
                  style={styles.selectionButton}
                  onPress={handleSelectAll}
                >
                  <Text style={styles.selectionButtonText}>Select All</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.selectionButton}
                  onPress={handleDeselectAll}
                >
                  <Text style={styles.selectionButtonText}>Deselect All</Text>
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.skipButtonFooter}
                  onPress={handleSkip}
                >
                  <Text style={styles.skipButtonFooterText}>Skip</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.addButton,
                    !hasSelections && styles.addButtonDisabled,
                  ]}
                  onPress={handleAdd}
                  disabled={!hasSelections}
                >
                  <Text style={styles.addButtonText}>
                    Add Selected {hasSelections ? `(${selectedCount})` : ''}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(130, 10, 209, 0.2)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    fontSize: 24,
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  suggestionItemSelected: {
    borderColor: '#820AD1',
    backgroundColor: '#1C1C1E',
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  checkboxUnchecked: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3A3A3C',
  },
  checkboxChecked: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#820AD1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    lineHeight: 20,
  },
  suggestionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  suggestionTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  suggestionPriority: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  priorityHigh: {
    color: '#FF453A',
  },
  priorityLow: {
    color: '#30D158',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(130, 10, 209, 0.2)',
    backgroundColor: '#000000',
  },
  selectionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  selectionButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#820AD1',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButtonFooter: {
    flex: 1,
    padding: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    alignItems: 'center',
  },
  skipButtonFooterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  addButton: {
    flex: 2,
    padding: 16,
    backgroundColor: '#820AD1',
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#2C2C2E',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#820AD1',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  skipButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  bottomSpacer: {
    height: 20,
  },
});
