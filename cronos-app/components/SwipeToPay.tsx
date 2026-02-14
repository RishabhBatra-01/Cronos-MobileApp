import * as Haptics from 'expo-haptics';
import { ChevronRight } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { cn } from '../lib/utils';

interface SwipeToPayProps {
    onComplete: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    price?: string;
    width?: number;
}

const BUTTON_HEIGHT = 56;
const BUTTON_PADDING = 4;

export function SwipeToPay({
    onComplete,
    isLoading = false,
    disabled = false,
    price,
    width = Dimensions.get('window').width - 40
}: SwipeToPayProps) {
    const SWIPEABLE_WIDTH = width - BUTTON_HEIGHT;
    const translateX = useSharedValue(0);
    const [isCompleted, setIsCompleted] = useState(false);

    useEffect(() => {
        if (!isLoading && !isCompleted) {
            translateX.value = withSpring(0);
        }
    }, [isLoading, isCompleted]);

    const handleComplete = () => {
        setIsCompleted(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onComplete();
    };

    const panGesture = Gesture.Pan()
        .enabled(!isLoading && !disabled && !isCompleted)
        .onStart(() => {
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        })
        .onUpdate((event) => {
            translateX.value = Math.max(0, Math.min(SWIPEABLE_WIDTH, event.translationX));
        })
        .onEnd(() => {
            if (translateX.value > SWIPEABLE_WIDTH * 0.85) {
                translateX.value = withSpring(SWIPEABLE_WIDTH);
                runOnJS(handleComplete)();
            } else {
                translateX.value = withSpring(0);
            }
        });

    const animatedThumbStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const animatedTextStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            translateX.value,
            [0, SWIPEABLE_WIDTH / 2],
            [1, 0],
            Extrapolation.CLAMP
        );
        return { opacity };
    });

    return (
        <View
            className={cn(
                "relative rounded-full justify-center overflow-hidden border border-white/10 shadow-lg",
                disabled ? "opacity-50" : "opacity-100"
            )}
            style={{
                width: width,
                height: BUTTON_HEIGHT,
                backgroundColor: '#18181B',
            }}
        >
            {/* Background Text */}
            <Animated.View
                className="absolute inset-0 items-center justify-center pointer-events-none"
                style={animatedTextStyle}
            >
                <View className="flex-row items-center space-x-2">
                    <Text className="text-zinc-400 font-medium text-sm tracking-widest uppercase mr-2">
                        {isLoading ? 'PROCESSING...' : (price ? `SWIPE TO PAY ${price}` : 'SWIPE TO SUBSCRIBE')}
                    </Text>
                    {!isLoading && <ChevronRight size={14} color="#71717A" className="opacity-50" />}
                </View>
            </Animated.View>

            {/* Draggable Thumb */}
            <GestureDetector gesture={panGesture}>
                <Animated.View
                    style={[
                        {
                            width: BUTTON_HEIGHT - (BUTTON_PADDING * 2),
                            height: BUTTON_HEIGHT - (BUTTON_PADDING * 2),
                            position: 'absolute',
                            left: BUTTON_PADDING,
                            zIndex: 10,
                        },
                        animatedThumbStyle
                    ]}
                >
                    <View className={cn(
                        "flex-1 rounded-full items-center justify-center shadow-md",
                        isLoading ? "bg-zinc-700" : "bg-primary"
                    )}>
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <ChevronRight size={24} color="#FFFFFF" strokeWidth={3} />
                        )}
                    </View>
                </Animated.View>
            </GestureDetector>
        </View>
    );
}
