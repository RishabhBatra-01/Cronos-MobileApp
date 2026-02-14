/**
 * AI Conversation Modal
 * Phase 2: Conversational Assistant
 * 
 * Full-screen chat interface for AI conversations
 * - Multi-turn conversations
 * - Citations display
 * - Save to notes
 * - Conversation history
 */

import * as Haptics from 'expo-haptics';
import { ExternalLink, Save, Send, Trash2, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Task, useTaskStore } from '../core/store/useTaskStore';
import { ChatMessage } from '../core/types/ai-assistant';
import { useAIConversation } from '../hooks/use-ai-conversation';
import { cn, stripMarkdown } from '../lib/utils';

interface AIConversationModalProps {
  visible: boolean;
  task: Task;
  onClose: () => void;
  onSaveToNotes?: (notes: string) => void;
}

export function AIConversationModal({ visible, task, onClose, onSaveToNotes }: AIConversationModalProps) {
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearConversation,
    retry,
    hasHistory,
  } = useAIConversation(task);

  const { updateTask } = useTaskStore();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Focus input when modal opens
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [visible]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) {
      return;
    }

    const text = inputText.trim();
    setInputText('');

    await sendMessage(text);
  };

  const handleClearConversation = () => {
    Alert.alert(
      'Clear Conversation',
      'Are you sure you want to clear this conversation? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearConversation();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleSaveToNotes = (messageContent: string) => {
    // Strip markdown formatting for cleaner plain text notes
    const cleanContent = stripMarkdown(messageContent);

    // If external handler provided (e.g., from EditTaskModal), use that
    if (onSaveToNotes) {
      onSaveToNotes(cleanContent);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'AI response added to task notes!');
      return;
    }

    // Default behavior: Update store directly
    const currentNotes = task.description || '';
    const newNotes = currentNotes
      ? `${currentNotes}\n\n---\nAI Suggestion:\n${cleanContent}`
      : `AI Suggestion:\n${cleanContent}`;

    updateTask(
      task.id,
      task.title,
      task.dueDate,
      task.priority,
      newNotes,
      task.repeatType,
      task.repeatConfig,
      task.preNotifyOffsets,
      task.snoozeEnabled,
      task.snoozeDuration
    );

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Alert.alert('Saved', 'AI response saved to task notes!');
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(err => {
      console.error('[AIConversation] Error opening link:', err);
      Alert.alert('Error', 'Could not open link');
    });
    return true;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white dark:bg-zinc-900"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-primary/20 bg-white dark:bg-zinc-900">
          <View className="flex-1 mr-3">
            <Text className="text-lg font-bold text-zinc-900 dark:text-white">
              💬 Chat with AI
            </Text>
            <Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5" numberOfLines={1}>
              {typeof task.title === 'string' ? task.title : String(task.title || '')}
            </Text>
          </View>

          <View className="flex-row gap-2">
            {hasHistory && (
              <TouchableOpacity
                onPress={handleClearConversation}
                className="p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700"
                activeOpacity={0.7}
              >
                <Trash2 size={20} className="text-zinc-600 dark:text-zinc-400" pointerEvents="none" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={onClose}
              className="p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700"
              activeOpacity={0.7}
            >
              <X size={20} className="text-zinc-600 dark:text-zinc-400" pointerEvents="none" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && !isLoading && (
            <View className="flex-1 items-center justify-center py-16 px-6">
              <View className="bg-purple-100 dark:bg-purple-900/20 rounded-full p-6 mb-6">
                <Text className="text-5xl">✨</Text>
              </View>
              <Text className="text-xl font-bold text-zinc-900 dark:text-white mb-3 text-center">
                Ask me anything!
              </Text>
              <Text className="text-base text-zinc-500 dark:text-zinc-400 text-center leading-6 mb-6">
                I can help you with tips, checklists, research, and more about this task.
              </Text>

              {/* Suggested Questions */}
              <View className="gap-2 w-full">
                <Text className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1">
                  Try asking:
                </Text>
                {[
                  "What should I prepare?",
                  "Give me a checklist",
                  "Any tips for this task?"
                ].map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setInputText(suggestion);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3"
                    activeOpacity={0.7}
                  >
                    <Text className="text-sm text-zinc-700 dark:text-zinc-300">
                      💬 {suggestion}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {messages.map((message, index) => (
            <MessageBubble
              key={message.id || index}
              message={message}
              onSaveToNotes={handleSaveToNotes}
              onOpenLink={handleOpenLink}
            />
          ))}

          {isLoading && (
            <View className="flex-row items-start gap-3 mb-6">
              <View className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-3xl px-5 py-4 shadow-sm">
                <View className="flex-row items-center gap-3">
                  <ActivityIndicator size="small" color="#9333ea" />
                  <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                    Thinking...
                  </Text>
                </View>
              </View>
            </View>
          )}

          {error && (
            <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-3xl p-5 mb-6">
              <Text className="text-sm text-red-700 dark:text-red-300 mb-3 leading-5">
                {error}
              </Text>
              <TouchableOpacity
                onPress={retry}
                className="bg-red-100 dark:bg-red-900/40 rounded-xl px-4 py-2.5 self-start"
                activeOpacity={0.7}
              >
                <Text className="text-sm font-semibold text-red-700 dark:text-red-300">
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 bg-white dark:bg-zinc-900">
          <View className="flex-row items-end gap-3">
            <View className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-3xl border border-zinc-200 dark:border-zinc-700 px-4 py-2">
              <TextInput
                ref={inputRef}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type your question..."
                placeholderTextColor="#a1a1aa"
                className="text-[15px] text-zinc-900 dark:text-white min-h-[40px] max-h-[100px]"
                multiline
                maxLength={500}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                editable={!isLoading}
                style={{ lineHeight: 20 }}
              />
            </View>

            <TouchableOpacity
              onPress={() => {
                handleSend();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              disabled={!inputText.trim() || isLoading}
              className={cn(
                "bg-primary rounded-full p-3.5 shadow-lg",
                (!inputText.trim() || isLoading) && "opacity-40"
              )}
              activeOpacity={0.8}
            >
              <Send size={22} className="text-white" pointerEvents="none" />
            </TouchableOpacity>
          </View>

          {/* Character count */}
          {inputText.length > 400 && (
            <Text className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 text-right">
              {inputText.length}/500
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}


// ... imports

// Markdown styles
const markdownStyles = {
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: '#27272a', // zinc-800
  },
  heading1: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27272a',
    marginTop: 10,
    marginBottom: 5,
  },
  heading2: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#27272a',
    marginTop: 10,
    marginBottom: 5,
  },
  heading3: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27272a',
    marginTop: 10,
    marginBottom: 5,
  },
  bullet_list: {
    marginTop: 5,
    marginBottom: 5,
  },
  ordered_list: {
    marginTop: 5,
    marginBottom: 5,
  },
  list_item: {
    marginBottom: 5,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 10,
  },
  link: {
    color: '#820AD1', // Nu Purple
    textDecorationLine: 'underline',
  },
};

const markdownStylesDark = {
  ...markdownStyles,
  body: {
    ...markdownStyles.body,
    color: '#f4f4f5', // zinc-100
  },
  heading1: {
    ...markdownStyles.heading1,
    color: '#f4f4f5',
  },
  heading2: {
    ...markdownStyles.heading2,
    color: '#f4f4f5',
  },
  heading3: {
    ...markdownStyles.heading3,
    color: '#f4f4f5',
  },
  link: {
    color: '#A75FEE', // primary-light
  },
};

// ... existing code ...

// Message Bubble Component
function MessageBubble({
  message,
  onSaveToNotes,
  onOpenLink,
}: {
  message: ChatMessage;
  onSaveToNotes: (content: string) => void;
  onOpenLink: (url: string) => boolean;
}) {
  const [showCitations, setShowCitations] = useState(false);
  const isUser = message.role === 'user';
  const { colorScheme } = useColorScheme();

  return (
    <View
      className={cn(
        "mb-6",
        isUser ? "items-end" : "items-start"
      )}
    >
      <View
        className={cn(
          "max-w-[85%] rounded-3xl px-5 py-4 shadow-sm",
          isUser
            ? "bg-primary"
            : "bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700"
        )}
      >
        {/* Message Content with Markdown support */}
        {isUser ? (
          <Text
            className="text-[15px] leading-6 text-white"
            style={{ lineHeight: 22 }}
          >
            {message.content}
          </Text>
        ) : (
          <Markdown
            style={colorScheme === 'dark' ? markdownStylesDark : markdownStyles}
            onLinkPress={onOpenLink}
          >
            {message.content}
          </Markdown>
        )}

        {/* Citations - Improved Design */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <View className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <TouchableOpacity
              onPress={() => {
                setShowCitations(!showCitations);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className="flex-row items-center gap-2 mb-2"
              activeOpacity={0.7}
            >
              <View className="bg-purple-100 dark:bg-purple-900/30 rounded-full px-3 py-1.5">
                <Text className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                  📚 {message.citations.length} {message.citations.length === 1 ? 'Source' : 'Sources'}
                </Text>
              </View>
              <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                {showCitations ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {showCitations && (
              <View className="gap-2 mt-2">
                {message.citations.map((citation, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      onOpenLink(citation.url);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className="flex-row items-center gap-2 bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-700"
                    activeOpacity={0.7}
                  >
                    <View className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-1.5">
                      <ExternalLink size={12} className="text-purple-600 dark:text-purple-400" pointerEvents="none" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-medium text-zinc-700 dark:text-zinc-300" numberOfLines={1}>
                        {citation.title || citation.source}
                      </Text>
                      <Text className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-0.5" numberOfLines={1}>
                        {citation.source}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Save to Notes Button - Improved Design */}
        {!isUser && (
          <TouchableOpacity
            onPress={() => {
              onSaveToNotes(message.content);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-center gap-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl py-2.5 px-4">
              <Save size={16} className="text-purple-600 dark:text-purple-400" pointerEvents="none" />
              <Text className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                Save to Notes
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Timestamp - Better positioning */}
      <View className={cn(
        "mt-1.5 px-3",
        isUser ? "items-end" : "items-start"
      )}>
        <Text className="text-[11px] text-zinc-400 dark:text-zinc-500">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    </View>
  );
}
