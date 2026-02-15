import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Copy, Heart } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';

export default function Pairing() {
    const [mode, setMode] = useState<'create' | 'join'>('create');
    const [inviteCode, setInviteCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');
    const [loading, setLoading] = useState(false);
    const { session, refreshProfile } = useAuth();
    const router = useRouter();

    const generateCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    async function createCouple() {
        setLoading(true);
        const code = generateCode();

        // Create couple
        const { data: couple, error: coupleError } = await supabase
            .from('couples')
            .insert({ invite_code: code, status: 'pending' })
            .select()
            .single();

        if (coupleError) {
            Alert.alert('Error creating couple', coupleError.message);
            setLoading(false);
            return;
        }

        if (couple && session?.user) {
            // Update profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ couple_id: couple.id })
                .eq('id', session.user.id);

            if (profileError) {
                Alert.alert('Error updating profile', profileError.message);
            } else {
                setGeneratedCode(code);
                await refreshProfile();
                // Don't redirect yet, let them copy the code
            }
        }
        setLoading(false);
    }

    async function joinCouple() {
        if (!inviteCode) return;
        setLoading(true);

        // Find couple
        const { data: couple, error: coupleError } = await supabase
            .from('couples')
            .select('*')
            .eq('invite_code', inviteCode.toUpperCase())
            .single();

        if (coupleError || !couple) {
            Alert.alert('Error', 'Invalid invite code');
            setLoading(false);
            return;
        }

        if (session?.user) {
            // Update profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ couple_id: couple.id })
                .eq('id', session.user.id);

            if (profileError) {
                Alert.alert('Error joining', profileError.message);
            } else {
                // Update couple status to active (optional logic, maybe trigger?)
                await supabase
                    .from('couples')
                    .update({ status: 'active' })
                    .eq('id', couple.id);

                await refreshProfile();
                router.replace('/(tabs)');
            }
        }
        setLoading(false);
    }

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(generatedCode);
        Alert.alert('Copied!', 'Invite code copied to clipboard');
    };

    const shareCode = async () => {
        if (generatedCode) {
            await Share.share({
                message: `Join me on Love Ticket! Here is our invite code: ${generatedCode}`
            })
        }
    }

    if (generatedCode) {
        return (
            <View style={styles.container}>
                <Heart size={64} color="#FF4B4B" style={{ marginBottom: 24 }} />
                <Text style={styles.title}>カップルを作成しました！ 🎉</Text>
                <Text style={styles.subtitle}>パートナーにQRコードや招待コードを送ってください：</Text>

                <TouchableOpacity style={styles.codeContainer} onPress={copyToClipboard}>
                    <Text style={styles.codeText}>{generatedCode}</Text>
                    <Copy size={20} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={shareCode}>
                    <Text style={styles.buttonText}>コードを共有する</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={() => router.replace('/(tabs)')}
                >
                    <Text style={[styles.buttonText, styles.secondaryButtonText]}>アプリを始める</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>ペアリング</Text>
            <Text style={styles.subtitle}>パートナーと連携しましょう</Text>

            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[styles.toggleButton, mode === 'create' && styles.activeToggle]}
                    onPress={() => setMode('create')}
                >
                    <Text style={[styles.toggleText, mode === 'create' && styles.activeToggleText]}>新しく始める</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleButton, mode === 'join' && styles.activeToggle]}
                    onPress={() => setMode('join')}
                >
                    <Text style={[styles.toggleText, mode === 'join' && styles.activeToggleText]}>招待コードを入力</Text>
                </TouchableOpacity>
            </View>

            {mode === 'create' ? (
                <View style={styles.content}>
                    <Text style={styles.description}>
                        新しくカップル専用のスペースを作成し、パートナーに共有するための招待コードを発行します。
                    </Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={createCouple}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>招待コードを発行する</Text>}
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.content}>
                    <Text style={styles.description}>
                        パートナーから受け取った招待コードを入力してください。
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="招待コードを入力 (例: A1B2C3)"
                        placeholderTextColor="#aaa"
                        value={inviteCode}
                        onChangeText={setInviteCode}
                        autoCapitalize="characters"
                        maxLength={6}
                    />
                    <TouchableOpacity
                        style={styles.button}
                        onPress={joinCouple}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>カップルに参加する</Text>}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 32,
    },
    toggleContainer: {
        flexDirection: 'row',
        marginBottom: 32,
        backgroundColor: '#f0f0f0',
        borderRadius: 25,
        padding: 4,
        width: '100%',
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 22,
    },
    activeToggle: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    toggleText: {
        fontWeight: '600',
        color: '#999',
    },
    activeToggleText: {
        color: '#FF4B4B',
    },
    content: {
        width: '100%',
        alignItems: 'center',
    },
    description: {
        textAlign: 'center',
        color: '#666',
        marginBottom: 24,
        lineHeight: 22,
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 24,
        letterSpacing: 2,
        backgroundColor: '#f9f9f9',
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: '#FF4B4B',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 2,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 0,
    },
    secondaryButtonText: {
        color: '#666',
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 12,
        marginBottom: 32,
        gap: 12,
    },
    codeText: {
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 4,
        color: '#333',
    },
});
