/**
 * AI Assistant Button
 * Phase 2: Conversational Assistant
 * 
 * Sparkle button to trigger AI chat
 * - Two sizes: small (task list) and large (modals)
 * - Feature flag controlled
 * - Opens AIConversationModal
 */

import * as Haptics from 'expo-haptics';
import { Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useFeatureFlagStore } from '../core/store/useFeatureFlagStore';
import { Task } from '../core/store/useTaskStore';
import { cn } from '../lib/utils';
import { AIConversationModal } from './AIConversationModal';

interface AIAssistantButtonProps {
  task: Task | Partial<Task>;
  size?: 'small' | 'large';
  disabled?: boolean;
  onPress?: () => void;
  onSaveToNotes?: (notes: string) => void;
}

export function AIAssistantButton({
  task,
  size = 'small',
  disabled = false,
  onPress,
  onSaveToNotes,
}: AIAssistantButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { aiConversationalChat, aiAssistantEnabled } = useFeatureFlagStore();

  // Don't render if feature is disabled
  if (!aiAssistantEnabled || !aiConversationalChat) {
    return null;
  }

  // Don't render if task has no title
  if (!task.title || typeof task.title !== 'string' || task.title.trim() === '') {
    return null;
  }

  const handlePress = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Custom onPress or open modal
    if (onPress) {
      onPress();
    } else {
      setModalVisible(true);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  // Small variant (for task list)
  if (size === 'small') {
    return (
      <>
        <TouchableOpacity
          onPress={handlePress}
          disabled={disabled}
          className={cn(
            "p-1 rounded-full",
            disabled && "opacity-50"
          )}
          accessibilityLabel="Ask AI about this task"
          accessibilityHint="Opens AI chat to ask questions about this task"
        >
          <Sparkles
            size={16}
            className="text-primary dark:text-primary-dark"
            pointerEvents="none"
          />
        </TouchableOpacity>

        {/* Modal */}
        {task.id && (
          <AIConversationModal
            visible={modalVisible}
            task={task as Task}
            onClose={handleCloseModal}
            onSaveToNotes={onSaveToNotes}
          />
        )}
      </>
    );
  }

  // Large variant (for modals)
  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        className={cn(
          "flex-row items-center gap-2 px-4 py-2.5 rounded-full",
          "bg-secondary/50 dark:bg-secondary/10",
          disabled && "opacity-50"
        )}
        accessibilityLabel="Ask AI"
        accessibilityHint="Opens AI chat to get help with this task"
      >
        <Sparkles
          size={20}
          className="text-primary dark:text-primary-dark"
          pointerEvents="none"
        />
        <Text className="text-sm font-semibold text-primary dark:text-primary-dark">
          Ask AI
        </Text>
      </TouchableOpacity>

      {/* Modal */}
      {task.id && (
        <AIConversationModal
          visible={modalVisible}
          task={task as Task}
          onClose={handleCloseModal}
          onSaveToNotes={onSaveToNotes}
        />
      )}
    </>
  );
}
