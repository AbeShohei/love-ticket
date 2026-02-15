import { BannerAdComponent } from '@/components/Ads';
import { CombinedProgressRing } from '@/components/CombinedProgressRing';
import { NativeDateTimePicker } from '@/components/NativeDateTimePicker';
import { PartnerActionSheet } from '@/components/PartnerActionSheet';
import { SubscriptionBanner } from '@/components/SubscriptionBanner';
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ActionSheetIOS, Alert, Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    // Anniversary state (Local for now, defaults to 2024-01-01)
    const [anniversaryDate, setAnniversaryDate] = useState(new Date('2024-01-01'));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isPartnerSheetVisible, setIsPartnerSheetVisible] = useState(false);
    const [isSubscriptionVisible, setIsSubscriptionVisible] = useState(false);

    const daysTogether = Math.max(0, Math.floor((new Date().getTime() - anniversaryDate.getTime()) / (1000 * 3600 * 24)));

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleAnniversaryChange = (newDate: Date) => {
        setAnniversaryDate(newDate);
        setShowDatePicker(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const showSettingsMenu = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['キャンセル', '通知設定', 'プライバシー', 'ヘルプとサポート', 'ログアウト'],
                    destructiveButtonIndex: 4,
                    cancelButtonIndex: 0,
                    title: '設定',
                },
                (buttonIndex) => {
                    if (buttonIndex === 0) {
                        // Cancel
                    } else {
                        handlePress();
                        // Handle other actions here
                    }
                }
            );
        } else {
            // Android alternative: Alert with buttons
            Alert.alert(
                '設定',
                'メニューを選択してください',
                [
                    { text: '通知設定', onPress: handlePress },
                    { text: 'プライバシー', onPress: handlePress },
                    { text: 'ヘルプとサポート', onPress: handlePress },
                    { text: 'ログアウト', onPress: handlePress, style: 'destructive' },
                    { text: 'キャンセル', style: 'cancel' },
                ],
                { cancelable: true }
            );
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top || 20 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Scrollable Banner Ad */}
                <View style={styles.bannerContainer}>
                    <BannerAdComponent />
                </View>

                {/* Couple Stats & Heart-Shaped Progress Ring */}
                <View style={styles.statsContainer}>
                    <CombinedProgressRing
                        daysTogether={daysTogether}
                        myAvatar="https://picsum.photos/seed/user1/400/400"
                        partnerAvatar="https://picsum.photos/seed/user2/400/400"
                        rings={{
                            sent: { value: 12, total: 20, color: '#FF4B4B', success: 8 },
                            received: { value: 8, total: 20, color: '#54a0ff', success: 4 },
                            dates: { value: 12, total: 40, color: '#8854d0' }
                        }}
                    />
                </View>

                {/* Primary Actions Row */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={styles.actionBtnContainer}
                        onPress={() => setIsPartnerSheetVisible(true)}
                    >
                        <View style={styles.glassBtnSmall}>
                            <Ionicons name="people-outline" size={24} color="#7c8591" />
                        </View>
                        <Text style={styles.actionLabel}>パートナー</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionBtnContainer}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <LinearGradient
                            colors={['#FF4B4B', '#FF8F8F']}
                            style={styles.mainActionBtn}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <MaterialCommunityIcons name="calendar-heart" size={32} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.actionLabel}>記念日設定</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtnContainer} onPress={showSettingsMenu}>
                        <View style={styles.glassBtnSmall}>
                            <Ionicons name="settings-outline" size={24} color="#7c8591" />
                        </View>
                        <Text style={styles.actionLabel}>設定</Text>
                    </TouchableOpacity>
                </View>

                {/* Subscription Promotion */}
                <SubscriptionBanner onPress={() => setIsSubscriptionVisible(true)} />

            </ScrollView>

            <NativeDateTimePicker
                mode="date"
                value={anniversaryDate}
                onChange={handleAnniversaryChange}
                show={showDatePicker}
                onClose={() => setShowDatePicker(false)}
            />

            <PartnerActionSheet
                visible={isPartnerSheetVisible}
                onClose={() => setIsPartnerSheetVisible(false)}
                userId="LT-777-BOND"
            />

            <SubscriptionModal
                visible={isSubscriptionVisible}
                onClose={() => setIsSubscriptionVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fbfcfd',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    bannerContainer: {
        marginBottom: 24,
        alignItems: 'center',
    },
    statsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        marginTop: 20,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        paddingHorizontal: 20,
        gap: 30,
    },
    actionBtnContainer: {
        alignItems: 'center',
    },
    glassBtnSmall: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    mainActionBtn: {
        width: 76,
        height: 76,
        borderRadius: 38,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF4B4B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#666',
    },
});
