import { useOAuth } from '@clerk/clerk-expo';
import { FontAwesome5 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../providers/AuthProvider';

// Warm up Android browser for OAuth
WebBrowser.maybeCompleteAuthSession();

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'register' | 'verify'>('register');
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const codeInputRefs = React.useRef<(TextInput | null)[]>([]);
    const { signUp, verifyEmail } = useAuth();
    const router = useRouter();

    // Google OAuth
    const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
    // Apple OAuth
    const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: 'oauth_apple' });

    async function handleSignUp() {
        if (!email.trim() || !password.trim() || !displayName.trim()) {
            Alert.alert('エラー', 'すべての項目を入力してください');
            return;
        }

        if (displayName.trim().length > 12) {
            Alert.alert('エラー', '表示名は12文字以内で入力してください');
            return;
        }

        if (password.length < 8) {
            Alert.alert('エラー', 'パスワードは8文字以上で入力してください');
            return;
        }

        if (Platform.OS !== 'web') {
            await Haptics.selectionAsync();
        }
        setLoading(true);
        try {
            await signUp(email.trim(), password, displayName.trim());

            if (Platform.OS !== 'web') {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

            // If signUp completes without error, user is already verified
            // Navigation is handled by _layout.tsx when isSignedIn changes
        } catch (error: any) {
            if (error.message === '__NEEDS_VERIFICATION__') {
                // Switch to verification step
                setStep('verify');
                if (Platform.OS !== 'web') {
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
            } else {
                if (Platform.OS !== 'web') {
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                }
                const message = error.message || '登録に失敗しました';
                if (Platform.OS === 'web') {
                    alert(message);
                } else {
                    Alert.alert('登録エラー', message);
                }
            }
        } finally {
            setLoading(false);
        }
    }

    // Handle verification code input
    function handleCodeChange(text: string, index: number) {
        const newCode = [...verificationCode];
        newCode[index] = text;
        setVerificationCode(newCode);

        // Auto-advance to next input
        if (text && index < 5) {
            codeInputRefs.current[index + 1]?.focus();
        }
    }

    function handleCodeKeyPress(key: string, index: number) {
        // Move back on backspace when field is empty
        if (key === 'Backspace' && !verificationCode[index] && index > 0) {
            codeInputRefs.current[index - 1]?.focus();
        }
    }

    async function handleVerify() {
        const code = verificationCode.join('');
        if (code.length !== 6) {
            if (Platform.OS === 'web') {
                alert('6桁の認証コードを入力してください');
            } else {
                Alert.alert('エラー', '6桁の認証コードを入力してください');
            }
            return;
        }

        Keyboard.dismiss();
        if (Platform.OS !== 'web') {
            await Haptics.selectionAsync();
        }
        setLoading(true);
        try {
            await verifyEmail(code);
            if (Platform.OS !== 'web') {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            // Navigation is handled by _layout.tsx when isSignedIn changes
        } catch (error: any) {
            if (Platform.OS !== 'web') {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
            const message = error.message || '認証に失敗しました';
            if (Platform.OS === 'web') {
                alert(message);
            } else {
                Alert.alert('認証エラー', message);
            }
            // Clear code on error
            setVerificationCode(['', '', '', '', '', '']);
            codeInputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleSignUp() {
        if (Platform.OS !== 'web') {
            await Haptics.selectionAsync();
        }
        setLoading(true);
        try {
            const { createdSessionId, setActive } = await startGoogleOAuth();

            if (createdSessionId && setActive) {
                await setActive({ session: createdSessionId });
                // Navigation is handled by _layout.tsx
            }
        } catch (error: any) {
            console.error('Google OAuth error:', error);
            Alert.alert('エラー', 'Google 登録に失敗しました');
        } finally {
            setLoading(false);
        }
    }

    async function handleAppleSignUp() {
        if (Platform.OS !== 'web') {
            await Haptics.selectionAsync();
        }
        setLoading(true);
        try {
            const { createdSessionId, setActive } = await startAppleOAuth();

            if (createdSessionId && setActive) {
                await setActive({ session: createdSessionId });
                // Navigation is handled by _layout.tsx
            }
        } catch (error: any) {
            console.error('Apple OAuth error:', error);
            Alert.alert('エラー', 'Apple 登録に失敗しました');
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <View style={styles.container}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?q=80&w=3786&auto=format&fit=crop' }}
                        style={StyleSheet.absoluteFillObject}
                        contentFit="cover"
                    />
                    <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFillObject} />

                    <View style={styles.content}>
                        {/* App Logo */}
                        <View style={styles.logoContainer}>
                            <View style={styles.logoCircle}>
                                <Image
                                    source={require('../assets/images/icon.png')}
                                    style={styles.logoImage}
                                    contentFit="contain"
                                />
                            </View>
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>LoveTicket</Text>

                        {step === 'verify' ? (
                            /* ========== Verification Step ========== */
                            <>
                                <Text style={styles.subtitle}>認証コードを入力</Text>
                                <Text style={styles.verifyDescription}>
                                    {email} に6桁の認証コードを送信しました。{"\n"}メールを確認して入力してください。
                                </Text>

                                {/* 6-digit Code Input */}
                                <View style={styles.codeContainer}>
                                    {verificationCode.map((digit, index) => (
                                        <TextInput
                                            key={index}
                                            ref={ref => { codeInputRefs.current[index] = ref; }}
                                            style={[
                                                styles.codeInput,
                                                digit ? styles.codeInputFilled : null,
                                            ]}
                                            value={digit}
                                            onChangeText={text => handleCodeChange(text.replace(/[^0-9]/g, ''), index)}
                                            onKeyPress={({ nativeEvent }) => handleCodeKeyPress(nativeEvent.key, index)}
                                            keyboardType="number-pad"
                                            maxLength={1}
                                            autoFocus={index === 0}
                                            selectTextOnFocus
                                        />
                                    ))}
                                </View>

                                <TouchableOpacity
                                    onPress={handleVerify}
                                    disabled={loading || verificationCode.join('').length !== 6}
                                    activeOpacity={0.8}
                                    style={styles.buttonWrapper}
                                >
                                    <LinearGradient
                                        colors={verificationCode.join('').length === 6 ? ['#FF4B4B', '#FF9068'] : ['#ccc', '#ddd']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.button}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.buttonText}>認証する</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.resendButton}
                                    onPress={async () => {
                                        try {
                                            await signUp(email.trim(), password, displayName.trim());
                                        } catch (e: any) {
                                            if (e.message === '__NEEDS_VERIFICATION__') {
                                                setVerificationCode(['', '', '', '', '', '']);
                                                codeInputRefs.current[0]?.focus();
                                                if (Platform.OS === 'web') {
                                                    alert('認証コードを再送信しました');
                                                } else {
                                                    Alert.alert('再送信', '認証コードを再送信しました');
                                                }
                                            }
                                        }
                                    }}
                                >
                                    <Text style={[styles.resendText, { color: '#FF4B4B' }]}>コードを再送信</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.resendButton}
                                    onPress={() => {
                                        setStep('register');
                                        setVerificationCode(['', '', '', '', '', '']);
                                    }}
                                >
                                    <Text style={styles.resendText}>← 登録画面に戻る</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            /* ========== Registration Step ========== */
                            <>

                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="表示名 (12文字以内)"
                                        placeholderTextColor="#666"
                                        value={displayName}
                                        onChangeText={setDisplayName}
                                        autoCapitalize="none"
                                        maxLength={12}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="メールアドレス"
                                        placeholderTextColor="#666"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        autoCorrect={false}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="パスワード (8文字以上)"
                                        placeholderTextColor="#666"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        autoCapitalize="none"
                                    />
                                </View>

                                <TouchableOpacity
                                    onPress={handleSignUp}
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
                                            <Text style={styles.buttonText}>アカウント作成</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Divider */}
                                <View style={styles.divider}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>または</Text>
                                    <View style={styles.dividerLine} />
                                </View>

                                {/* Social Signup Buttons */}
                                <TouchableOpacity
                                    style={styles.socialButton}
                                    onPress={handleGoogleSignUp}
                                    disabled={loading}
                                >
                                    <FontAwesome5 name="google" size={18} color="#4285F4" style={styles.socialIcon} />
                                    <Text style={styles.socialButtonText}>Googleで始める</Text>
                                </TouchableOpacity>

                                {Platform.OS === 'ios' && (
                                    <TouchableOpacity
                                        style={[styles.socialButton, styles.appleButton]}
                                        onPress={handleAppleSignUp}
                                        disabled={loading}
                                    >
                                        <FontAwesome5 name="apple" size={20} color="#fff" style={styles.socialIcon} />
                                        <Text style={[styles.socialButtonText, styles.appleButtonText]}>Appleで始める</Text>
                                    </TouchableOpacity>
                                )}

                                <View style={styles.footer}>
                                    <Text style={styles.footerText}>すでにアカウントをお持ちですか？</Text>
                                    <Link href="/login" asChild>
                                        <TouchableOpacity onPress={() => Platform.OS !== 'web' && Haptics.selectionAsync()}>
                                            <Text style={styles.link}>ログイン</Text>
                                        </TouchableOpacity>
                                    </Link>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
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
    logoContainer: {
        alignItems: 'center',
        marginBottom: 8,
    },
    logoCircle: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoImage: {
        width: 120,
        height: 120,
        borderRadius: 24,
    },
    title: {
        fontSize: 42,
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
        color: '#666',
        textAlign: 'center',
        marginBottom: 40,
        fontWeight: '400',
        letterSpacing: 2,
    },
    inputContainer: {
        gap: 16,
        marginBottom: 24,
    },
    input: {
        height: 56,
        borderWidth: 1,
        borderColor: 'rgba(255, 75, 75, 0.2)',
        borderRadius: 16,
        paddingHorizontal: 20,
        fontSize: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        color: '#333',
    },
    buttonWrapper: {
        marginBottom: 20,
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
        fontWeight: '600',
        letterSpacing: 2,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    dividerText: {
        color: '#999',
        paddingHorizontal: 16,
        fontSize: 14,
    },
    socialButton: {
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        flexDirection: 'row',
        marginBottom: 12,
        paddingHorizontal: 20,
    },
    socialButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '500',
    },
    socialIcon: {
        marginRight: 12,
    },
    appleButton: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    appleButtonText: {
        color: '#fff',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 24,
    },
    footerText: {
        color: '#666',
        fontSize: 15,
    },
    link: {
        color: '#FF4B4B',
        fontWeight: '600',
        fontSize: 15,
    },
    // Verification styles
    verifyDescription: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 32,
    },
    codeInput: {
        width: 48,
        height: 56,
        borderWidth: 2,
        borderColor: 'rgba(255, 75, 75, 0.2)',
        borderRadius: 14,
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    codeInputFilled: {
        borderColor: '#FF4B4B',
        backgroundColor: 'rgba(255, 75, 75, 0.05)',
    },
    resendButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    resendText: {
        color: '#666',
        fontSize: 15,
    },
});
