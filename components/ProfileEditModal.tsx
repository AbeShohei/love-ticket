import { api } from '@/convex/_generated/api';
import { useAuth } from '@/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
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
import { useTranslation } from 'react-i18next';

type ProfileEditModalProps = {
    visible: boolean;
    onClose: () => void;
};

export function ProfileEditModal({ visible, onClose }: ProfileEditModalProps) {
    const { profile, userId, displayName: currentDisplayName, avatarUrl: currentAvatarUrl } = useAuth();
    const { t } = useTranslation();
    const [displayName, setDisplayName] = useState('');
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const updateProfile = useMutation(api.users.updateProfile);
    const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

    useEffect(() => {
        if (visible) {
            setDisplayName(currentDisplayName || profile?.displayName || '');
            setAvatarUri(currentAvatarUrl || profile?.avatarUrl || null);
        }
    }, [visible, currentDisplayName, currentAvatarUrl, profile]);

    const MAX_IMAGE_SIZE = 500 * 1024; // 500KB (Convex limit is 1MB, leaving margin)

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            const asset = result.assets[0];

            // Check file size
            if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE) {
                const sizeMB = (asset.fileSize / (1024 * 1024)).toFixed(2);
                Alert.alert(
                    t('profileEdit.imageTooLarge'),
                    t('profileEdit.imageSizeMessage', { size: sizeMB }),
                    [{ text: t('common.ok') }]
                );
                return;
            }

            setAvatarUri(asset.uri);
        }
    };

    const handleSave = async () => {
        if (!displayName.trim()) {
            Alert.alert(t('common.error'), t('profileEdit.nameRequired'));
            return;
        }

        if (displayName.trim().length > 12) {
            Alert.alert(t('common.error'), t('profileEdit.nameMaxLength'));
            return;
        }

        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        setLoading(true);

        try {
            const clerkId = userId || profile?.id;

            if (!clerkId) {
                Alert.alert(t('common.error'), t('profileEdit.userNotFound'));
                return;
            }


            let storageId: string | undefined = undefined;

            // Upload image if changed and new URI is local file
            if (avatarUri && !avatarUri.startsWith('http')) {
                try {
                    // 1. Get upload URL
                    const uploadUrl = await generateUploadUrl();

                    // 2. Convert URI to Blob
                    const response = await fetch(avatarUri);
                    const blob = await response.blob();

                    // Double-check blob size
                    if (blob.size > MAX_IMAGE_SIZE) {
                        const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
                        Alert.alert(
                            t('profileEdit.imageTooLarge'),
                            t('profileEdit.imageSizeMessage', { size: sizeMB }),
                            [{ text: t('common.ok') }]
                        );
                        setLoading(false);
                        return;
                    }

                    // 3. Upload file
                    const result = await fetch(uploadUrl, {
                        method: "POST",
                        headers: { "Content-Type": blob.type || 'image/jpeg' },
                        body: blob,
                    });

                    if (!result.ok) {
                        throw new Error(`Upload failed with status ${result.status}`);
                    }

                    const json = await result.json();
                    storageId = json.storageId;
                    console.log('[ProfileEdit] Upload successful, storageId:', storageId);
                } catch (uploadError) {
                    console.error('[ProfileEdit] Image upload failed:', uploadError);
                    Alert.alert(t('common.error'), t('profileEdit.uploadFailed'));
                    setLoading(false);
                    return;
                }
            }

            console.log('[ProfileEdit] Calling updateProfile with storageId:', storageId);
            await updateProfile({
                clerkId,
                displayName: displayName.trim(),
                avatarStorageId: storageId as any,
                avatarUrl: storageId ? undefined : (avatarUri && avatarUri.startsWith('http') ? undefined : avatarUri || undefined),
            });

            console.log('[ProfileEdit] Profile updated successfully');

            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

            Alert.alert(t('common.success'), t('profileEdit.updateSuccess'), [
                { text: t('common.ok'), onPress: onClose }
            ]);
        } catch (error: any) {
            console.error('[ProfileEdit] Failed to update profile:', error);
            const errorMessage = error.message || t('profileEdit.unknownError');
            Alert.alert(t('common.error'), t('profileEdit.updateFailed', { error: errorMessage }));
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
                        <Text style={styles.cancelButton}>{t('common.cancel')}</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('profileEdit.title')}</Text>
                    <TouchableOpacity onPress={handleSave} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#FF4B4B" />
                        ) : (
                            <Text style={styles.saveButton}>{t('common.save')}</Text>
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
                    <Text style={styles.avatarHint}>{t('profileEdit.tapToChange')}</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('profileEdit.displayName')}</Text>
                        <TextInput
                            style={styles.input}
                            value={displayName}
                            onChangeText={setDisplayName}
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
