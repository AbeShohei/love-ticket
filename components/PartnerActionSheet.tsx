import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import React from 'react';
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
    visible: boolean;
    onClose: () => void;
    userId: string;
}

export function PartnerActionSheet({ visible, onClose, userId }: Props) {
    const handleCopyId = async () => {
        await Clipboard.setStringAsync(userId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleShare = async () => {
        const url = `love-ticket://link/${userId}`;
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(url, {
                dialogTitle: 'パートナーに招待を送る',
            });
        }
    };

    const handleScan = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const renderMockQR = () => {
        const size = 160;
        const cells = 15;
        const cellSize = size / cells;
        return (
            <View style={styles.qrContainer}>
                <Svg width={size} height={size}>
                    {Array.from({ length: cells * cells }).map((_, i) => {
                        const x = (i % cells) * cellSize;
                        const y = Math.floor(i / cells) * cellSize;
                        const isFilled = (Math.sin(i * 123.45 + userId.length) > 0);
                        const isCorner = (x < cellSize * 3 && y < cellSize * 3) ||
                            (x > size - cellSize * 4 && y < cellSize * 3) ||
                            (x < cellSize * 3 && y > size - cellSize * 4);

                        if (isCorner) {
                            return (
                                <Rect
                                    key={i}
                                    x={x} y={y}
                                    width={cellSize - 1} height={cellSize - 1}
                                    fill="#333"
                                    rx={1}
                                />
                            );
                        }

                        return isFilled ? (
                            <Rect
                                key={i}
                                x={x} y={y}
                                width={cellSize - 1} height={cellSize - 1}
                                fill="#333"
                                rx={1}
                            />
                        ) : null;
                    })}
                </Svg>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.handle} />
                    <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
                        <Ionicons name="close" size={24} color="#C4CACC" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.title}>パートナーと連携</Text>
                    <Text style={styles.subtitle}>QRコードをスキャンしてお互いを登録しましょう</Text>

                    <View style={styles.qrSection}>
                        {renderMockQR()}
                        <Text style={styles.userIdText}>ID: {userId}</Text>
                        <TouchableOpacity style={styles.copyBtn} onPress={handleCopyId}>
                            <Ionicons name="copy-outline" size={16} color="#7c8591" />
                            <Text style={styles.copyBtnText}>IDをコピー</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionBtn} onPress={handleScan}>
                            <View style={[styles.iconCircle, { backgroundColor: '#FF4B4B' }]}>
                                <Ionicons name="qr-code-outline" size={24} color="#fff" />
                            </View>
                            <Text style={styles.actionLabel}>スキャン</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                            <View style={[styles.iconCircle, { backgroundColor: '#54a0ff' }]}>
                                <Ionicons name="share-outline" size={24} color="#fff" />
                            </View>
                            <Text style={styles.actionLabel}>共有</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.mainCloseBtn} onPress={onClose}>
                        <Text style={styles.mainCloseBtnText}>閉じる</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingVertical: 12,
        alignItems: 'center',
        position: 'relative',
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: '#e0e0e0',
        borderRadius: 3,
    },
    closeIcon: {
        position: 'absolute',
        right: 20,
        top: 12,
    },
    scroll: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#7c8591',
        marginBottom: 32,
        textAlign: 'center',
        lineHeight: 20,
    },
    qrSection: {
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#f8f9fa',
        borderRadius: 24,
        width: '100%',
        marginBottom: 32,
    },
    qrContainer: {
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 16,
    },
    userIdText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    copyBtnText: {
        fontSize: 12,
        color: '#7c8591',
        fontWeight: '500',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 60,
        marginBottom: 40,
    },
    actionBtn: {
        alignItems: 'center',
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    actionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
    mainCloseBtn: {
        width: '100%',
        paddingVertical: 18,
        backgroundColor: '#f1f2f6',
        borderRadius: 18,
        alignItems: 'center',
    },
    mainCloseBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#7c8591',
    },
});
