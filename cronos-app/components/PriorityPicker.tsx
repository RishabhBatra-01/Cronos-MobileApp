import { View, Text, TouchableOpacity } from 'react-native';
import { TaskPriority } from '../core/store/useTaskStore';
import { AlertCircle, Circle, ArrowUp } from 'lucide-react-native';
import { cn } from '../lib/utils';

interface PriorityPickerProps {
    value: TaskPriority;
    onChange: (priority: TaskPriority) => void;
}

export function PriorityPicker({ value, onChange }: PriorityPickerProps) {
    const priorities: { value: TaskPriority; label: string; icon: any; color: string }[] = [
        { value: 'high', label: 'High', icon: AlertCircle, color: '#EF4444' },
        { value: 'medium', label: 'Medium', icon: Circle, color: '#F59E0B' },
        { value: 'low', label: 'Low', icon: ArrowUp, color: '#10B981' },
    ];

    return (
        <View className="flex-row gap-2">
            {priorities.map((priority) => {
                const Icon = priority.icon;
                const isSelected = value === priority.value;
                
                return (
                    <TouchableOpacity
                        key={priority.value}
                        onPress={() => onChange(priority.value)}
                        className={cn(
                            "flex-1 flex-row items-center justify-center gap-2 px-3 py-2.5 rounded-full",
                            isSelected 
                                ? "bg-zinc-900 dark:bg-zinc-100" 
                                : "bg-zinc-100 dark:bg-zinc-800"
                        )}
                        activeOpacity={0.7}
                    >
                        <Icon 
                            size={16} 
                            color={isSelected ? (priority.color) : '#71717A'} 
                            pointerEvents="none" 
                        />
                        <Text 
                            className={cn(
                                "text-sm font-medium",
                                isSelected 
                                    ? "text-white dark:text-black" 
                                    : "text-zinc-600 dark:text-zinc-400"
                            )}
                        >
                            {priority.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}
