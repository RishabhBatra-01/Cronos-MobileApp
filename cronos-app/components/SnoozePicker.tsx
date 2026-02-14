import { ChevronDown, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { cn } from '../lib/utils';

interface SnoozePickerProps {
    enabled: boolean;
    duration?: string;  // ISO 8601 duration
    onChange: (enabled: boolean, duration?: string) => void;
}

const SNOOZE_OPTIONS = [
    { value: null, label: 'Disabled', enabled: false },
    { value: 'PT5M', label: '5 minutes', enabled: true },
    { value: 'PT10M', label: '10 minutes', enabled: true },
    { value: 'PT30M', label: '30 minutes', enabled: true },
    { value: 'PT1H', label: '1 hour', enabled: true },
] as const;

export function SnoozePicker({ enabled, duration, onChange }: SnoozePickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    const getDisplayText = () => {
        if (!enabled) {
            return 'Disabled';
        }
        const option = SNOOZE_OPTIONS.find(opt => opt.value === duration);
        return option?.label || 'Disabled';
    };

    const handleSelect = (optionEnabled: boolean, optionValue: string | null) => {
        onChange(optionEnabled, optionValue || undefined);
        setIsOpen(false);
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

                    <View className="bg-white dark:bg-zinc-900 rounded-t-3xl p-6 pb-10 border-t border-zinc-100 dark:border-zinc-800">
                        {/* Header */}
                        <View className="flex-row items-center justify-between mb-6">
                            <Text className="text-xl font-bold text-zinc-900 dark:text-white">
                                Snooze Duration
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
                            Choose how long to snooze when you tap the snooze button
                        </Text>

                        {/* Options List */}
                        <View className="gap-2">
                            {SNOOZE_OPTIONS.map((option) => {
                                const isSelected = enabled === option.enabled &&
                                    (option.value === duration || (!option.value && !duration));

                                return (
                                    <TouchableOpacity
                                        key={option.label}
                                        onPress={() => handleSelect(option.enabled, option.value)}
                                        className={cn(
                                            "p-4 rounded-xl border",
                                            isSelected
                                                ? "bg-secondary/30 dark:bg-secondary/10 border-primary"
                                                : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                                        )}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            className={cn(
                                                "text-base font-medium",
                                                isSelected
                                                    ? "text-primary dark:text-primary-dark"
                                                    : "text-zinc-700 dark:text-zinc-300"
                                            )}
                                        >
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}
