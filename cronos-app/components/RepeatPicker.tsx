import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { DailyRepeatConfig, MonthlyRepeatConfig, RepeatConfig, RepeatType, WeeklyRepeatConfig } from '../core/store/useTaskStore';
import { cn } from '../lib/utils';

interface RepeatPickerProps {
    repeatType: RepeatType;
    repeatConfig: RepeatConfig;
    onChange: (type: RepeatType, config: RepeatConfig) => void;
}

export function RepeatPicker({ repeatType, repeatConfig, onChange }: RepeatPickerProps) {
    const [expanded, setExpanded] = useState(false);

    const repeatTypes: { value: RepeatType; label: string }[] = [
        { value: 'NONE', label: 'Does not repeat' },
        { value: 'DAILY', label: 'Daily' },
        { value: 'WEEKLY', label: 'Weekly' },
        { value: 'MONTHLY', label: 'Monthly' },
    ];

    const handleTypeSelect = (type: RepeatType) => {
        setExpanded(false);

        // Set default config for each type
        let defaultConfig: RepeatConfig = null;

        switch (type) {
            case 'DAILY':
                defaultConfig = { intervalDays: 1 };
                break;
            case 'WEEKLY':
                defaultConfig = { daysOfWeek: ['MON'], intervalWeeks: 1 };
                break;
            case 'MONTHLY':
                defaultConfig = { dayOfMonth: 1, intervalMonths: 1 };
                break;
            case 'NONE':
            default:
                defaultConfig = null;
        }

        onChange(type, defaultConfig);
    };

    const currentLabel = repeatTypes.find(t => t.value === repeatType)?.label || 'Does not repeat';

    return (
        <View>
            {/* Repeat Type Selector */}
            <TouchableOpacity
                onPress={() => setExpanded(!expanded)}
                className="flex-row items-center justify-between p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800"
            >
                <Text className="text-sm text-zinc-900 dark:text-white">{currentLabel}</Text>
                <Text className="text-zinc-500">▼</Text>
            </TouchableOpacity>

            {/* Dropdown */}
            {expanded && (
                <View className="mt-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                    {repeatTypes.map((type) => (
                        <TouchableOpacity
                            key={type.value}
                            onPress={() => handleTypeSelect(type.value)}
                            className={cn(
                                "p-3 border-b border-zinc-200 dark:border-zinc-700",
                                repeatType === type.value && "bg-secondary/30 dark:bg-secondary/10"
                            )}
                        >
                            <Text className={cn(
                                "text-sm",
                                repeatType === type.value
                                    ? "text-primary dark:text-primary-dark font-medium"
                                    : "text-zinc-900 dark:text-white"
                            )}>
                                {type.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Configuration UI based on type */}
            {repeatType === 'DAILY' && repeatConfig && (
                <DailyConfig
                    config={repeatConfig as DailyRepeatConfig}
                    onChange={(config) => onChange(repeatType, config)}
                />
            )}

            {repeatType === 'WEEKLY' && repeatConfig && (
                <WeeklyConfig
                    config={repeatConfig as WeeklyRepeatConfig}
                    onChange={(config) => onChange(repeatType, config)}
                />
            )}

            {repeatType === 'MONTHLY' && repeatConfig && (
                <MonthlyConfig
                    config={repeatConfig as MonthlyRepeatConfig}
                    onChange={(config) => onChange(repeatType, config)}
                />
            )}
        </View>
    );
}

// Daily Configuration Component
function DailyConfig({ config, onChange }: { config: DailyRepeatConfig; onChange: (config: DailyRepeatConfig) => void }) {
    return (
        <View className="mt-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800">
            <View className="flex-row items-center gap-2">
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">Every</Text>
                <TextInput
                    value={String(config.intervalDays)}
                    onChangeText={(text) => {
                        const num = parseInt(text) || 1;
                        onChange({ intervalDays: Math.max(1, Math.min(365, num)) });
                    }}
                    keyboardType="number-pad"
                    className="w-16 text-center p-2 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700"
                />
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">day(s)</Text>
            </View>
        </View>
    );
}

// Weekly Configuration Component
function WeeklyConfig({ config, onChange }: { config: WeeklyRepeatConfig; onChange: (config: WeeklyRepeatConfig) => void }) {
    const days = [
        { short: 'S', full: 'SUN' },
        { short: 'M', full: 'MON' },
        { short: 'T', full: 'TUE' },
        { short: 'W', full: 'WED' },
        { short: 'T', full: 'THU' },
        { short: 'F', full: 'FRI' },
        { short: 'S', full: 'SAT' },
    ];

    const toggleDay = (day: string) => {
        const newDays = config.daysOfWeek.includes(day)
            ? config.daysOfWeek.filter(d => d !== day)
            : [...config.daysOfWeek, day];

        // Ensure at least one day is selected
        if (newDays.length > 0) {
            onChange({ ...config, daysOfWeek: newDays });
        }
    };

    return (
        <View className="mt-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800">
            <View className="flex-row items-center gap-2 mb-3">
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">Every</Text>
                <TextInput
                    value={String(config.intervalWeeks)}
                    onChangeText={(text) => {
                        const num = parseInt(text) || 1;
                        onChange({ ...config, intervalWeeks: Math.max(1, Math.min(52, num)) });
                    }}
                    keyboardType="number-pad"
                    className="w-16 text-center p-2 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700"
                />
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">week(s) on:</Text>
            </View>

            <View className="flex-row justify-between">
                {days.map((day, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => toggleDay(day.full)}
                        className={cn(
                            "w-10 h-10 rounded-full items-center justify-center",
                            config.daysOfWeek.includes(day.full)
                                ? "bg-primary"
                                : "bg-zinc-200 dark:bg-zinc-700"
                        )}
                    >
                        <Text className={cn(
                            "text-sm font-medium",
                            config.daysOfWeek.includes(day.full)
                                ? "text-white"
                                : "text-zinc-600 dark:text-zinc-400"
                        )}>
                            {day.short}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

// Monthly Configuration Component
function MonthlyConfig({ config, onChange }: { config: MonthlyRepeatConfig; onChange: (config: MonthlyRepeatConfig) => void }) {
    return (
        <View className="mt-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800">
            <View className="flex-row items-center gap-2">
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">Every</Text>
                <TextInput
                    value={String(config.intervalMonths)}
                    onChangeText={(text) => {
                        const num = parseInt(text) || 1;
                        onChange({ ...config, intervalMonths: Math.max(1, Math.min(12, num)) });
                    }}
                    keyboardType="number-pad"
                    className="w-16 text-center p-2 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700"
                />
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">month(s) on day</Text>
                <TextInput
                    value={String(config.dayOfMonth)}
                    onChangeText={(text) => {
                        const num = parseInt(text) || 1;
                        onChange({ ...config, dayOfMonth: Math.max(1, Math.min(31, num)) });
                    }}
                    keyboardType="number-pad"
                    className="w-16 text-center p-2 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700"
                />
            </View>
        </View>
    );
}
