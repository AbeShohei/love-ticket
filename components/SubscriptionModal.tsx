import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
    visible: boolean;
    onClose: () => void;
}

export function SubscriptionModal({ visible, onClose }: Props) {
    const FEATURES = [
        { icon: 'megaphone-outline', title: '広告なし', desc: 'すべての広告が非表示になります' },
        { icon: 'sparkles-outline', title: 'AIデート提案が無制限', desc: 'AIによる特別なデートプランを好きなだけ作成' },
        { icon: 'infinite-outline', title: '提案回数が無制限', desc: 'デートの提案を好きなだけ送れます' },
    ];

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
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.hero}>
                        <Image
                            source={require('../assets/images/icon.png')}
                            style={styles.appIcon}
                        />
                        <Text style={styles.heroTitle}>LoveTicket Premium</Text>
                        <Text style={styles.heroSubtitle}>二人の特別な瞬間を、もっと自由に。</Text>
                    </View>

                    <View style={styles.featuresGrid}>
                        {FEATURES.map((item, index) => (
                            <View key={index} style={styles.featureItem}>
                                <View style={styles.featureIcon}>
                                    <Ionicons name={item.icon as any} size={24} color="#FFA500" />
                                </View>
                                <View style={styles.featureText}>
                                    <Text style={styles.featureTitle}>{item.title}</Text>
                                    <Text style={styles.featureDesc}>{item.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={styles.plans}>
                        <TouchableOpacity style={[styles.planCard, styles.popularPlan]}>
                            <View style={styles.popularBadge}>
                                <Text style={styles.popularBadgeText}>一番人気</Text>
                            </View>
                            <View>
                                <Text style={styles.planTitle}>年額プラン</Text>
                                <Text style={styles.planPrice}>¥2,800 <Text style={styles.planUnit}>/ 年</Text></Text>
                            </View>
                            <Text style={styles.planSavings}>月あたり¥233 (40%お得)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.planCard}>
                            <View>
                                <Text style={styles.planTitle}>月額プラン</Text>
                                <Text style={styles.planPrice}>¥400 <Text style={styles.planUnit}>/ 月</Text></Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.subscribeBtn}>
                        <LinearGradient
                            colors={['#1a1a1a', '#2c3e50']}
                            style={styles.subscribeBtnGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.subscribeBtnText}>プレミアムを始める</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.footerText}>
                        いつでもキャンセル可能です。お支払いはストアのアカウントを通じて行われます。
                    </Text>
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
    closeBtn: {
        position: 'absolute',
        right: 20,
        top: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    hero: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    appIcon: {
        width: 120,
        height: 120,
        borderRadius: 28,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    featuresGrid: {
        padding: 24,
        gap: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 16,
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    featureDesc: {
        fontSize: 12,
        color: '#7c8591',
    },
    plans: {
        paddingHorizontal: 24,
        gap: 12,
        marginBottom: 32,
    },
    planCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#f0f0f0',
    },
    popularPlan: {
        borderColor: '#FFA500',
        backgroundColor: '#FFFDF0',
    },
    popularBadge: {
        position: 'absolute',
        top: -12,
        right: 20,
        backgroundColor: '#FFA500',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    popularBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    planTitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    planPrice: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    planUnit: {
        fontSize: 14,
        fontWeight: 'normal',
    },
    planSavings: {
        fontSize: 12,
        color: '#FFA500',
        fontWeight: 'bold',
    },
    subscribeBtn: {
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    subscribeBtnGradient: {
        paddingVertical: 18,
        borderRadius: 18,
        alignItems: 'center',
    },
    subscribeBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footerText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 12,
        paddingHorizontal: 40,
    },
});
