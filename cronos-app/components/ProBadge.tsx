/**
 * ProBadge - Visual indicator for Pro users
 */

import { Sparkles } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useProStore } from '../core/store/useProStore';

export function ProBadge() {
    const { isPro } = useProStore();

    if (!isPro) {
        return (
            <View style={styles.freeBadge}>
                <Text style={styles.freeText}>
                    Free
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.proBadge}>
            <Sparkles size={12} color="#FFFFFF" />
            <Text style={styles.proText}>
                Pro
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    freeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: '#F4F4F5',
        borderRadius: 999,
    },
    freeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#52525B',
    },
    proBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: '#820AD1',
        borderRadius: 999,
    },
    proText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginLeft: 4,
    },
});
