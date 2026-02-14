import { LinearGradient } from 'expo-linear-gradient';
import { Mic, MicOff } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

interface PremiumMicButtonProps {
    isRecording: boolean;
    isLoading: boolean;
    onPress: () => void;
}

export function PremiumMicButton({ isRecording, isLoading, onPress }: PremiumMicButtonProps) {
    // Animation Values
    const scale = useSharedValue(1);
    const rippleScale = useSharedValue(1);
    const rippleOpacity = useSharedValue(0);
    const breathingScale = useSharedValue(1);

    // Breathing Animation (Idle State)
    useEffect(() => {
        if (!isRecording && !isLoading) {
            breathingScale.value = withRepeat(
                withSequence(
                    withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );
        } else {
            breathingScale.value = withTiming(1);
        }
    }, [isRecording, isLoading]);

    // Ripple Animation (Recording State)
    useEffect(() => {
        if (isRecording) {
            rippleScale.value = withRepeat(
                withTiming(2, { duration: 1500, easing: Easing.out(Easing.ease) }),
                -1,
                false
            );
            rippleOpacity.value = withRepeat(
                withSequence(
                    withTiming(0.4, { duration: 0 }),
                    withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) })
                ),
                -1,
                false
            );
        } else {
            rippleScale.value = withTiming(1);
            rippleOpacity.value = withTiming(0);
        }
    }, [isRecording]);

    // Styles
    const containerAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: isRecording ? 1 : breathingScale.value }
        ]
    }));

    const rippleAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: rippleScale.value }],
        opacity: rippleOpacity.value,
    }));

    const contentAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.9);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
        onPress();
    };

    return (
        <View style={styles.wrapper}>
            {/* Ripple Effect Layer */}
            <Animated.View style={[styles.ripple, rippleAnimatedStyle]}>
                <LinearGradient
                    colors={['#820AD1', '#d946ef']} // Purple to Pink
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>

            {/* Main Button Container */}
            <Animated.View style={[styles.container, containerAnimatedStyle]}>
                {/* Glass Ring / Glow */}
                <View style={styles.glassRing} />

                {/* Touch Area */}
                <Animated.View
                    style={[styles.touchable, contentAnimatedStyle]}
                    onTouchStart={handlePressIn}
                    onTouchEnd={handlePressOut}
                >
                    <LinearGradient
                        colors={
                            isRecording
                                ? ['#ef4444', '#dc2626'] // Red Gradient for Recording
                                : ['#820AD1', '#c026d3'] // Purple/Pink Gradient for Idle
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradient}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : isRecording ? (
                            <MicOff color="white" size={28} strokeWidth={2.5} />
                        ) : (
                            <Mic color="white" size={28} strokeWidth={2.5} />
                        )}
                    </LinearGradient>
                </Animated.View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 80,
        height: 80,
    },
    container: {
        width: 64,
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#820AD1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    ripple: {
        position: 'absolute',
        width: 64,
        height: 64,
        borderRadius: 32,
        overflow: 'hidden',
    },
    glassRing: {
        position: 'absolute',
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    touchable: {
        width: 64,
        height: 64,
        borderRadius: 32,
        overflow: 'hidden',
    },
    gradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
