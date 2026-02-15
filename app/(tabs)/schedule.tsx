import { BannerAdComponent } from '@/components/Ads';
import { MatchCard } from '@/components/MatchCard';
import { useMatchStore } from '@/stores/matchStore';
import { usePlanStore } from '@/stores/planStore';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { Dimensions, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';

// Setup Japanese Locale
LocaleConfig.locales['jp'] = {
    monthNames: [
        '1月', '2月', '3月', '4月', '5月', '6月',
        '7月', '8月', '9月', '10月', '11月', '12月'
    ],
    monthNamesShort: [
        '1月', '2月', '3月', '4月', '5月', '6月',
        '7月', '8月', '9月', '10月', '11月', '12月'
    ],
    dayNames: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
    dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'],
    today: '今日'
};
LocaleConfig.defaultLocale = 'jp';

const SCREEN_WIDTH = Dimensions.get('window').width;
const appIcon = require('../../assets/images/icon.png');

export default function ScheduleScreen() {
    const plans = usePlanStore((state) => state.plans);
    const matches = useMatchStore((state) => state.matches);
    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().split('T')[0].slice(0, 7)); // YYYY-MM
    const [selectedPlan, setSelectedPlan] = useState<any>(null); // Plan to view details for

    // Filter confirmed plans
    const confirmedPlans = useMemo(() => {
        return plans
            .filter(p => p.status === 'confirmed' && p.finalDate)
            .sort((a, b) => (a.finalDate! > b.finalDate! ? 1 : -1));
    }, [plans]);

    // Map plans to dates for efficient lookup
    const plansByDate = useMemo(() => {
        const map: { [key: string]: boolean } = {};
        confirmedPlans.forEach(p => {
            if (p.finalDate) {
                map[p.finalDate] = true;
            }
        });
        return map;
    }, [confirmedPlans]);

    // Filter plans for the displayed list (current month)
    const visiblePlans = useMemo(() => {
        return confirmedPlans.filter(p => p.finalDate && p.finalDate.startsWith(currentMonth));
    }, [confirmedPlans, currentMonth]);

    const renderCustomDay = ({ date, state }: { date?: DateData, state?: string }) => {
        if (!date) return <View />;

        const hasPlan = plansByDate[date.dateString];
        const isToday = date.dateString === new Date().toISOString().split('T')[0];

        return (
            <View style={styles.dayContainer}>
                <View style={styles.dayInner}>
                    {hasPlan ? (
                        <Image source={appIcon} style={styles.dayIcon} />
                    ) : null}
                    <Text style={[
                        styles.dayText,
                        state === 'disabled' && styles.disabledText,
                        isToday && !hasPlan && styles.todayText,
                        hasPlan && styles.planDayText
                    ]}>
                        {date.day}
                    </Text>
                </View>
            </View>
        );
    };

    const getPlanImage = (plan: any) => {
        if (plan.proposalIds && plan.proposalIds.length > 0) {
            const firstMatch = matches.find(m => m.id === plan.proposalIds[0]);
            return firstMatch ? firstMatch.image : 'https://placehold.co/600x400';
        }
        return 'https://placehold.co/600x400';
    };

    const handlePlanPress = (plan: any) => {
        setSelectedPlan(plan);
    };

    const renderPlanItem = ({ item }: { item: any }) => {
        const date = new Date(item.finalDate);
        const imageUri = getPlanImage(item);

        return (
            <TouchableOpacity style={styles.cardContainer} onPress={() => handlePlanPress(item)} activeOpacity={0.9}>
                <Image source={{ uri: imageUri }} style={styles.cardBackground} contentFit="cover" />
                <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                    style={styles.cardOverlay}
                >
                    <View style={styles.cardContent}>
                        {/* Date Badge - kept from original design */}
                        <View style={styles.dateBadge}>
                            <Text style={styles.dateMonth}>{date.toLocaleString('ja-JP', { month: 'short' })}</Text>
                            <Text style={styles.dateDay}>{date.getDate()}</Text>
                        </View>

                        {/* Plan Details - Adapted for dark background */}
                        <View style={styles.planInfo}>
                            <Text style={styles.planTitleText}>{item.title}</Text>
                            <View style={styles.metaRow}>
                                <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.metaText}>{item.finalTime || 'TBD'}</Text>
                            </View>
                            <View style={styles.metaRow}>
                                <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.metaText} numberOfLines={1}>{item.meetingPlace || '場所未定'}</Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Schedule</Text>
            </View>
            <BannerAdComponent />

            <View style={styles.calendarContainer}>
                <Calendar
                    current={currentMonth}
                    onMonthChange={(month) => {
                        setCurrentMonth(month.dateString.slice(0, 7));
                    }}
                    monthFormat={'yyyy年 MM月'}
                    enableSwipeMonths={true}
                    dayComponent={renderCustomDay}
                    theme={{
                        arrowColor: '#fd297b',
                        todayTextColor: '#fd297b',
                        textDayFontWeight: '600',
                        textMonthFontWeight: 'bold',
                        textDayHeaderFontWeight: 'bold',
                    }}
                />
            </View>

            <View style={styles.listContainer}>
                <Text style={styles.listHeader}>{new Date(currentMonth).getMonth() + 1}月の予定</Text>
                <FlatList
                    data={visiblePlans}
                    renderItem={renderPlanItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>予定はありません</Text>
                            <Text style={styles.emptySubText}>マッチ画面からデートを計画しましょう！</Text>
                        </View>
                    }
                />
            </View>

            {/* Plan Details Modal */}
            <Modal
                visible={!!selectedPlan}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setSelectedPlan(null)}
            >
                {selectedPlan && (
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectedPlan.title}</Text>
                            <TouchableOpacity onPress={() => setSelectedPlan(null)} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
                            <Text style={styles.modalSectionTitle}>デートスポット ({selectedPlan.proposalIds.length})</Text>
                            {selectedPlan.proposalIds.map((id: string) => {
                                const match = matches.find(m => m.id === id);
                                if (!match) return null;
                                return (
                                    <View key={id} style={{ marginBottom: 15 }}>
                                        <MatchCard
                                            item={match}
                                            onPress={() => {
                                                // Handle match press inside details if needed
                                            }}
                                            compact={false} // Show full details
                                        />
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 10,
        backgroundColor: '#f8f9fa',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    calendarContainer: {
        marginBottom: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    dayContainer: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayInner: {
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    dayIcon: {
        width: 36,
        height: 36,
        position: 'absolute',
        borderRadius: 18,
    },
    dayText: {
        fontSize: 14,
        color: '#333',
        marginTop: 2,
        zIndex: 2,
    },
    disabledText: {
        color: '#ccc',
    },
    todayText: {
        color: '#fd297b',
        fontWeight: 'bold',
    },
    planDayText: {
        color: '#fff',
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    listContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    listHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
        marginLeft: 20,
        marginTop: 10,
        marginBottom: 5,
    },
    listContent: {
        padding: 20,
        gap: 15,
        paddingBottom: 100,
    },
    // New Card Styles
    cardContainer: {
        height: 100, // Reduced height for row layout (compact)
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#000', // Fallback
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 10,
    },
    cardBackground: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    cardOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
    },
    dateBadge: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
        minWidth: 55,
        height: 65,
    },
    dateMonth: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fd297b',
        textTransform: 'uppercase',
    },
    dateDay: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fd297b',
        lineHeight: 28,
    },
    planInfo: {
        flex: 1,
        justifyContent: 'center',
        gap: 2,
    },
    planTitleText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 2,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 50,
        gap: 10,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#999',
    },
    emptySubText: {
        fontSize: 12,
        color: '#bbb',
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 5,
    },
    modalScroll: {
        flex: 1,
    },
    modalContent: {
        padding: 20,
        paddingBottom: 50,
    },
    modalSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 15,
        marginTop: 10,
    },
});
