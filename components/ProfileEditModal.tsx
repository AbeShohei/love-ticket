import { useAuth } from '@/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

type ProfileEditModalProps = {
    visible: boolean;
    onClose: () => void;
};

export function ProfileEditModal({ visible, onClose }: ProfileEditModalProps) {
    const { profile, userId, displayName: currentDisplayName, avatarUrl: currentAvatarUrl } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const updateProfile = useMutation(api.users.updateProfile);

    useEffect(() => {
        if (visible) {
            setDisplayName(currentDisplayName || profile?.displayName || '');
            setAvatarUri(currentAvatarUrl || profile?.avatarUrl || null);
        }
    }, [visible, currentDisplayName, currentAvatarUrl, profile]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setAvatarUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!displayName.trim()) {
            Alert.alert('エラー', '表示名を入力してください');
            return;
        }

        if (displayName.trim().length > 12) {
            Alert.alert('エラー', '表示名は12文字以内で入力してください');
            return;
        }

        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        setLoading(true);

        try {
            const clerkId = userId || profile?.id;

            if (!clerkId) {
                Alert.alert('エラー', 'ユーザー情報が見つかりません');
                return;
            }

            console.log('[ProfileEdit] Updating profile for clerkId:', clerkId);

            await updateProfile({
                clerkId,
                displayName: displayName.trim(),
                avatarUrl: avatarUri || undefined,
            });

            console.log('[ProfileEdit] Profile updated successfully');

            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

            Alert.alert('成功', 'プロフィールを更新しました', [
                { text: 'OK', onPress: onClose }
            ]);
        } catch (error) {
            console.error('[ProfileEdit] Failed to update profile:', error);
            Alert.alert('エラー', 'プロフィールの更新に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.cancelButton}>キャンセル</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>プロフィール編集</Text>
                    <TouchableOpacity onPress={handleSave} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#FF4B4B" />
                        ) : (
                            <Text style={styles.saveButton}>保存</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
                        {avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <Ionicons name="person" size={48} color="#ccc" />
                            </View>
                        )}
                        <View style={styles.avatarEditBadge}>
                            <Ionicons name="camera" size={16} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.avatarHint}>タップして写真を変更</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>表示名</Text>
                        <TextInput
                            style={styles.input}
                            value={displayName}
                            onChangeText={setDisplayName}
                            placeholder="表示名を入力"
                            placeholderTextColor="#999"
                            maxLength={12}
                        />
                        <Text style={styles.charCount}>{displayName.length}/12</Text>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingTop: 60,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    cancelButton: {
        fontSize: 16,
        color: '#666',
    },
    saveButton: {
        fontSize: 16,
        color: '#FF4B4B',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f0f0f0',
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    avatarEditBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FF4B4B',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    avatarHint: {
        fontSize: 14,
        color: '#999',
        marginBottom: 32,
    },
    inputGroup: {
        width: '100%',
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#333',
    },
    charCount: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
        marginTop: 4,
    },
});
