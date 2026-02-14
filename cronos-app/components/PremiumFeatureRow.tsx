import React from 'react';
import { Text, View } from 'react-native';

interface PremiumFeatureRowProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

export function PremiumFeatureRow({ icon, title, description }: PremiumFeatureRowProps) {
    return (
        <View className="flex-row items-center mb-4 bg-zinc-900/80 p-4 rounded-2xl border border-white/5">
            <View className="w-12 h-12 bg-zinc-800 rounded-full items-center justify-center mr-4">
                {icon}
            </View>
            <View className="flex-1">
                <Text className="text-base font-bold text-white mb-1">
                    {title}
                </Text>
                <Text className="text-sm text-zinc-400">
                    {description}
                </Text>
            </View>
        </View>
    );
}
