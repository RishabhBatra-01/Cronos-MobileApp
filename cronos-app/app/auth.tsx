import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const insets = useSafeAreaInsets();

    const handleAuth = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password: password.trim(),
                });
                if (error) throw error;
                console.log('[Auth] Signed in successfully');
            } else {
                const { error } = await supabase.auth.signUp({
                    email: email.trim(),
                    password: password.trim(),
                });
                if (error) throw error;
                Alert.alert('Success', 'Check your email to confirm your account!');
                console.log('[Auth] Signed up successfully');
            }
            router.replace('/');
        } catch (error: any) {
            console.error('[Auth] Error:', error);
            Alert.alert('Error', error.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white dark:bg-black"
        >
            <View
                className="flex-1 px-6 justify-center"
                style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
            >
                {/* Header */}
                <View className="mb-10">
                    <Text className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">
                        Cronos
                    </Text>
                    <Text className="text-lg text-zinc-500 dark:text-zinc-400">
                        {isLogin ? 'Welcome back' : 'Create your account'}
                    </Text>
                </View>

                {/* Form */}
                <View className="gap-4 mb-6">
                    <View>
                        <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Email
                        </Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="you@example.com"
                            placeholderTextColor="#a1a1aa"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-3 rounded-xl text-base"
                        />
                    </View>

                    <View>
                        <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Password
                        </Text>
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            placeholderTextColor="#a1a1aa"
                            secureTextEntry
                            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-3 rounded-xl text-base"
                        />
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    onPress={handleAuth}
                    disabled={loading}
                    className="bg-primary py-4 rounded-xl items-center mb-4"
                >
                    {loading ? (
                        <ActivityIndicator color={Platform.OS === 'ios' ? '#fff' : '#000'} />
                    ) : (
                        <Text className="text-white font-bold text-base">
                            {isLogin ? 'Sign In' : 'Create Account'}
                        </Text>
                    )}
                </TouchableOpacity>

                {/* Toggle */}
                <TouchableOpacity
                    onPress={() => setIsLogin(!isLogin)}
                    className="py-2"
                >
                    <Text className="text-center text-zinc-500 dark:text-zinc-400">
                        {isLogin ? "Don't have an account? " : 'Already have an account? '}
                        <Text className="text-primary font-medium">
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
