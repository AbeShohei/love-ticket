import { MultiSelectCalendar } from '@/components/MultiSelectCalendar';
import { CATEGORIES } from '@/constants/Presets';
import { useAuth } from '@/providers/AuthProvider';
import { Match, useMatchStore } from '@/stores/matchStore';
import { CandidateSlot, usePlanStore } from '@/stores/planStore';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, Modal, RefreshControl, ScrollView, SectionList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Helper functions for Date/Time parsing REMOVED
// Helper functions for Date/Time parsing REMOVED
import { BannerAdComponent } from '@/components/Ads';
import { MatchCard } from '@/components/MatchCard';
import { NativeDateTimePicker } from '../../components/NativeDateTimePicker';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function MatchesScreen() {
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const matches = useMatchStore((state) => state.matches);
  const plans = usePlanStore((state) => state.plans);
  const addPlan = usePlanStore((state) => state.addPlan);
  const updatePlan = usePlanStore((state) => state.updatePlan);

  // Filter out matches that are already in a plan
  const visibleMatches = React.useMemo(() => {
    const plannedMatchIds = plans.flatMap(p => p.proposalIds);
    return matches.filter(m => !plannedMatchIds.includes(m.id));
  }, [matches, plans]);

  // Planning State
  const [isPlanningModalVisible, setIsPlanningModalVisible] = useState(false);
  // const [isCalendarVisible, setIsCalendarVisible] = useState(false); // Removed
  // const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null); // Removed
  // const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null); // Removed
  const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [partnerDates, setPartnerDates] = useState<string[]>([]); // Mock partner dates
  const [planTitle, setPlanTitle] = useState('');
  const [originalMatchId, setOriginalMatchId] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Wizard State
  const [step, setStep] = useState(1);
  const [finalDate, setFinalDate] = useState<string | null>(null);
  const [finalTime, setFinalTime] = useState('');
  const [meetingPlace, setMeetingPlace] = useState('');

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Grouping Logic
  const sections = CATEGORIES.map(cat => {
    const sectionMatches = visibleMatches
      .filter(m => m.tags?.includes(cat.id))
      .sort((a, b) => {
        if (a.type === 'star' && b.type !== 'star') return -1;
        if (a.type !== 'star' && b.type === 'star') return 1;
        return b.timestamp - a.timestamp;
      });

    return {
      title: cat.label,
      icon: cat.icon,
      color: cat.color,
      data: sectionMatches,
    };
  }).filter(section => section.data.length > 0);

  // Handle matches without a valid category
  const uncategorized = visibleMatches
    .filter(m => !m.tags || !m.tags.some(t => CATEGORIES.some(c => c.id === t)))
    .sort((a, b) => b.timestamp - a.timestamp);

  if (uncategorized.length > 0) {
    sections.push({
      title: 'その他',
      icon: 'help-circle' as any,
      color: '#888',
      data: uncategorized,
    });
  }

  const openPlanningModal = (matchId: string) => {
    setSelectedMatchIds([matchId]);
    setOriginalMatchId(matchId);
    const match = matches.find(m => m.id === matchId);
    setPlanTitle(match ? `${match.name}のデート計画` : '新しいデート計画');
    setSelectedDates([]); // Reset dates

    // Mock: Set partner dates to tomorrow and day after tomorrow
    const today = new Date();
    const d1 = new Date(today); d1.setDate(d1.getDate() + 1);
    const d2 = new Date(today); d2.setDate(d2.getDate() + 3); // Spaced out
    setPartnerDates([
      d1.toISOString().split('T')[0],
      d2.toISOString().split('T')[0]
    ]);

    setIsPlanningModalVisible(true);
    setEditingPlanId(null);
    setStep(1);
    setFinalDate(null);
    setFinalTime('');
    setMeetingPlace('');
  };

  const openEditPlanModal = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    setEditingPlanId(planId);
    setPlanTitle(plan.title);
    setSelectedMatchIds(plan.proposalIds);
    setOriginalMatchId(null); // No "original" match when editing a whole plan

    // Set existing dates
    const existingDates = plan.candidateSlots.map(slot => slot.date);
    setSelectedDates(existingDates);

    // Mock partner dates (same logic as create)
    const today = new Date();
    const d1 = new Date(today); d1.setDate(d1.getDate() + 1);
    const d2 = new Date(today); d2.setDate(d2.getDate() + 3);
    setPartnerDates([
      d1.toISOString().split('T')[0],
      d2.toISOString().split('T')[0]
    ]);

    setIsPlanningModalVisible(true);
    setStep(1); // Auto start at 1, or logic to jump? Let's start at 1 for simplicity or check if confirmed.
    // If we want to edit a confirmed plan, we might validly want to see the final details.
    // usage: if (plan.status === 'confirmed') setStep(3); else setStep(1);
    if (plan.status === 'confirmed') {
      setStep(3);
      setFinalDate(plan.finalDate || null);
      setFinalTime(plan.finalTime || '');
      setMeetingPlace(plan.meetingPlace || '');
    } else {
      setStep(1);
      setFinalDate(null);
      setFinalTime('');
      setMeetingPlace('');
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (selectedMatchIds.length === 0) {
        Alert.alert('エラー', '最低1つの提案を選択してください');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (selectedDates.length === 0) {
        Alert.alert('エラー', '候補日を最低1つ選択してください');
        return;
      }
      setStep(3);
    }
  };

  const handleBackStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleConfirmPlan = () => {
    if (!finalDate) {
      Alert.alert('エラー', '最終的な日付を選択してください');
      return;
    }
    if (!finalTime) {
      Alert.alert('エラー', '集合時間を入力してください');
      return;
    }


    const candidateSlots: CandidateSlot[] = selectedDates.map(date => ({
      date,
      time: '19:00', // Default time for slots
    }));

    const planData = {
      title: planTitle || '無題の計画',
      proposalIds: selectedMatchIds,
      candidateSlots: candidateSlots,
      finalDate,
      finalTime,
      meetingPlace,
      status: 'confirmed' as const,
    };

    if (editingPlanId) {
      updatePlan(editingPlanId, planData);
      Alert.alert('更新', 'デート計画を確定しました！');
    } else {
      addPlan({
        ...planData,
        status: 'confirmed',
      });
      Alert.alert('成功', 'デート計画を確定しました！');
    }
    setIsPlanningModalVisible(false);
  };

  // Helper to find common dates
  const commonDates = React.useMemo(() => {
    return selectedDates.filter(d => partnerDates.includes(d));
  }, [selectedDates, partnerDates]);

  const handleAddProposal = (id: string) => {
    if (!selectedMatchIds.includes(id)) {
      setSelectedMatchIds(prev => [...prev, id]);
    }
  };

  // Date/Time helper functions removed

  const renderMatchCard = ({ item }: { item: Match }) => (
    <MatchCard
      item={item}
      onPress={() => openPlanningModal(item.id)}
    />
  );



  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" style={{ marginRight: 8 }} />
          <TextInput placeholder="Search Matches" placeholderTextColor="#999" style={styles.searchInput} />
        </View>

        {/* Date Plans Section */}
        {(() => {
          const visiblePlans = plans.filter(p => p.status !== 'confirmed');
          if (visiblePlans.length === 0) return null;

          return (
            <View style={styles.plansSection}>
              <Text style={styles.plansTitle}>作成中のデート計画</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.plansList}>
                {visiblePlans.map((plan) => (
                  <TouchableOpacity key={plan.id} style={styles.planCard} onPress={() => openEditPlanModal(plan.id)}>
                    <View style={styles.planIconContainer}>
                      <Ionicons name="calendar" size={20} color="#fff" />
                    </View>
                    <View style={styles.planInfo}>
                      <Text style={styles.planName} numberOfLines={1}>{plan.title}</Text>
                      <Text style={styles.planMeta}>{plan.proposalIds.length}個の案 • {plan.candidateSlots.length}つの候補日</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          );
        })()}
      </View>
      <BannerAdComponent />

      <SectionList
        sections={sections}
        renderItem={renderMatchCard}
        renderSectionHeader={({ section: { title, icon, color } }) => (
          <View style={styles.sectionHeader}>
            <Ionicons name={icon as any} size={18} color={color} />
            <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchMatches} tintColor="#fd297b" />}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No matches yet.</Text>
            <Text style={styles.emptyStateSubtext}>Go to Explore to find someone!</Text>
          </View>
        }
      />

      {/* Planning Modal */}
      <Modal
        visible={isPlanningModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsPlanningModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHandleContainer}>
              <View style={styles.modalHandle} />
            </View>
            <View style={styles.modalControls}>
              <TouchableOpacity onPress={() => setIsPlanningModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.modalCloseText}>キャンセル</Text>
              </TouchableOpacity>
              {/* Progress Tracker Title */}


              {step < 3 ? (
                <TouchableOpacity onPress={handleNextStep} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.modalSaveText}>次へ</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleConfirmPlan} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.modalSaveText}>確定</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Progress Tracker */}
            <View style={styles.progressTracker}>
              {[
                { label: '案を決める', icon: 'bulb-outline' },
                { label: '日を選ぶ', icon: 'calendar-outline' },
                { label: '確定する', icon: 'checkmark-circle-outline' }
              ].map((item, index) => {
                const stepNumber = index + 1;
                const isActive = step === stepNumber;
                const isCompleted = step > stepNumber;
                return (
                  <React.Fragment key={index}>
                    <View style={styles.stepIndicatorContainer}>
                      <View style={[
                        styles.stepCircle,
                        isActive && styles.stepCircleActive,
                        isCompleted && styles.stepCircleCompleted
                      ]}>
                        {isCompleted ? (
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        ) : (
                          <Text style={[styles.stepNumber, (isActive || isCompleted) && styles.stepTextActive]}>{stepNumber}</Text>
                        )}
                      </View>
                      <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{item.label}</Text>
                    </View>
                    {index < 2 && <View style={[styles.stepLine, step > stepNumber && styles.stepLineActive]} />}
                  </React.Fragment>
                );
              })}
            </View>
          </View>

          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>

            {step === 1 && (
              <>
                <Text style={styles.stepHeader}>デート案を決めましょう</Text>
                {/* Title Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>計画タイトル</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    value={planTitle}
                    onChangeText={setPlanTitle}
                    placeholder="例: 週末のディナーデート"
                  />
                </View>

                {/* Selected Proposals */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>デート案を組み合わせる</Text>
                  <View style={styles.selectedProposalsList}>
                    {selectedMatchIds.map(id => {
                      const match = matches.find(m => m.id === id);
                      if (!match) return null;
                      return (
                        <View key={id} style={styles.selectedProposalItem}>
                          <Image source={{ uri: match.image }} style={styles.selectedProposalImage} />
                          <Text style={styles.selectedProposalName} numberOfLines={1}>{match.name}</Text>
                          <TouchableOpacity onPress={() => setSelectedMatchIds(prev => prev.filter(mid => mid !== id))} disabled={id === originalMatchId} style={{ opacity: id === originalMatchId ? 0 : 1 }}>
                            <Ionicons name="close-circle" size={20} color="#FF3B30" />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>

                  <Text style={styles.subLabel}>他の案を追加して組み合わせる</Text>

                  {CATEGORIES.map(category => {
                    const categoryMatches = matches
                      .filter(m =>
                        !selectedMatchIds.includes(m.id) &&
                        m.tags?.includes(category.id)
                      )
                      .sort((a, b) => {
                        if (a.type === 'star' && b.type !== 'star') return -1;
                        if (a.type !== 'star' && b.type === 'star') return 1;
                        return b.timestamp - a.timestamp;
                      });

                    if (categoryMatches.length === 0) return null;

                    return (
                      <View key={category.id} style={styles.categoryRow}>
                        <View style={styles.categoryHeader}>
                          <Ionicons name={category.icon as any} size={16} color={category.color} style={{ marginRight: 6 }} />
                          <Text style={[styles.categoryTitle, { color: category.color }]}>{category.label}</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.otherMatchesScroll} contentContainerStyle={styles.otherMatchesContent}>
                          {categoryMatches.map(match => (
                            <View key={match.id} style={{ width: SCREEN_WIDTH * 0.75, marginRight: 15 }}>
                              <MatchCard
                                item={match}
                                onPress={() => handleAddProposal(match.id)}
                                compact
                              />
                            </View>
                          ))}
                        </ScrollView>
                      </View>
                    );
                  })}

                  {/* Uncategorized (Others) */}
                  {(() => {
                    const otherMatches = matches
                      .filter(m =>
                        !selectedMatchIds.includes(m.id) &&
                        (!m.tags || !m.tags.some(t => CATEGORIES.some(c => c.id === t)))
                      )
                      .sort((a, b) => {
                        if (a.type === 'star' && b.type !== 'star') return -1;
                        if (a.type !== 'star' && b.type === 'star') return 1;
                        return b.timestamp - a.timestamp;
                      });

                    if (otherMatches.length === 0) return null;

                    return (
                      <View style={styles.categoryRow}>
                        <View style={styles.categoryHeader}>
                          <Ionicons name="help-circle" size={16} color="#888" style={{ marginRight: 6 }} />
                          <Text style={[styles.categoryTitle, { color: '#888' }]}>その他</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.otherMatchesScroll} contentContainerStyle={styles.otherMatchesContent}>
                          {otherMatches.map(match => (
                            <View key={match.id} style={{ width: SCREEN_WIDTH * 0.75, marginRight: 15 }}>
                              <MatchCard
                                item={match}
                                onPress={() => handleAddProposal(match.id)}
                                compact
                              />
                            </View>
                          ))}
                        </ScrollView>
                      </View>
                    );
                  })()}
                </View>
              </>
            )}

            {step === 2 && (
              <>
                <View style={styles.stepHeaderRow}>
                  <TouchableOpacity onPress={handleBackStep} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                  </TouchableOpacity>
                  <Text style={styles.stepHeader}>候補日を選びましょう</Text>
                </View>

                <Text style={styles.stepDesc}>あなたの都合の良い日を選択してください。</Text>

                <View style={styles.inputGroup}>
                  <MultiSelectCalendar
                    selectedDates={selectedDates}
                    partnerDates={partnerDates}
                    onDatesChange={setSelectedDates}
                  />
                </View>
              </>
            )}

            {step === 3 && (
              <>
                <View style={styles.stepHeaderRow}>
                  <TouchableOpacity onPress={handleBackStep} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                  </TouchableOpacity>
                  <Text style={styles.stepHeader}>最終決定</Text>
                </View>

                <Text style={styles.stepDesc}>お互いの都合が合う日程から、決定しましょう。</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>日程（マッチした候補日）</Text>
                  {commonDates.length > 0 ? (
                    <View style={styles.chipContainer}>
                      {commonDates.map(date => (
                        <TouchableOpacity
                          key={date}
                          style={[styles.dateChip, finalDate === date && styles.dateChipSelected]}
                          onPress={() => setFinalDate(date)}
                        >
                          <Text style={[styles.dateChipText, finalDate === date && styles.dateChipTextSelected]}>
                            {new Date(date).toLocaleDateString()}
                          </Text>
                          {finalDate === date && <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginLeft: 4 }} />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.errorText}>お互いの日程が合いませんでした。候補日を調整してください。</Text>
                  )}

                  {/* Fallback if no overlapping dates, allow picking any selected date? 
                       Requirement says "choose from overlapping dates", so strictly speaking we should block if no overlap.
                       But for UX validation, maybe show all selected user dates as backup? 
                       Let's stick to commonDates for now as per requirement.
                   */}
                </View>

                <View style={styles.inputGroup}>
                  <NativeDateTimePicker
                    mode="time"
                    title="集合時間"
                    value={(() => {
                      const d = new Date();
                      if (finalTime) {
                        const [hours, minutes] = finalTime.split(':').map(Number);
                        if (!isNaN(hours) && !isNaN(minutes)) {
                          d.setHours(hours, minutes);
                        }
                      }
                      return d;
                    })()}
                    onChange={(date) => {
                      const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                      setFinalTime(timeString);
                    }}
                    style={{ height: 150 }}
                  />


                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>集合場所 (任意)</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    value={meetingPlace}
                    onChangeText={setMeetingPlace}
                    placeholder="例: 六本木駅 4番出口"
                  />
                </View>
              </>
            )}

          </ScrollView>
        </View>
      </Modal>

      {/* Calendar Modal */}
      {/* Calendar Modal REMOVED */}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 15,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 4,
  },
  listContent: {
    padding: 15,
    paddingBottom: 120,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardContainer: {
    borderRadius: 16,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    height: 180, // Increased height for more info
    backgroundColor: '#000',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardContentRow: {
    flexDirection: 'row',
    height: '100%',
    width: '100%',
  },
  leftSpacer: {
    width: 30, // Highly reduced to expand blur range
  },
  rightBlurContainer: {
    flex: 1,
    height: '100%',
  },
  detailsOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 100, // Match leftSpacer
    padding: 10,
    paddingLeft: 80, // Increased left padding significantly
    justifyContent: 'flex-start',
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  topLeftStamp: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 40,
    height: 40,
    zIndex: 10,
    transform: [{ rotate: '-15deg' }],
  },
  nameText: {
    fontSize: 16, // Slightly smaller to fit
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    flex: 1,
    marginRight: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
  },
  bioText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 15,
    marginBottom: 4,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  linkText: {
    fontSize: 11,
    color: '#4CD964',
    textDecorationLine: 'underline',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 'auto', // Push to bottom if space permits
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tagText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
  },
  modalHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
  },
  modalControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseText: {
    color: '#999',
    fontSize: 16,
  },
  modalSaveText: {
    color: '#fd297b',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  modalTextInput: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedProposalsList: {
    gap: 10,
  },
  selectedProposalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 12,
    gap: 10,
  },
  selectedProposalImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  selectedProposalName: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
  },
  otherMatchesScroll: {
    marginHorizontal: -20,
  },
  otherMatchesContent: {
    paddingHorizontal: 20,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  pickerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nativePicker: {
    flex: 1,
    height: 40,
  },
  addSlotText: {
    color: '#fd297b',
    fontSize: 14,
    fontWeight: 'bold',
  },
  plansSection: {
    marginTop: 15,
  },
  plansTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  plansList: {
    gap: 12,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    width: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  planIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fd297b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  planMeta: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  // Calendar Modal Styles REMOVED

  // Progress & Wizard Styles
  modalStepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  progressTracker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    marginTop: 15,
    marginBottom: 10,
  },
  stepIndicatorContainer: {
    alignItems: 'center',
    zIndex: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    borderColor: '#fd297b',
    backgroundColor: '#fff',
  },
  stepCircleCompleted: {
    borderColor: '#fd297b',
    backgroundColor: '#fd297b',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
  },
  stepTextActive: {
    color: '#fd297b',
  },
  stepLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#333',
    fontWeight: 'bold',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#eee',
    marginTop: -20,
    marginHorizontal: -10,
    zIndex: 0,
  },
  stepLineActive: {
    backgroundColor: '#fd297b',
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    marginRight: 10,
    padding: 4,
  },
  stepHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  stepDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateChipSelected: {
    backgroundColor: '#fd297b',
    borderColor: '#fd297b',
  },
  dateChipText: {
    fontSize: 14,
    color: '#333',
  },
  dateChipTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 10,
  },
  categoryRow: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});



