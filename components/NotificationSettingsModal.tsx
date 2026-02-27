import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import React, { useEffect, useState } from 'react';
import {
    Linking,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '@/providers/AuthProvider';

type Props = {
    visible: boolean;
    onClose: () => void;
};

export function NotificationSettingsModal({ visible, onClose }: Props) {
    const { userId } = useAuth();
    const [dateNotification, setDateNotification] = useState(true);
    const [matchNotification, setMatchNotification] = useState(true);
    const [planNotification, setPlanNotification] = useState(true);

    // Get current settings from Convex
    const convexUser = useQuery(
        api.users.getByClerkId,
        userId ? { clerkId: userId } : "skip"
    );

    // Update settings mutation
    const updateSettings = useMutation(api.users.updateNotificationSettings);

    // Load settings from Convex when modal opens
    useEffect(() => {
        if (visible && convexUser) {
            // Default to true if not set (for backwards compatibility)
            setDateNotification(convexUser.notificationDate ?? true);
            setMatchNotification(convexUser.notificationMatch ?? true);
            setPlanNotification(convexUser.notificationPlan ?? true);
        }
    }, [visible, convexUser]);

    const toggleSetting = async (
        key: 'notificationDate' | 'notificationMatch' | 'notificationPlan',
        value: boolean,
        setter: (v: boolean) => void
    ) => {
        setter(value);
        try {
            await updateSettings({ [key]: value });
        } catch (e) {
            console.error('Failed to save notification setting:', e);
            // Revert on error
            setter(!value);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>通知設定</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
                <ScrollView style={styles.content}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>通知の種類</Text>
                        <View style={styles.row}>
                            <View style={styles.rowTextContainer}>
                                <Text style={styles.rowTitle}>デート案の通知</Text>
                                <Text style={styles.rowSubtitle}>新しいデート案が提案されたとき</Text>
                            </View>
                            <Switch
                                value={dateNotification}
                                onValueChange={(v) =>
                                    toggleSetting('notificationDate', v, setDateNotification)
                                }
                                trackColor={{ false: '#ddd', true: '#FF4B4B' }}
                                thumbColor="#fff"
                            />
                        </View>
                        <View style={styles.row}>
                            <View style={styles.rowTextContainer}>
                                <Text style={styles.rowTitle}>マッチ通知</Text>
                                <Text style={styles.rowSubtitle}>デートプランがマッチしたとき</Text>
                            </View>
                            <Switch
                                value={matchNotification}
                                onValueChange={(v) =>
                                    toggleSetting('notificationMatch', v, setMatchNotification)
                                }
                                trackColor={{ false: '#ddd', true: '#FF4B4B' }}
                                thumbColor="#fff"
                            />
                        </View>
                        <View style={styles.row}>
                            <View style={styles.rowTextContainer}>
                                <Text style={styles.rowTitle}>プラン通知</Text>
                                <Text style={styles.rowSubtitle}>デートプランの更新があったとき</Text>
                            </View>
                            <Switch
                                value={planNotification}
                                onValueChange={(v) =>
                                    toggleSetting('notificationPlan', v, setPlanNotification)
                                }
                                trackColor={{ false: '#ddd', true: '#FF4B4B' }}
                                thumbColor="#fff"
                            />
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>システム設定</Text>
                        <TouchableOpacity
                            style={styles.linkRow}
                            onPress={() => {
                                if (Platform.OS === 'ios') {
                                    Linking.openSettings();
                                } else {
                                    Linking.openSettings();
                                }
                            }}
                        >
                            <Ionicons name="settings-outline" size={20} color="#666" />
                            <Text style={styles.linkText}>OSの通知設定を開く</Text>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>
                        <Text style={styles.hint}>
                            通知が届かない場合は、端末の設定からアプリの通知を許可してください。
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fbfcfd' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: { fontSize: 17, fontWeight: '600', color: '#333' },
    closeBtn: { position: 'absolute', right: 16 },
    content: { flex: 1, padding: 20 },
    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 13, fontWeight: '600', color: '#999', marginBottom: 12, textTransform: 'uppercase' },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    rowTextContainer: { flex: 1, marginRight: 12 },
    rowTitle: { fontSize: 16, fontWeight: '500', color: '#333' },
    rowSubtitle: { fontSize: 13, color: '#999', marginTop: 2 },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 10,
    },
    linkText: { flex: 1, fontSize: 16, color: '#333' },
    hint: { fontSize: 13, color: '#999', marginTop: 8, lineHeight: 18 },
});
