import { Platform, ViewStyle } from 'react-native';

interface ShadowProps {
    color?: string;
    offset?: { width: number; height: number };
    opacity?: number;
    radius?: number;
    elevation?: number;
}

export const getShadowStyle = ({
    color = '#000',
    offset = { width: 0, height: 2 },
    opacity = 0.1,
    radius = 4,
    elevation = 4,
}: ShadowProps = {}): ViewStyle => {
    if (Platform.OS === 'ios') {
        return {
            shadowColor: color,
            shadowOffset: offset,
            shadowOpacity: opacity,
            shadowRadius: radius,
        };
    } else {
        return {
            elevation,
        };
    }
};
