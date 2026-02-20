import { api } from '@/convex/_generated/api';
import { useAuth } from '@/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileSetup() {
    const { profile, userId, signOut } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const updateProfile = useMutation(api.users.updateProfile);

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.4,
                base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
                // Create a data URI for the image
                const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
                setAvatarUri(base64Uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('エラー', '画像の選択に失敗しました');
        }
    };

    const handleSave = async () => {
        if (!avatarUri) {
            Alert.alert('確認', 'プロフィール画像を設定してください');
            return;
        }

        setLoading(true);
        try {
            const clerkId = userId || profile?.id;

            if (!clerkId) {
                throw new Error('User ID not found');
            }

            if (avatarUri) {
                console.log('Saving avatar with length:', avatarUri.length);
            }

            await updateProfile({
                clerkId,
                avatarUrl: avatarUri,
            });

            // Navigation will be handled by the listener in _layout.tsx
            // but we can also force it for immediate feedback
            router.replace('/pairing');
        } catch (error: any) {
            console.error('Failed to save profile:', error);
            const errorMessage = error.message || '不明なエラーが発生しました';
            Alert.alert('エラー', `プロフィールの保存に失敗しました: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
            router.replace('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>ログアウト</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>プロフィール画像の設定</Text>
                <Text style={styles.subtitle}>
                    パートナーに表示される画像を設定しましょう
                </Text>

                <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
                    {avatarUri ? (
                        <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Ionicons name="person" size={80} color="#ccc" />
                        </View>
                    )}
                    <View style={styles.avatarEditBadge}>
                        <Ionicons name="camera" size={24} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={styles.avatarHint}>タップして写真を選択</Text>

                <TouchableOpacity
                    style={[styles.button, !avatarUri && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={loading || !avatarUri}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>次へ</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        alignItems: 'flex-end',
    },
    logoutButton: {
        padding: 8,
    },
    logoutText: {
        color: '#999',
        fontSize: 14,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingTop: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 24,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    avatar: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#f0f0f0',
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderWidth: 2,
        borderColor: '#eee',
    },
    avatarEditBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FF4B4B',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
    },
    avatarHint: {
        fontSize: 14,
        color: '#999',
        marginBottom: 60,
    },
    button: {
        width: '100%',
        height: 56,
        backgroundColor: '#FF4B4B',
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF4B4B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
