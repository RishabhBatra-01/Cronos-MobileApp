import { isPast, isToday, parseISO } from 'date-fns';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Cloud, CloudOff, LogOut, Plus, RefreshCw } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, Platform, RefreshControl, SectionList, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddTaskModal } from '../components/AddTaskModal';
import { EditTaskModal } from '../components/EditTaskModal';
import { EmptyState } from '../components/EmptyState';
import { PaywallModal } from '../components/PaywallModal';
import { ProBadge } from '../components/ProBadge';
import { TaskItem } from '../components/ui/TaskItem';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { Layout } from '../constants/Layout';
import { registerForPushNotificationsAsync } from '../core/notifications/NotificationManager';
import { useProStore } from '../core/store/useProStore';
import { Task, useTaskStore } from '../core/store/useTaskStore';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { initializePurchases } from '../services/PurchaseService';
import { hasUnsyncedTasks, subscribeToTasks, syncAll } from '../services/SyncService';

export default function HomeScreen() {
    const { tasks, isSyncing } = useTaskStore();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [isPaywallVisible, setIsPaywallVisible] = useState(false);
    const { isPro, checkProStatus } = useProStore();
    const insets = useSafeAreaInsets();
    const { colorScheme } = useColorScheme();
    const appState = useRef(AppState.currentState);

    // Get current user
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUserId(session.user.id);
            }
        });
    }, []);

    // Register for push notifications on app launch
    useEffect(() => {
        console.log('[HomeScreen] Registering for push notifications...');
        registerForPushNotificationsAsync();
    }, []);

    // Initialize RevenueCat on app launch
    useEffect(() => {
        const initRevenueCat = async () => {
            try {
                console.log('[HomeScreen] Initializing RevenueCat...');
                await initializePurchases(userId || undefined);
                await checkProStatus();
            } catch (error) {
                console.error('[HomeScreen] RevenueCat init error:', error);
            }
        };

        if (userId) {
            initRevenueCat();
        }
    }, [userId]);

    // Sync on app resume
    useEffect(() => {
        const subscription = AppState.addEventListener('change', async (nextAppState) => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                // App came to foreground - sync
                if (userId) {
                    console.log('[HomeScreen] App resumed, syncing...');
                    await syncAll(userId);
                }
            }
            appState.current = nextAppState;
        });

        return () => subscription.remove();
    }, [userId]);

    // Initial sync and Realtime subscription
    useEffect(() => {
        if (!userId) return;

        // Initial sync
        syncAll(userId);

        // Subscribe to realtime changes
        const unsubscribe = subscribeToTasks(userId, async () => {
            console.log('[HomeScreen] Realtime update triggered sync');
            // Only sync if not already syncing
            const { isSyncing } = useTaskStore.getState();
            if (!isSyncing) {
                await syncAll(userId);
            } else {
                console.log('[HomeScreen] Sync already in progress, skipping realtime sync');
            }
        });

        return () => {
            unsubscribe();
        };
    }, [userId]);

    const handleRefresh = useCallback(async () => {
        console.log('[HomeScreen] handleRefresh called, userId:', userId, 'isSyncing:', isSyncing);

        if (!userId) {
            console.log('[HomeScreen] No userId, skipping refresh');
            return;
        }

        // If sync appears stuck, force reset it
        const store = useTaskStore.getState();
        if (store.isSyncing) {
            console.warn('[HomeScreen] Sync appears stuck, forcing reset');
            store.setIsSyncing(false);
        }

        // Haptics feedback (works on both iOS and Android)
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            // Haptics might not be available on all devices
            console.log('[HomeScreen] Haptics not available:', error);
        }

        setRefreshing(true);
        try {
            console.log('[HomeScreen] Starting syncAll...');

            // Safety timeout to prevent infinite spinner
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Sync timeout')), 10000)
            );

            await Promise.race([
                syncAll(userId),
                timeoutPromise
            ]);

            console.log('[HomeScreen] syncAll completed');
        } catch (error) {
            console.error('[HomeScreen] Sync error:', error);
        } finally {
            setRefreshing(false);
            console.log('[HomeScreen] Refresh complete');
        }
    }, [userId, isSyncing]);

    const handleSignOut = async () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                    await supabase.auth.signOut();
                    router.replace('/auth');
                },
            },
        ]);
    };

    const hasUnsynced = hasUnsyncedTasks();

    const sections = useMemo(() => {
        const overdue: Task[] = [];
        const today: Task[] = [];
        const upcoming: Task[] = [];
        const noDate: Task[] = [];
        const completed: Task[] = [];

        tasks.forEach((task) => {
            // Include completed tasks (don't return early)

            if (!task.dueDate) {
                noDate.push(task);
                return;
            }

            const date = parseISO(task.dueDate);
            if (isToday(date)) {
                today.push(task);
            } else if (isPast(date)) {
                // Split past tasks: Pending -> Overdue, Completed -> Completed Section
                if (task.status === 'completed') {
                    completed.push(task);
                } else {
                    overdue.push(task);
                }
            } else {
                upcoming.push(task);
            }
        });

        // Sort each section by priority (high -> medium -> low)
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const sortByPriority = (a: Task, b: Task) => {
            if (a.status !== b.status) {
                return a.status === 'completed' ? 1 : -1;
            }
            const aPriority = a.priority || 'medium';
            const bPriority = b.priority || 'medium';
            return priorityOrder[aPriority] - priorityOrder[bPriority];
        };

        overdue.sort(sortByPriority);
        today.sort(sortByPriority);
        upcoming.sort(sortByPriority);
        noDate.sort(sortByPriority);
        completed.sort(sortByPriority);

        const result = [];
        if (overdue.length > 0) result.push({ title: 'Overdue', data: overdue });
        if (today.length > 0) result.push({ title: 'Today', data: today });
        if (upcoming.length > 0) result.push({ title: 'Upcoming', data: upcoming });
        if (noDate.length > 0) result.push({ title: 'No Date', data: noDate });
        if (completed.length > 0) result.push({ title: 'Completed', data: completed });

        return result;
    }, [tasks]);

    // Sync status icon
    const SyncIcon = () => {
        if (isSyncing) {
            return <RefreshCw size={20} color="#820AD1" />;
        }
        if (hasUnsynced) {
            return <CloudOff size={20} color="#F59E0B" />;
        }
        return <Cloud size={20} color="#22C55E" />;
    };

    return (
        <View className="flex-1 bg-white dark:bg-black">
            {/* Header */}
            <View
                className="flex-row items-center justify-between px-5 pb-3 border-b border-primary/20 pt-3"
                style={{ marginTop: insets.top }}
            >
                <View className="flex-row items-center gap-3">
                    <Text className="text-2xl font-bold text-zinc-900 dark:text-white">Cronos</Text>
                    <ProBadge />
                </View>

                <View className="flex-row items-center gap-4">
                    {/* Sync Status */}
                    <TouchableOpacity
                        onPress={handleRefresh}
                        activeOpacity={0.6}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        className="p-2"
                    >
                        <SyncIcon />
                    </TouchableOpacity>

                    {/* Sign Out */}
                    <TouchableOpacity
                        onPress={handleSignOut}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        className="p-2"
                    >
                        <LogOut size={20} color="#71717A" />
                    </TouchableOpacity>
                </View>
            </View>

            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TaskItem
                        task={item}
                        onEdit={(task) => setEditingTask(task)}
                    />
                )}
                renderSectionHeader={({ section: { title, data } }) => (
                    <BlurView
                        intensity={80}
                        tint={colorScheme === 'dark' ? 'dark' : 'light'} // Just usage of hook to force re-render if needed, or just standard
                        className="mt-4 mb-2 mx-[-20px] px-[20px] py-2"
                        style={{ backgroundColor: Platform.OS === 'android' ? (colorScheme === 'dark' ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)') : undefined }}
                    >
                        <Text className={cn(
                            "text-xs font-bold uppercase tracking-widest",
                            title === 'Overdue' ? "text-red-500" : "text-zinc-500 dark:text-zinc-400"
                        )}>
                            {title} <Text className="text-zinc-400 font-normal">({data.length})</Text>
                        </Text>
                    </BlurView>
                )}
                contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingTop: 10,
                    paddingBottom: Layout.FAB_SPACE, // Increased to account for FABs + Safe Area
                }}
                stickySectionHeadersEnabled={true}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#71717A"
                    />
                }
                ListEmptyComponent={<EmptyState />}
            />

            {/* Floating Action Buttons Container */}
            <View
                className="absolute inset-x-0 bottom-10"
                style={{
                    paddingBottom: insets.bottom,
                    zIndex: 999,
                    elevation: 10, // Ensure it sits above tab bar/list
                }}
                pointerEvents="box-none" // Let touches pass through the empty space
            >
                {/* Central Microphone Button */}
                <View
                    className="absolute inset-x-0 items-center justify-center bottom-4"
                    pointerEvents="box-none"
                >
                    <VoiceInputButton />
                </View>

                {/* Right-aligned Add Task Button */}
                <View
                    className="absolute right-6 items-center justify-center"
                    pointerEvents="box-none"
                >
                    <TouchableOpacity
                        onPress={() => setIsModalVisible(true)}
                        className="w-16 h-16 bg-black dark:bg-white rounded-full items-center justify-center shadow-lg active:scale-95 transition-transform"
                        activeOpacity={0.8}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={{
                            elevation: 10,
                            zIndex: 999,
                        }}
                    >
                        <Plus size={32} color="#FFFFFF" className="text-white dark:text-black" pointerEvents="none" />
                    </TouchableOpacity>
                </View>
            </View>

            <AddTaskModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
            />

            <EditTaskModal
                visible={editingTask !== null}
                task={editingTask}
                onClose={() => setEditingTask(null)}
            />

            <PaywallModal
                visible={isPaywallVisible}
                onClose={() => setIsPaywallVisible(false)}
            />
        </View>
    );
}
