import * as Haptics from 'expo-haptics';
import { Cloud, Mic, Sparkles, X, Zap } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PurchasesPackage } from 'react-native-purchases';
import { useProStore } from '../core/store/useProStore';
import { getOfferings, purchasePackage } from '../services/PurchaseService';
// Import new components
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PremiumFeatureRow } from './PremiumFeatureRow';
import { SubscriptionCard } from './SubscriptionCard';
import { SwipeToPay } from './SwipeToPay';

interface PaywallModalProps {
    visible: boolean;
    onClose: () => void;
}

export function PaywallModal({ visible, onClose }: PaywallModalProps) {
    const insets = useSafeAreaInsets();
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const confettiRef = useRef<ConfettiCannon>(null);

    const { checkProStatus, restorePurchases } = useProStore();

    // Load offerings when modal opens
    useEffect(() => {
        if (visible) {
            loadOfferings();
        }
    }, [visible]);

    const loadOfferings = async () => {
        try {
            setIsLoading(true);
            const offering = await getOfferings();

            if (offering && offering.availablePackages.length > 0) {
                setPackages(offering.availablePackages);
                // Pre-select annual package (best value)
                const annualPackage = offering.availablePackages.find(
                    p => p.identifier === '$rc_annual'
                );
                setSelectedPackage(annualPackage || offering.availablePackages[0]);
            } else {
                Alert.alert(
                    'No Subscriptions Available',
                    'Please try again later or contact support.'
                );
            }
        } catch (error) {
            console.error('[PaywallModal] Error loading offerings:', error);
            Alert.alert('Error', 'Failed to load subscription options');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePurchaseSuccess = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Fire confetti
        if (confettiRef.current) {
            confettiRef.current.start();
        }

        Alert.alert(
            '🎉 Welcome to Pro!',
            'You now have access to all premium features.',
            [{ text: 'Get Started', onPress: onClose }]
        );
    };

    const handlePurchase = async () => {
        if (!selectedPackage) return;

        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsPurchasing(true);

            const result = await purchasePackage(selectedPackage);

            if (result.success) {
                // Update Pro status
                await checkProStatus();
                handlePurchaseSuccess();
            } else if (result.error === 'cancelled') {
                // User cancelled - no alert needed
                console.log('[PaywallModal] Purchase cancelled by user');
            } else if (result.error === 'Purchase completed but entitlement not granted') {
                // Test API key workaround - manually grant Pro status for testing
                console.log('[PaywallModal] Test purchase completed, manually granting Pro status');
                const { setProStatus } = useProStore.getState();
                setProStatus(true);
                handlePurchaseSuccess();
            } else {
                Alert.alert('Purchase Failed', result.error || 'Please try again');
            }
        } catch (error: any) {
            console.error('[PaywallModal] Purchase error:', error);
            Alert.alert('Error', error.message || 'Purchase failed');
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleRestore = async () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsRestoring(true);

            const restored = await restorePurchases();

            if (restored) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                if (confettiRef.current) confettiRef.current.start();

                Alert.alert(
                    'Purchases Restored!',
                    'Your Pro subscription has been restored.',
                    [{ text: 'Continue', onPress: onClose }]
                );
            } else {
                Alert.alert(
                    'No Purchases Found',
                    'We couldn\'t find any active subscriptions for this account.'
                );
            }
        } catch (error) {
            console.error('[PaywallModal] Restore error:', error);
            Alert.alert('Error', 'Failed to restore purchases');
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: '#000000' }}>
                    {/* 1. Premium Background (Fallback for missing native module) */}
                    <View
                        style={[
                            StyleSheet.absoluteFill,
                            { backgroundColor: '#2E024D' }
                        ]}
                    />

                    {/* 2. Confetti Cannon */}
                    <ConfettiCannon
                        ref={confettiRef}
                        count={200}
                        origin={{ x: -10, y: 0 }}
                        autoStart={false}
                        fadeOut={true}
                    />

                    {/* Header */}
                    <View style={{ paddingTop: Platform.OS === 'ios' ? 20 : 20, paddingHorizontal: 20, paddingBottom: 10, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <TouchableOpacity
                            onPress={onClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={{ padding: 8, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 20 }}
                        >
                            <X size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
                        {/* Hero Section */}
                        <View className="items-center py-6 px-5">
                            <View className="w-24 h-24 bg-primary/20 rounded-full items-center justify-center mb-6 border-4 border-primary/30 shadow-lg shadow-primary/50">
                                <Sparkles size={48} color="#A855F7" />
                            </View>
                            <Text className="text-3xl font-bold text-white text-center mb-2 tracking-tight">
                                Unlock Cronos <Text className="text-primary">Pro</Text>
                            </Text>
                            <Text className="text-zinc-400 text-center text-lg px-4 leading-6">
                                Supercharge your productivity with AI-powered features.
                            </Text>
                        </View>

                        {/* Features List */}
                        <View className="px-5 mb-8">
                            <PremiumFeatureRow
                                icon={<Mic size={24} color="#A855F7" />}
                                title="AI Voice Input"
                                description="Speak naturally to create complex tasks instantly."
                            />
                            <PremiumFeatureRow
                                icon={<Cloud size={24} color="#A855F7" />}
                                title="Cloud Sync"
                                description="Seamlessly access tasks across all your devices."
                            />
                            <PremiumFeatureRow
                                icon={<Zap size={24} color="#A855F7" />}
                                title="Unlimited Tasks"
                                description="Remove all limits. Create as many tasks as you need."
                            />
                            <PremiumFeatureRow
                                icon={<Sparkles size={24} color="#A855F7" />}
                                title="AI Assistant"
                                description="Get smart suggestions, breakdowns, and research."
                            />
                        </View>

                        {/* Subscription Packages */}
                        {isLoading ? (
                            <View className="items-center py-12">
                                <ActivityIndicator size="large" color="#A855F7" />
                                <Text className="text-zinc-500 mt-4">Loading best offers...</Text>
                            </View>
                        ) : (
                            <View className="px-5 mb-6">
                                <Text className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 text-center">
                                    Choose Your Plan
                                </Text>
                                {packages.map((pkg) => (
                                    <SubscriptionCard
                                        key={pkg.identifier}
                                        pkg={pkg}
                                        isSelected={selectedPackage?.identifier === pkg.identifier}
                                        onSelect={setSelectedPackage}
                                        isBestValue={pkg.identifier === '$rc_annual'}
                                    />
                                ))}
                            </View>
                        )}

                        {/* Fine Print */}
                        <Text className="text-[11px] text-zinc-600 text-center px-8 mb-6 leading-4">
                            Subscriptions auto-renew unless cancelled at least 24-hours before the end of the current period. Manage via App Store settings.
                        </Text>

                        {/* Bottom Actions */}
                        <View className="px-5 gap-4">
                            {/* Swipe to Pay Slider */}
                            <View className="px-5 mb-4 items-center">
                                <SwipeToPay
                                    onComplete={handlePurchase}
                                    isLoading={isPurchasing || isLoading}
                                    disabled={!selectedPackage || isPurchasing || isLoading}
                                    price={selectedPackage?.product.priceString}
                                    width={Dimensions.get('window').width - 40} // Full width with padding
                                />
                            </View>

                            {/* Restore Button */}
                            <TouchableOpacity
                                onPress={handleRestore}
                                disabled={isRestoring || isPurchasing}
                                className="py-2 items-center"
                                activeOpacity={0.6}
                            >
                                {isRestoring ? (
                                    <ActivityIndicator color="#71717A" size="small" />
                                ) : (
                                    <Text className="text-zinc-500 text-sm font-medium">
                                        Restore Purchases
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Test Mode Button (Development Only) */}
                        {__DEV__ && (
                            <TouchableOpacity
                                onPress={() => {
                                    const { setProStatus } = useProStore.getState();
                                    setProStatus(true);
                                    handlePurchaseSuccess();
                                }}
                                className="mt-6 mx-10 py-2 rounded-full items-center justify-center bg-zinc-900 border border-zinc-800"
                                activeOpacity={0.8}
                            >
                                <Text className="text-zinc-500 text-xs font-medium">
                                    🧪 DEV: Enable Pro
                                </Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>
            </GestureHandlerRootView>
        </Modal>
    );
}
