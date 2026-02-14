import { Check, ChevronDown, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { COMMON_OFFSETS, getDurationLabel } from '../core/scheduling/DurationUtils';
import { cn } from '../lib/utils';

interface NotifyBeforePickerProps {
    value: string[];
    onChange: (offsets: string[]) => void;
}

export function NotifyBeforePicker({ value, onChange }: NotifyBeforePickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOffset = (offset: string) => {
        if (value.includes(offset)) {
            // Remove offset
            onChange(value.filter(o => o !== offset));
        } else {
            // Add offset (keep sorted by duration)
            const newOffsets = [...value, offset];
            // Sort by duration (shortest first)
            newOffsets.sort((a, b) => {
                const indexA = COMMON_OFFSETS.findIndex(o => o.value === a);
                const indexB = COMMON_OFFSETS.findIndex(o => o.value === b);
                return indexA - indexB;
            });
            onChange(newOffsets);
        }
    };

    const getDisplayText = () => {
        if (value.length === 0) {
            return 'None';
        }
        if (value.length === 1) {
            return getDurationLabel(value[0]);
        }
        return `${value.length} reminders`;
    };

    return (
        <>
            {/* Compact Dropdown Button */}
            <TouchableOpacity
                onPress={() => setIsOpen(true)}
                className="flex-row items-center justify-between p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                activeOpacity={0.7}
            >
                <Text className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {getDisplayText()}
                </Text>
                <ChevronDown size={18} className="text-zinc-500 dark:text-zinc-400" pointerEvents="none" />
            </TouchableOpacity>

            {/* Full-Screen Modal */}
            <Modal
                visible={isOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsOpen(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => setIsOpen(false)}
                        className="flex-1"
                    />

                    <View className="bg-white dark:bg-zinc-900 rounded-t-3xl p-6 pb-10 border-t border-zinc-100 dark:border-zinc-800 max-h-[70%]">
                        {/* Header */}
                        <View className="flex-row items-center justify-between mb-6">
                            <Text className="text-xl font-bold text-zinc-900 dark:text-white">
                                Notify Before
                            </Text>
                            <TouchableOpacity
                                onPress={() => setIsOpen(false)}
                                className="p-2 -mr-2 bg-zinc-100 dark:bg-zinc-800 rounded-full"
                            >
                                <X size={20} className="text-zinc-500 dark:text-zinc-400" pointerEvents="none" />
                            </TouchableOpacity>
                        </View>

                        {/* Subtitle */}
                        <Text className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                            Select when you want to be notified before the task is due
                        </Text>

                        {/* Options List */}
                        <View className="gap-2">
                            {COMMON_OFFSETS.map((offset) => {
                                const isSelected = value.includes(offset.value);

                                return (
                                    <TouchableOpacity
                                        key={offset.value}
                                        onPress={() => toggleOffset(offset.value)}
                                        className={cn(
                                            "flex-row items-center gap-3 p-4 rounded-xl border",
                                            isSelected
                                                ? "bg-secondary/30 dark:bg-secondary/10 border-primary"
                                                : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                                        )}
                                        activeOpacity={0.7}
                                    >
                                        {/* Checkbox */}
                                        <View
                                            className={cn(
                                                "w-5 h-5 rounded border-2 items-center justify-center",
                                                isSelected
                                                    ? "bg-primary border-primary"
                                                    : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600"
                                            )}
                                        >
                                            {isSelected && (
                                                <Check size={14} className="text-white" pointerEvents="none" />
                                            )}
                                        </View>

                                        {/* Label */}
                                        <Text
                                            className={cn(
                                                "text-base font-medium flex-1",
                                                isSelected
                                                    ? "text-primary dark:text-primary-dark"
                                                    : "text-zinc-700 dark:text-zinc-300"
                                            )}
                                        >
                                            {offset.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Done Button */}
                        <TouchableOpacity
                            onPress={() => setIsOpen(false)}
                            className="mt-6 p-4 rounded-xl bg-zinc-900 dark:bg-white"
                        >
                            <Text className="text-center text-white dark:text-black font-bold text-base">
                                Done
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}
