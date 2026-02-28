import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect, useRef } from 'react';
import { Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { PurchasesPackage } from 'react-native-purchases';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PlanType = 'monthly' | 'weekly';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export function SubscriptionModal({ visible, onClose }: Props) {
    const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly');
    const { t, i18n } = useTranslation();
    const {
        isPremium,
        offerings,
        purchasePackage,
        restorePurchases,
        isPurchasing,
        isLoading
    } = useSubscription();

    const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
    const [weeklyPackage, setWeeklyPackage] = useState<PurchasesPackage | null>(null);

    // Load packages from offerings
    useEffect(() => {
        if (offerings?.current) {
            if (offerings.current.monthly) {
                setMonthlyPackage(offerings.current.monthly);
            }
            if (offerings.current.weekly) {
                setWeeklyPackage(offerings.current.weekly);
            }
        }
    }, [offerings]);

    // Close modal if user becomes premium
    const didShowSuccessRef = useRef(false);

    useEffect(() => {
        if (isPremium && visible && !didShowSuccessRef.current) {
            didShowSuccessRef.current = true;
            Alert.alert(
                t('subscription.success'),
                t('subscription.successMessage'),
                [{ text: t('common.ok'), onPress: onClose }]
            );
        }
    }, [isPremium, visible, onClose, t]);

    // Reset the ref when modal becomes invisible
    useEffect(() => {
        if (!visible) {
            didShowSuccessRef.current = false;
        }
    }, [visible]);

    const FEATURES = [
        { icon: 'megaphone-outline', title: t('subscription.features.noAds'), desc: t('subscription.features.noAdsDesc') },
        { icon: 'sparkles-outline', title: t('subscription.features.unlimitedAI'), desc: t('subscription.features.unlimitedAIDesc') },
        { icon: 'infinite-outline', title: t('subscription.features.unlimitedProposals'), desc: t('subscription.features.unlimitedProposalsDesc') },
    ];

    // Get localized price from RevenueCat package
    const getPlanPrice = (planType: PlanType): string => {
        const pkg = planType === 'monthly' ? monthlyPackage : weeklyPackage;
        if (pkg) {
            return pkg.product.priceString;
        }
        // Fallback to hardcoded prices
        return planType === 'monthly' ? t('subscription.monthlyPrice') : t('subscription.weeklyPrice');
    };

    // Get USD reference price for non-USD locales
    const getUsdRef = (planType: PlanType): string | null => {
        const pkg = planType === 'monthly' ? monthlyPackage : weeklyPackage;
        if (!pkg || pkg.product.currencyCode === 'USD') return null;
        if (i18n.language === 'ja') {
            return planType === 'monthly' ? '($9.99 USD)' : '($3.99 USD)';
        }
        return null;
    };

    const PLANS = [
        {
            id: 'monthly' as PlanType,
            title: t('subscription.monthlyPlan'),
            price: getPlanPrice('monthly'),
            unit: t('subscription.perMonth'),
            usdRef: getUsdRef('monthly'),
            savings: t('subscription.monthlySavings'),
            popular: true,
        },
        {
            id: 'weekly' as PlanType,
            title: t('subscription.weeklyPlan'),
            price: getPlanPrice('weekly'),
            unit: t('subscription.perWeek'),
            usdRef: getUsdRef('weekly'),
            savings: null,
            popular: false,
        },
    ];

    const handleSubscribe = async () => {
        if (!offerings?.current) {
            Alert.alert(t('common.error'), t('subscription.productNotFound'));
            return;
        }

        const success = await purchasePackage(selectedPlan);

        if (!success) {
            // Don't show error if user cancelled
            // The purchasePackage function handles userCancelled internally
        }
    };

    const handleRestore = async () => {
        const restored = await restorePurchases();
        if (restored) {
            Alert.alert(t('subscription.restored'), t('subscription.restoredMessage'));
        } else {
            Alert.alert(t('subscription.restorePurchases'), t('subscription.noPurchaseFound'));
        }
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
                        <Text style={styles.heroTitle}>{t('subscription.heroTitle')}</Text>
                        <Text style={styles.heroSubtitle}>{t('subscription.heroSubtitle')}</Text>
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

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#FF4B4B" />
                            <Text style={styles.loadingText}>{t('common.loading')}</Text>
                        </View>
                    ) : (
                        <View style={styles.plans}>
                            {PLANS.map((plan) => {
                                const isSelected = selectedPlan === plan.id;
                                return (
                                    <TouchableOpacity
                                        key={plan.id}
                                        style={[
                                            styles.planCard,
                                            isSelected && styles.selectedPlan,
                                            plan.popular && styles.popularPlan,
                                        ]}
                                        onPress={() => setSelectedPlan(plan.id)}
                                        activeOpacity={0.7}
                                        disabled={isPurchasing}
                                    >
                                        {plan.popular && (
                                            <View style={styles.popularBadge}>
                                                <Text style={styles.popularBadgeText}>{t('subscription.mostPopular')}</Text>
                                            </View>
                                        )}
                                        <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                                            <View style={[styles.radioInner, isSelected && styles.radioInnerSelected]} />
                                        </View>
                                        <View style={styles.planInfo}>
                                            <Text style={styles.planTitle}>{plan.title}</Text>
                                            <Text style={styles.planPrice}>
                                                {plan.price} <Text style={styles.planUnit}>{plan.unit}</Text>
                                            </Text>
                                            {plan.usdRef && (
                                                <Text style={styles.usdRef}>{plan.usdRef}</Text>
                                            )}
                                            {plan.savings && (
                                                <Text style={styles.planSavings}>{plan.savings}</Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.subscribeBtn, isPurchasing && styles.subscribeBtnDisabled]}
                        onPress={handleSubscribe}
                        disabled={isPurchasing || isLoading}
                    >
                        <LinearGradient
                            colors={isPurchasing ? ['#ccc', '#999'] : ['#1a1a1a', '#2c3e50']}
                            style={styles.subscribeBtnGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            {isPurchasing ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.subscribeBtnText}>
                                    {selectedPlan === 'monthly' ? t('subscription.startMonthly') : t('subscription.startWeekly')}
                                </Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.restoreBtn}
                        onPress={handleRestore}
                        disabled={isPurchasing}
                    >
                        <Text style={styles.restoreBtnText}>{t('subscription.restorePurchases')}</Text>
                    </TouchableOpacity>

                    <Text style={styles.footerText}>
                        {t('subscription.cancelAnytime')}
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
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    plans: {
        paddingHorizontal: 24,
        gap: 12,
        marginBottom: 32,
    },
    planCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#f0f0f0',
    },
    selectedPlan: {
        borderColor: '#FF4B4B',
        backgroundColor: '#FFF5F5',
    },
    popularPlan: {
        borderColor: '#FFA500',
        backgroundColor: '#FFFDF0',
    },
    radioOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    radioOuterSelected: {
        borderColor: '#FF4B4B',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'transparent',
    },
    radioInnerSelected: {
        backgroundColor: '#FF4B4B',
    },
    planInfo: {
        flex: 1,
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
    usdRef: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    planSavings: {
        fontSize: 12,
        color: '#FFA500',
        fontWeight: 'bold',
    },
    subscribeBtn: {
        paddingHorizontal: 24,
        marginBottom: 12,
    },
    subscribeBtnDisabled: {
        opacity: 0.7,
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
    restoreBtn: {
        paddingHorizontal: 24,
        marginBottom: 20,
        alignItems: 'center',
    },
    restoreBtnText: {
        color: '#666',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    footerText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 12,
        paddingHorizontal: 40,
    },
});
