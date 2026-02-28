import { BannerAdComponent } from '@/components/Ads';
import { CombinedProgressRing } from '@/components/CombinedProgressRing';
import { HelpSupportModal } from '@/components/HelpSupportModal';
import { LanguageSettingsModal } from '@/components/LanguageSettingsModal';
import { NativeDateTimePicker } from '@/components/NativeDateTimePicker';
import { NotificationSettingsModal } from '@/components/NotificationSettingsModal';
import { PrivacyModal } from '@/components/PrivacyModal';
import { ProfileEditModal } from '@/components/ProfileEditModal';
import { SubscriptionBanner } from '@/components/SubscriptionBanner';
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/providers/AuthProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from 'convex/react';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    const { profile, signOut, convexId } = useAuth();
    const { isPremium, customerInfo } = useSubscription();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    // UI State
    const [isProfileEditVisible, setIsProfileEditVisible] = useState(false);
    const [isSubscriptionVisible, setIsSubscriptionVisible] = useState(false);
    const [isNotificationSettingsVisible, setIsNotificationSettingsVisible] = useState(false);
    const [isPrivacyVisible, setIsPrivacyVisible] = useState(false);
    const [isHelpVisible, setIsHelpVisible] = useState(false);
    const [isLanguageVisible, setIsLanguageVisible] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Mutations & Queries
    const leaveCoupleMutation = useMutation(api.couples.leave);
    const deleteAccountMutation = useMutation(api.users.deleteAccount);
    const updateAnniversary = useMutation(api.couples.updateAnniversary);

    // Fetch couple info based on user's coupleId
    const coupleInfo = useQuery(api.couples.getById,
        profile?.coupleId ? { coupleId: profile.coupleId } : 'skip'
    );
    const isCoupleInfoLoading = profile?.coupleId && coupleInfo === undefined;
    const isPaired = !!profile?.coupleId && coupleInfo?.couple?.status === 'active';

    // Get anniversary date from couple info or local state
    const [anniversaryDate, setAnniversaryDate] = useState(new Date());

    useEffect(() => {
        if (coupleInfo?.couple?.anniversaryDate) {
            setAnniversaryDate(new Date(coupleInfo.couple.anniversaryDate));
        }
    }, [coupleInfo]);

    // Fetch stats
    const matchStats = useQuery(api.matches.getStatsForCouple,
        profile?.coupleId && convexId ? { coupleId: profile.coupleId, userId: convexId } : 'skip'
    );

    const avatarUrl = profile?.avatarUrl;

    const handleAnniversaryChangeWithProfile = async (newDate: Date) => {
        setAnniversaryDate(newDate);
        setShowDatePicker(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const coupleId = profile?.coupleId;
        if (coupleId) {
            try {
                await updateAnniversary({
                    coupleId: coupleId,
                    anniversaryDate: newDate.getTime(),
                });
            } catch (error) {
                console.error('Failed to save anniversary:', error);
                Alert.alert(t('common.error'), t('profile.anniversarySaveFailed'));
            }
        }
    };

    const daysTogether = isPaired
        ? Math.max(0, Math.floor((new Date().getTime() - anniversaryDate.getTime()) / (1000 * 3600 * 24)))
        : 0;

    const ringData = useMemo(() => {
        if (!isPaired || !matchStats) {
            return {
                sent: { value: 0, total: 1, color: '#FF4B4B' },
                received: { value: 0, total: 1, color: '#54a0ff' },
                dates: { value: 0, total: 5, color: '#8854d0' },
                sentAchieved: { value: 0, total: 1, color: '#8854d0' },
                receivedAchieved: { value: 0, total: 1, color: '#8854d0' },
            };
        }
        return {
            sent: { value: matchStats.sent || 0, total: matchStats.sentTotal || 1, color: '#FF4B4B' },
            received: { value: matchStats.received || 0, total: matchStats.receivedTotal || 1, color: '#54a0ff' },
            dates: { value: matchStats.completedDates || 0, total: matchStats.totalMatches || 1, color: '#8854d0' },
            sentAchieved: { value: matchStats.sentAchieved || 0, total: matchStats.totalMatches || 1, color: '#8854d0' },
            receivedAchieved: { value: matchStats.receivedAchieved || 0, total: matchStats.totalMatches || 1, color: '#8854d0' },
        };
    }, [isPaired, matchStats]);

    const handleDeleteAccount = () => {
        Alert.alert(
            t('profile.deleteAccountTitle'),
            t('profile.deleteAccountMessage'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('profile.deleteAccountConfirm'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteAccountMutation();
                            await signOut();
                            router.replace('/login');
                        } catch (error) {
                            console.error('Delete account error:', error);
                            Alert.alert(t('common.error'), t('profile.deleteAccountFailed'));
                        }
                    }
                }
            ]
        );
    };

    const handleLogout = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

        Alert.alert(
            t('profile.logoutConfirmTitle'),
            t('profile.logoutConfirmMessage'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('auth.logout'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut();
                            router.replace('/login');
                        } catch (error) {
                            console.error('Logout error:', error);
                            Alert.alert(t('common.error'), t('profile.logoutFailed'));
                        }
                    }
                }
            ]
        );
    };

    const handleManageSubscription = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (Platform.OS === 'ios') {
            // Open App Store subscription management
            Linking.openURL('https://apps.apple.com/account/subscriptions');
        } else {
            // Open Google Play subscription management
            Linking.openURL('https://play.google.com/store/account/subscriptions');
        }
    };

    const handleBreakup = () => {
        if (!profile?._id) return;

        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }

        const confirmBreakup = async () => {
            Alert.alert(
                t('profile.breakupFinalTitle'),
                t('profile.breakupFinalMessage'),
                [
                    { text: t('profile.breakupStop'), style: 'cancel' },
                    {
                        text: t('profile.breakupConfirmButton'),
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                await leaveCoupleMutation({ userId: profile!._id });
                                if (Platform.OS !== 'web') {
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                }
                                Alert.alert(t('common.success'), t('profile.breakupSuccess'));
                            } catch (error) {
                                console.error('Breakup error:', error);
                                Alert.alert(t('common.error'), t('profile.breakupFailed'));
                            }
                        }
                    }
                ]
            );
        };

        Alert.alert(
            t('profile.breakupTitle'),
            `${coupleInfo?.partner?.displayName || t('profile.partner')}${t('profile.breakupConfirm')}`,
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.continue'),
                    style: 'destructive',
                    onPress: confirmBreakup
                }
            ]
        );
    };

    const showSettingsMenu = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (Platform.OS === 'ios') {
            // Add subscription management option for premium users
            const baseOptions: string[] = [t('common.cancel'), t('settings.notifications'), t('settings.language'), t('settings.privacy'), t('settings.helpSupport')];
            if (isPremium) baseOptions.push(t('subscription.manageSubscription'));
            if (isPaired) baseOptions.push(t('profile.breakupTitle'));
            baseOptions.push(t('auth.logout'));
            baseOptions.push(t('profile.deleteAccountTitle'));

            const options = baseOptions;
            const subscriptionIndex = isPremium ? options.indexOf(t('subscription.manageSubscription')) : -1;
            const breakupIndex = options.indexOf(t('profile.breakupTitle'));
            const logoutIndex = options.indexOf(t('auth.logout'));
            const deleteIndex = options.indexOf(t('profile.deleteAccountTitle'));

            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    destructiveButtonIndex: [isPaired ? breakupIndex : -1, deleteIndex].filter(i => i >= 0),
                    cancelButtonIndex: 0,
                    title: t('common.settings'),
                },
                (buttonIndex) => {
                    if (buttonIndex === 0) {
                        // Cancel
                    } else if (buttonIndex === 1) {
                        setIsNotificationSettingsVisible(true);
                    } else if (buttonIndex === 2) {
                        setIsLanguageVisible(true);
                    } else if (buttonIndex === 3) {
                        setIsPrivacyVisible(true);
                    } else if (buttonIndex === 4) {
                        setIsHelpVisible(true);
                    } else if (isPremium && buttonIndex === 5) {
                        handleManageSubscription();
                    } else if (isPaired && buttonIndex === breakupIndex) {
                        handleBreakup();
                    } else if (buttonIndex === logoutIndex) {
                        handleLogout();
                    } else if (buttonIndex === deleteIndex) {
                        handleDeleteAccount();
                    }
                }
            );
        } else {
            const buttons: any[] = [
                { text: t('settings.notifications'), onPress: () => setIsNotificationSettingsVisible(true) },
                { text: t('settings.language'), onPress: () => setIsLanguageVisible(true) },
                { text: t('settings.privacy'), onPress: () => setIsPrivacyVisible(true) },
                { text: t('settings.helpSupport'), onPress: () => setIsHelpVisible(true) },
            ];
            if (isPremium) {
                buttons.push({ text: t('subscription.manageSubscription'), onPress: handleManageSubscription });
            }
            if (isPaired) {
                buttons.push({ text: t('profile.breakupTitle'), onPress: handleBreakup, style: 'destructive' });
            }
            buttons.push({ text: t('auth.logout'), onPress: handleLogout, style: 'destructive' });
            buttons.push({ text: t('profile.deleteAccountTitle'), onPress: handleDeleteAccount, style: 'destructive' });
            buttons.push({ text: t('common.cancel'), style: 'cancel' });

            Alert.alert(
                t('common.settings'),
                t('settings.selectMenu'),
                buttons,
                { cancelable: true }
            );
        }
    };

    const handlePartnerPress = () => {
        if (!isPaired) {
            router.push('/pairing');
        } else {
            Alert.alert(
                t('profile.partner'),
                `${coupleInfo?.partner?.displayName || t('profile.partner')}${t('profile.partnerLinked')}`,
                [{ text: t('common.ok') }]
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

                {/* Couple Stats & Progress Ring */}
                {isCoupleInfoLoading ? (
                    <View style={styles.statsContainer}>
                        <Text style={styles.loadingText}>{t('common.loading')}</Text>
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
                        <Text style={styles.notPairedTitle}>{t('profile.notPairedTitle')}</Text>
                        <Text style={styles.notPairedSubtitle}>
                            {t('profile.notPairedSubtitle')}
                        </Text>
                        <TouchableOpacity
                            style={styles.pairButton}
                            onPress={() => router.push('/pairing')}
                        >
                            <Text style={styles.pairButtonText}>{t('profile.pairWithPartner')}</Text>
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
                        <Text style={styles.actionLabel}>{t('profile.profile')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionBtnContainer}
                        onPress={handlePartnerPress}
                    >
                        <View style={[styles.glassBtnSmall, !isPaired && styles.glassBtnHighlight]}>
                            <Ionicons name={isPaired ? "people" : "people-outline"} size={24} color={isPaired ? "#FF4B4B" : "#7c8591"} />
                        </View>
                        <Text style={styles.actionLabel}>{isPaired ? t('profile.partner') : t('profile.pairing')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionBtnContainer}
                        onPress={() => setShowDatePicker(true)}
                        disabled={!isPaired}
                    >
                        <View style={styles.glassBtnSmall}>
                            <MaterialCommunityIcons name="calendar-heart" size={24} color={isPaired ? "#FF4B4B" : "#7c8591"} />
                        </View>
                        <Text style={styles.actionLabel}>{t('profile.anniversary')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtnContainer} onPress={showSettingsMenu}>
                        <View style={styles.glassBtnSmall}>
                            <Ionicons name="settings-outline" size={24} color="#7c8591" />
                        </View>
                        <Text style={styles.actionLabel}>{t('common.settings')}</Text>
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

            <NotificationSettingsModal
                visible={isNotificationSettingsVisible}
                onClose={() => setIsNotificationSettingsVisible(false)}
            />

            <PrivacyModal
                visible={isPrivacyVisible}
                onClose={() => setIsPrivacyVisible(false)}
            />

            <HelpSupportModal
                visible={isHelpVisible}
                onClose={() => setIsHelpVisible(false)}
            />

            <LanguageSettingsModal
                visible={isLanguageVisible}
                onClose={() => setIsLanguageVisible(false)}
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
