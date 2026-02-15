import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function signUpWithEmail() {
        if (Platform.OS !== 'web') {
            await Haptics.selectionAsync();
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: displayName,
                        avatar_url: 'https://ui-avatars.com/api/?name=' + displayName,
                    }
                }
            });

            if (error) {
                if (Platform.OS !== 'web') {
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                }
                if (Platform.OS === 'web') {
                    alert(error.message);
                } else {
                    Alert.alert('Registration Failed', error.message);
                }
            } else {
                if (Platform.OS !== 'web') {
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                if (Platform.OS === 'web') {
                    alert('Success: Please check your inbox for email verification!');
                } else {
                    Alert.alert('Success', 'Please check your inbox for email verification!');
                }
            }
        } catch (e: any) {
            console.error(e);
            if (Platform.OS === 'web') {
                alert('An unexpected error occurred: ' + e.message);
            } else {
                Alert.alert('Error', e.message);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <Image
                source={{ uri: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?q=80&w=3786&auto=format&fit=crop' }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
            />
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFillObject} />

            <View style={styles.content}>
                <Text style={styles.title}>アカウント作成</Text>
                <Text style={styles.subtitle}>Love Ticket を始めましょう</Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="表示名"
                        placeholderTextColor="#666"
                        value={displayName}
                        onChangeText={setDisplayName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="メールアドレス"
                        placeholderTextColor="#666"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="パスワード"
                        placeholderTextColor="#666"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    onPress={signUpWithEmail}
                    disabled={loading}
                    activeOpacity={0.8}
                    style={styles.buttonWrapper}
                >
                    <LinearGradient
                        colors={['#FF4B4B', '#FF9068']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.button}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>登録する</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>すでにアカウントをお持ちですか？</Text>
                    <Link href="/login" asChild>
                        <TouchableOpacity onPress={() => Platform.OS !== 'web' && Haptics.selectionAsync()}>
                            <Text style={styles.link}>ログイン</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    content: {
        padding: 24,
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FF4B4B',
        textAlign: 'center',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    subtitle: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginBottom: 48,
        fontWeight: '500',
    },
    inputContainer: {
        gap: 16,
        marginBottom: 32,
    },
    input: {
        height: 56,
        borderWidth: 1,
        borderColor: 'rgba(255, 75, 75, 0.2)',
        borderRadius: 16,
        paddingHorizontal: 20,
        fontSize: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        color: '#333',
    },
    buttonWrapper: {
        marginBottom: 24,
        shadowColor: '#FF4B4B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    button: {
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    footerText: {
        color: '#555',
        fontSize: 16,
    },
    link: {
        color: '#FF4B4B',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
