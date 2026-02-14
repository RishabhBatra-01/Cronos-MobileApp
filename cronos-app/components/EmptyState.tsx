import { ClipboardList } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

export function EmptyState() {
    return (
        <Animated.View
            entering={FadeInUp.delay(200)}
            className="items-center justify-center mt-20 px-6"
        >
            <View className="w-20 h-20 bg-secondary/30 dark:bg-secondary/10 rounded-full items-center justify-center mb-6 shadow-sm">
                <ClipboardList size={40} className="text-primary dark:text-primary-dark" strokeWidth={1.5} />
            </View>

            <Text className="text-lg font-semibold text-zinc-900 dark:text-white mb-2 text-center">
                All caught up!
            </Text>

            <Text className="text-zinc-500 dark:text-zinc-400 text-center leading-6 max-w-[250px]">
                You have no tasks on your list. Tap the + button to add a new task.
            </Text>
        </Animated.View>
    );
}
