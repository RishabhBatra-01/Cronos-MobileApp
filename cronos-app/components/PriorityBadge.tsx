import { View, Text } from 'react-native';
import { TaskPriority } from '../core/store/useTaskStore';
import { AlertCircle, Circle, ArrowUp } from 'lucide-react-native';

interface PriorityBadgeProps {
    priority: TaskPriority;
    size?: 'sm' | 'md';
}

export function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
    const iconSize = size === 'sm' ? 12 : 16;
    
    const config = {
        high: {
            icon: AlertCircle,
            color: '#EF4444',
            bgColor: '#FEE2E2',
            darkBgColor: '#7F1D1D',
            label: 'High',
        },
        medium: {
            icon: Circle,
            color: '#F59E0B',
            bgColor: '#FEF3C7',
            darkBgColor: '#78350F',
            label: 'Medium',
        },
        low: {
            icon: ArrowUp,
            color: '#10B981',
            bgColor: '#D1FAE5',
            darkBgColor: '#064E3B',
            label: 'Low',
        },
    };

    const { icon: Icon, color, bgColor, darkBgColor, label } = config[priority];

    return (
        <View 
            className="flex-row items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ backgroundColor: bgColor }}
        >
            <Icon size={iconSize} color={color} pointerEvents="none" />
            <Text 
                className="text-xs font-medium"
                style={{ color }}
            >
                {label}
            </Text>
        </View>
    );
}
