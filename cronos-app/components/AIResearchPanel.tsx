/**
 * AI Research Panel Component
 * Phase 3: Research Mode
 * 
 * Full-screen research interface with tabs
 */

import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Task, useTaskStore } from '../core/store/useTaskStore';
import { useTaskResearch } from '../hooks/use-task-research';

const markdownStyles = {
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#E5E5E7',
  },
  heading1: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
    marginVertical: 10,
  },
  heading2: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
    marginVertical: 8,
  },
  strong: {
    fontWeight: 'bold' as const,
    color: '#820AD1',
  },
  link: {
    color: '#820AD1',
    textDecorationLine: 'underline' as const,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 10,
  },
  list_item: {
    marginVertical: 4,
  },
};

interface AIResearchPanelProps {
  visible: boolean;
  task: Task;
  onClose: () => void;
  onSaveToNotes?: (notes: string) => void;
}

type TabType = 'overview' | 'checklist' | 'resources' | 'tips';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function AIResearchPanel({ visible, task, onClose, onSaveToNotes }: AIResearchPanelProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { updateTask } = useTaskStore();

  const {
    research,
    isLoading,
    error,
    loadResearch,
    refreshResearch,
    saveToNotes: saveToNotesInternal, // Renamed to avoid conflict
    clearError,
  } = useTaskResearch(task);

  // Load research when modal opens
  useEffect(() => {
    if (visible && !research && !isLoading && !error) {
      loadResearch();
    }
  }, [visible, research, isLoading, error, loadResearch]);

  // Reset tab when modal opens
  useEffect(() => {
    if (visible) {
      setActiveTab('overview');
    }
  }, [visible]);

  /**
   * Handle tab change
   */
  const handleTabChange = (tab: TabType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  /**
   * Handle save to notes
   */
  const handleSaveToNotes = async (section?: 'all' | 'overview' | 'checklist' | 'tips' | 'resources') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (!section) section = 'all';
      const notesText = saveToNotesInternal(section);

      if (onSaveToNotes) {
        onSaveToNotes(notesText);
        Alert.alert(
          'Saved!',
          'Research has been added to task notes.',
          [{ text: 'OK', onPress: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) }]
        );
        return;
      }

      const currentNotes = task.description || '';
      const updatedNotes = currentNotes + notesText;

      // Use correct updateTask signature
      updateTask(
        task.id,
        task.title,
        task.dueDate,
        task.priority,
        updatedNotes,
        task.repeatType,
        task.repeatConfig,
        task.preNotifyOffsets,
        task.snoozeEnabled,
        task.snoozeDuration
      );

      Alert.alert(
        'Saved!',
        'Research has been added to task notes.',
        [{ text: 'OK', onPress: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) }]
      );
    } catch (err) {
      console.error('[AIResearchPanel] Error saving to notes:', err);
      Alert.alert('Error', 'Failed to save to notes. Please try again.');
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await refreshResearch();
  };

  /**
   * Handle retry after error
   */
  const handleRetry = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearError();
    await loadResearch();
  };

  /**
   * Handle close
   */
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  /**
   * Open URL in browser
   */
  const openURL = async (url: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (err) {
      console.error('[AIResearchPanel] Error opening URL:', err);
      Alert.alert('Error', 'Failed to open URL');
    }
  };

  /**
   * Render tab button
   */
  const renderTabButton = (tab: TabType, label: string, icon: string) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.tabButtonActive]}
        onPress={() => handleTabChange(tab)}
      >
        <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>{icon}</Text>
        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  /**
   * Render overview tab
   */
  const renderOverviewTab = () => {
    if (!research) return null;

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 OVERVIEW</Text>
          <Markdown style={markdownStyles}>{research.overview}</Markdown>
        </View>

        {/* Key Points */}
        {research.keyPoints.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 KEY POINTS</Text>
            {research.keyPoints.map((point, index) => (
              <View key={index} style={styles.bulletItem}>
                <Text style={styles.bullet}>•</Text>
                <View style={{ flex: 1 }}>
                  <Markdown style={markdownStyles}>{point}</Markdown>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Estimated Time */}
        {research.estimatedTime && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏱️ ESTIMATED TIME</Text>
            <Text style={styles.bodyText}>{research.estimatedTime}</Text>
          </View>
        )}

        {/* Citations */}
        {research.citations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📚 SOURCES ({research.citations.length})</Text>
            {research.citations.map((citation, index) => (
              <TouchableOpacity
                key={index}
                style={styles.citationItem}
                onPress={() => openURL(citation.url)}
              >
                <Text style={styles.citationNumber}>{index + 1}.</Text>
                <View style={styles.citationContent}>
                  <Text style={styles.citationSource}>{citation.source}</Text>
                  <Text style={styles.citationUrl} numberOfLines={1}>{citation.url}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => handleSaveToNotes('overview')}
        >
          <Text style={styles.saveButtonText}>💾 Save Overview to Notes</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    );
  };

  /**
   * Render checklist tab
   */
  const renderChecklistTab = () => {
    if (!research || research.checklist.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No checklist available</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ CHECKLIST</Text>
          {research.checklist.map((item, index) => (
            <View key={index} style={styles.checklistItem}>
              <Text style={styles.checklistNumber}>{index + 1}.</Text>
              <View style={{ flex: 1 }}>
                <Markdown style={markdownStyles}>{item}</Markdown>
              </View>
            </View>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => handleSaveToNotes('checklist')}
        >
          <Text style={styles.saveButtonText}>💾 Save Checklist to Notes</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    );
  };

  /**
   * Render resources tab
   */
  const renderResourcesTab = () => {
    if (!research || research.resources.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No resources available</Text>
        </View>
      );
    }

    // Group resources by type
    const groupedResources = research.resources.reduce((acc, resource) => {
      const type = resource.type || 'other';
      if (!acc[type]) acc[type] = [];
      acc[type].push(resource);
      return acc;
    }, {} as Record<string, typeof research.resources>);

    const typeIcons: Record<string, string> = {
      article: '📄',
      video: '🎥',
      course: '🎓',
      documentation: '📖',
      tool: '🛠️',
      other: '🔗',
    };

    const typeLabels: Record<string, string> = {
      article: 'ARTICLES',
      video: 'VIDEOS',
      course: 'COURSES',
      documentation: 'DOCUMENTATION',
      tool: 'TOOLS',
      other: 'OTHER RESOURCES',
    };

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {Object.entries(groupedResources).map(([type, resources]) => (
          <View key={type} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {typeIcons[type]} {typeLabels[type]}
            </Text>
            {resources.map((resource, index) => (
              <TouchableOpacity
                key={index}
                style={styles.resourceItem}
                onPress={() => openURL(resource.url)}
              >
                <Text style={styles.resourceTitle}>{resource.title}</Text>
                {resource.description && (
                  <View style={{ marginBottom: 6 }}>
                    <Markdown style={{
                      ...markdownStyles,
                      body: {
                        fontSize: 14,
                        color: '#8E8E93',
                        lineHeight: 20,
                      }
                    }}>
                      {resource.description}
                    </Markdown>
                  </View>
                )}
                <Text style={styles.resourceUrl} numberOfLines={1}>{resource.url}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => handleSaveToNotes('resources')}
        >
          <Text style={styles.saveButtonText}>💾 Save Resources to Notes</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    );
  };

  /**
   * Render tips tab
   */
  const renderTipsTab = () => {
    if (!research || research.expertTips.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No tips available</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 EXPERT TIPS</Text>
          {research.expertTips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <View style={styles.tipHeader}>
                <Text style={styles.tipNumber}>{index + 1}</Text>
              </View>
              <Markdown style={markdownStyles}>{tip}</Markdown>
            </View>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => handleSaveToNotes('tips')}
        >
          <Text style={styles.saveButtonText}>💾 Save Tips to Notes</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    );
  };

  /**
   * Render loading state
   */
  const renderLoading = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#820AD1" />
      <Text style={styles.loadingText}>Researching task...</Text>
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerIcon}>🔍</Text>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Research</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {typeof task.title === 'string' ? task.title : String(task.title || '')}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {research && !isLoading && (
              <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                <Text style={styles.refreshIcon}>🔄</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        {isLoading ? (
          renderLoading()
        ) : error ? (
          renderError()
        ) : research ? (
          <>
            {/* Tabs */}
            <View style={styles.tabs}>
              {renderTabButton('overview', 'Overview', '📋')}
              {renderTabButton('checklist', 'Checklist', '✅')}
              {renderTabButton('resources', 'Resources', '📚')}
              {renderTabButton('tips', 'Tips', '💡')}
            </View>

            {/* Tab Content */}
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'checklist' && renderChecklistTab()}
            {activeTab === 'resources' && renderResourcesTab()}
            {activeTab === 'tips' && renderTipsTab()}

            {/* Save All Button */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <TouchableOpacity
                style={styles.saveAllButton}
                onPress={() => handleSaveToNotes('all')}
              >
                <Text style={styles.saveAllButtonText}>💾 Save All to Notes</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
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
    borderBottomColor: 'rgba(130, 10, 209, 0.2)', // primary with 20% opacity
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    padding: 8,
  },
  refreshIcon: {
    fontSize: 20,
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    fontSize: 24,
    color: '#8E8E93',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(130, 10, 209, 0.2)',
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#820AD1',
  },
  tabIcon: {
    fontSize: 16,
  },
  tabIconActive: {
    fontSize: 16,
  },
  tabLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#820AD1',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#E5E5E7',
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 15,
    color: '#820AD1',
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#E5E5E7',
  },
  checklistItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
  },
  checklistNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#820AD1',
    marginRight: 12,
    minWidth: 24,
  },
  checklistText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#E5E5E7',
  },
  resourceItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#820AD1',
  },
  resourceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 6,
    lineHeight: 20,
  },
  resourceUrl: {
    fontSize: 12,
    color: '#820AD1',
  },
  tipItem: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
  },
  tipHeader: {
    marginBottom: 8,
  },
  tipNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#820AD1',
  },
  tipText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#E5E5E7',
  },
  citationItem: {
    flexDirection: 'row',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
  },
  citationNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#820AD1',
    marginRight: 12,
    minWidth: 24,
  },
  citationContent: {
    flex: 1,
  },
  citationSource: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  citationUrl: {
    fontSize: 12,
    color: '#8E8E93',
  },
  saveButton: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#820AD1',
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(130, 10, 209, 0.2)',
    backgroundColor: '#000000',
  },
  saveAllButton: {
    padding: 16,
    backgroundColor: '#30D158',
    borderRadius: 12,
    alignItems: 'center',
  },
  saveAllButtonText: {
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 100,
  },
});
