import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import { cn } from '../lib/utils';

interface SubscriptionCardProps {
    pkg: PurchasesPackage;
    isSelected: boolean;
    onSelect: (pkg: PurchasesPackage) => void;
    isBestValue?: boolean;
}

export function SubscriptionCard({ pkg, isSelected, onSelect, isBestValue }: SubscriptionCardProps) {
    const getPackageTitle = (pkg: PurchasesPackage): string => {
        if (pkg.identifier === '$rc_monthly') return 'Monthly';
        if (pkg.identifier === '$rc_annual') return 'Annual';
        return pkg.packageType;
    };

    const getPackageDescription = (pkg: PurchasesPackage): string => {
        if (pkg.identifier === '$rc_annual') {
            return 'Billed yearly';
        }
        return 'Billed monthly';
    };

    return (
        <TouchableOpacity
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(pkg);
            }}
            className={cn(
                'relative mb-4 overflow-hidden rounded-3xl border-2',
                isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-zinc-800 bg-zinc-900/50'
            )}
            activeOpacity={0.8}
        >
            {/* Best Value Badge */}
            {isBestValue && (
                <View className="absolute top-0 right-0 bg-primary px-3 py-1 rounded-bl-xl z-10">
                    <Text className="text-[10px] font-bold text-white uppercase tracking-wider">
                        Best Value
                    </Text>
                </View>
            )}

            <View className="flex-row items-center justify-between p-5">
                <View className="flex-1">
                    <Text className={cn(
                        "text-lg font-bold mb-1",
                        isSelected ? "text-primary dark:text-primary-light" : "text-white"
                    )}>
                        {getPackageTitle(pkg)}
                    </Text>
                    <Text className="text-sm text-zinc-400">
                        {getPackageDescription(pkg)}
                    </Text>
                </View>

                <View className="items-end">
                    <Text className="text-2xl font-bold text-white">
                        {pkg.product.priceString}
                    </Text>
                    <Text className="text-xs text-zinc-500">
                        {pkg.identifier === '$rc_annual' ? '/year' : '/month'}
                    </Text>
                </View>

                {/* Selection Indicator */}
                <View className={cn(
                    "ml-4 w-6 h-6 rounded-full items-center justify-center border-2",
                    isSelected
                        ? "bg-primary border-primary"
                        : "border-zinc-600 bg-transparent"
                )}>
                    {isSelected && <Check size={14} color="#FFFFFF" />}
                </View>
            </View>
        </TouchableOpacity>
    );
}
