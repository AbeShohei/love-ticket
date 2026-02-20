import { BannerAdComponent } from '@/components/Ads';
import { CombinedProgressRing } from '@/components/CombinedProgressRing';
import { NativeDateTimePicker } from '@/components/NativeDateTimePicker';
import { ProfileEditModal } from '@/components/ProfileEditModal';
import { SubscriptionBanner } from '@/components/SubscriptionBanner';
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/providers/AuthProvider';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActionSheetIOS, Alert, Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const { signOut, profile, userId, avatarUrl, displayName, convexId } = useAuth();
    const router = useRouter();

    // Convex mutations
    const updateAnniversary = useMutation(api.couples.updateAnniversary);
    const leaveCoupleMutation = useMutation(api.couples.leaveCouple);

    // Get couple info with partner
    const coupleInfo = useQuery(
        api.couples.getCoupleWithPartner,
        userId ? { clerkId: userId } : 'skip'
    );

    // Get match stats from Convex - pass userId (Convex _id) since ConvexProvider doesn't provide auth tokens
    const matchStats = useQuery(
        api.matches.getStatsForCouple,
        profile?.coupleId && profile?._id ? { coupleId: profile.coupleId, userId: profile._id } : 'skip'
    );

    // Anniversary state - initialize from profile
    const [anniversaryDate, setAnniversaryDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSubscriptionVisible, setIsSubscriptionVisible] = useState(false);
    const [isProfileEditVisible, setIsProfileEditVisible] = useState(false);

    // Debug logging
    useEffect(() => {
        console.log('[Profile] State:', {
            userId,
            profileCoupleId: profile?.coupleId,
            coupleInfo,
            matchStats
        });
    }, [userId, profile?.coupleId, coupleInfo, matchStats]);

    // Check if paired - consider coupleInfo could be loading (undefined)
    const isCoupleInfoLoading = coupleInfo === undefined;
    const isPaired = !!profile?.coupleId && coupleInfo?.partner !== undefined && coupleInfo?.partner !== null;

    // Load anniversary from coupleInfo
    useEffect(() => {
        if (coupleInfo?.couple?.anniversaryDate) {
            setAnniversaryDate(new Date(coupleInfo.couple.anniversaryDate));
        }
    }, [coupleInfo?.couple?.anniversaryDate]);

    // Also save using profile.id (which is now clerkId)
    const handleAnniversaryChangeWithProfile = async (newDate: Date) => {
        setAnniversaryDate(newDate);
        setShowDatePicker(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Save to Convex - prefer coupleId from profile
        const coupleId = profile?.coupleId;
        if (coupleId) {
            try {
                await updateAnniversary({
                    coupleId: coupleId,
                    anniversaryDate: newDate.getTime(),
                });
            } catch (error) {
                console.error('Failed to save anniversary:', error);
                Alert.alert('エラー', '記念日の保存に失敗しました');
            }
        }
    };

    const daysTogether = isPaired
        ? Math.max(0, Math.floor((new Date().getTime() - anniversaryDate.getTime()) / (1000 * 3600 * 24)))
        : 0;

    // Real data for progress ring
    const ringData = useMemo(() => {
        if (!isPaired || !matchStats) {
            return {
                sent: { value: 0, total: 0, color: '#FF4B4B', success: 0 },
                received: { value: 0, total: 0, color: '#54a0ff', success: 0 },
                dates: { value: 0, total: 0, color: '#8854d0' }
            };
        }
        return {
            sent: { value: matchStats.sent || 0, total: 20, color: '#FF4B4B', success: matchStats.sentSuccess || 0 },
            received: { value: matchStats.received || 0, total: 20, color: '#54a0ff', success: matchStats.receivedSuccess || 0 },
            dates: { value: matchStats.completedDates || 0, total: 40, color: '#8854d0' }
        };
    }, [isPaired, matchStats]);

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleLogout = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

        Alert.alert(
            'ログアウト',
            '本当にログアウトしますか？',
            [
                { text: 'キャンセル', style: 'cancel' },
                {
                    text: 'ログアウト',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut();
                            router.replace('/login');
                        } catch (error) {
                            console.error('Logout error:', error);
                            Alert.alert('エラー', 'ログアウトに失敗しました');
                        }
                    }
                }
            ]
        );
    };

    const handleBreakup = () => {
        if (!profile?._id) return;

        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }

        const confirmBreakup = async () => {
            // Second confirmation
            Alert.alert(
                '最終確認',
                'この操作は取り消せません。\nデートの履歴やマッチデータは保持されますが、パートナーとの連携が解除されます。',
                [
                    { text: 'やめる', style: 'cancel' },
                    {
                        text: 'お別れする',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                await leaveCoupleMutation({ userId: profile!._id });
                                if (Platform.OS !== 'web') {
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                }
                                Alert.alert('完了', 'パートナーとの連携を解除しました');
                            } catch (error) {
                                console.error('Breakup error:', error);
                                Alert.alert('エラー', '連携の解除に失敗しました');
                            }
                        }
                    }
                ]
            );
        };

        Alert.alert(
            'お別れをする',
            `${coupleInfo?.partner?.displayName || 'パートナー'}との連携を解除しますか？`,
            [
                { text: 'キャンセル', style: 'cancel' },
                {
                    text: '続ける',
                    style: 'destructive',
                    onPress: confirmBreakup
                }
            ]
        );
    };

    const showSettingsMenu = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (Platform.OS === 'ios') {
            const options = isPaired
                ? ['キャンセル', '通知設定', 'プライバシー', 'ヘルプとサポート', 'お別れをする', 'ログアウト']
                : ['キャンセル', '通知設定', 'プライバシー', 'ヘルプとサポート', 'ログアウト'];
            const destructiveIndex = isPaired ? 4 : 4;
            const logoutIndex = isPaired ? 5 : 4;

            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    destructiveButtonIndex: destructiveIndex,
                    cancelButtonIndex: 0,
                    title: '設定',
                },
                (buttonIndex) => {
                    if (buttonIndex === 0) {
                        // Cancel
                    } else if (isPaired && buttonIndex === 4) {
                        handleBreakup();
                    } else if (buttonIndex === logoutIndex) {
                        handleLogout();
                    } else {
                        handlePress();
                    }
                }
            );
        } else {
            const buttons: any[] = [
                { text: '通知設定', onPress: handlePress },
                { text: 'プライバシー', onPress: handlePress },
                { text: 'ヘルプとサポート', onPress: handlePress },
            ];
            if (isPaired) {
                buttons.push({ text: 'お別れをする', onPress: handleBreakup, style: 'destructive' });
            }
            buttons.push({ text: 'ログアウト', onPress: handleLogout, style: 'destructive' });
            buttons.push({ text: 'キャンセル', style: 'cancel' });

            Alert.alert(
                '設定',
                'メニューを選択してください',
                buttons,
                { cancelable: true }
            );
        }
    };

    const handlePartnerPress = () => {
        if (!isPaired) {
            // Go to pairing screen if not paired
            router.push('/pairing');
        } else {
            // Show partner info (could show unpair option)
            Alert.alert(
                'パートナー',
                `${coupleInfo?.partner?.displayName || 'パートナー'}と連携中です`,
                [{ text: 'OK' }]
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
                {isCoupleInfoLoading ? (
                    <View style={styles.statsContainer}>
                        <Text style={styles.loadingText}>読み込み中...</Text>
                    </View>
                ) : isPaired ? (
                    <View style={styles.statsContainer}>
                        <CombinedProgressRing
                            daysTogether={daysTogether}
                            myAvatar={avatarUrl || 'https://placehold.co/400x400'}
                            partnerAvatar={coupleInfo?.partner?.avatarUrl || 'https://placehold.co/400x400'}
                            rings={ringData}
                        />
                    </View>
                ) : (
                    <View style={styles.notPairedContainer}>
                        <Ionicons name="heart-dislike-outline" size={64} color="#ccc" />
                        <Text style={styles.notPairedTitle}>パートナーと連携していません</Text>
                        <Text style={styles.notPairedSubtitle}>
                            パートナーと連携すると、{"\n"}
                            付き合った日数やデートの統計が表示されます
                        </Text>
                        <TouchableOpacity
                            style={styles.pairButton}
                            onPress={() => router.push('/pairing')}
                        >
                            <Text style={styles.pairButtonText}>パートナーと連携する</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Primary Actions Row */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={styles.actionBtnContainer}
                        onPress={() => setIsProfileEditVisible(true)}
                    >
                        <View style={styles.glassBtnSmall}>
                            <Ionicons name="person-outline" size={24} color="#7c8591" />
                        </View>
                        <Text style={styles.actionLabel}>プロフィール</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionBtnContainer}
                        onPress={handlePartnerPress}
                    >
                        <View style={[styles.glassBtnSmall, !isPaired && styles.glassBtnHighlight]}>
                            <Ionicons name={isPaired ? "people" : "people-outline"} size={24} color={isPaired ? "#FF4B4B" : "#7c8591"} />
                        </View>
                        <Text style={styles.actionLabel}>{isPaired ? 'パートナー' : '連携'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionBtnContainer}
                        onPress={() => setShowDatePicker(true)}
                        disabled={!isPaired}
                    >
                        <View style={styles.glassBtnSmall}>
                            <MaterialCommunityIcons name="calendar-heart" size={24} color={isPaired ? "#FF4B4B" : "#7c8591"} />
                        </View>
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
                onChange={handleAnniversaryChangeWithProfile}
                show={showDatePicker}
                onClose={() => setShowDatePicker(false)}
            />

            <SubscriptionModal
                visible={isSubscriptionVisible}
                onClose={() => setIsSubscriptionVisible(false)}
            />

            <ProfileEditModal
                visible={isProfileEditVisible}
                onClose={() => setIsProfileEditVisible(false)}
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
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    notPairedContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        marginTop: 20,
        padding: 40,
    },
    notPairedTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    notPairedSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    pairButton: {
        backgroundColor: '#FF4B4B',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 25,
    },
    pairButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
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
    glassBtnHighlight: {
        borderColor: '#FF4B4B',
        borderWidth: 2,
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
