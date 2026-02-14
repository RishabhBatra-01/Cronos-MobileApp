import { Session } from "@supabase/supabase-js";
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import "../global.css";

import { useNotificationObserver } from "../core/notifications/useNotificationObserver";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useNotificationObserver();

  // Listen for auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[Auth] Initial session:', session ? 'exists' : 'none');
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[Auth] State changed:', _event, session ? 'session exists' : 'no session');
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle routing based on auth state
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!session && !inAuthGroup) {
      // Not logged in, redirect to auth
      console.log('[Auth] No session, redirecting to /auth');
      router.replace('/auth');
    } else if (session && inAuthGroup) {
      // Logged in but on auth screen, redirect to home
      console.log('[Auth] Has session, redirecting to /');
      router.replace('/');
    }
  }, [session, segments, isLoading]);

  // Show loading indicator while checking auth
  if (isLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View className="flex-1 bg-white dark:bg-black items-center justify-center">
            <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#fff' : '#000'} />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View className="flex-1 bg-white dark:bg-black">
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} />
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
