import { BannerAdComponent } from '@/components/Ads';
import { CATEGORIES } from '@/constants/Presets';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Dimensions, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = (SCREEN_WIDTH - 30) / 2;

// Free tier limit for AI suggestions
const AI_SUGGESTION_LIMIT = 5;

// AI Background Images
const AI_BG_IMAGES = [
    'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800&auto=format&fit=crop',
];

// Spot type for generated plans
type GeneratedSpot = {
    id: string;
    title: string;
    image: string;
    location: string;
    url: string;
    price: string;
    description: string;
    category: string;
};

export default function ExploreScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Convex query for preset proposals
    const presetProposals = useQuery(api.proposals.getExploreSpots, {});

    // AI Modal State
    const [isAIModalVisible, setIsAIModalVisible] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedSpots, setGeneratedSpots] = useState<GeneratedSpot[]>([]);
    const [adoptedSpotIds, setAdoptedSpotIds] = useState<string[]>([]);
    const [aiSuggestionCount, setAiSuggestionCount] = useState(0);

    // Form State
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [customInput, setCustomInput] = useState('');
    const [selectedDates, setSelectedDates] = useState<string[]>([]);

    const remainingSuggestions = AI_SUGGESTION_LIMIT - aiSuggestionCount;

    // Convert Convex presets to GeneratedSpots
    const convertedPresets = useMemo(() => {
        if (!presetProposals) return null;
        return presetProposals.map((p: any) => ({
            id: p._id,
            title: p.title,
            image: p.imageUrl || p.images?.[0] || 'https://placehold.co/600x400',
            location: p.location || '',
            url: p.url || '',
            price: p.price || '',
            description: p.description || '',
            category: p.category,
        }));
    }, [presetProposals]);

    /*
    const handleAICardPress = () => {
        if (aiSuggestionCount >= AI_SUGGESTION_LIMIT) {
            Alert.alert(
                '無料枠の上限に達しました',
                'AIスポット提案の無料利用回数（5回）をすべて使用しました。',
                [{ text: 'OK' }]
            );
            return;
        }
        setIsAIModalVisible(true);
        setGeneratedSpots([]);
        setAdoptedSpotIds([]);
        setSelectedCategory(null);
        setCustomInput('');
        setSelectedDates([]);
    };

    const handleGenerateSpots = () => {
        if (aiSuggestionCount >= AI_SUGGESTION_LIMIT) {
            Alert.alert(
                '無料枠の上限に達しました',
                'AIスポット提案の無料利用回数（5回）をすべて使用しました。',
                [{ text: 'OK' }]
            );
            return;
        }

        if (!convertedPresets || convertedPresets.length === 0) {
            Alert.alert('エラー', 'おすすめスポットが見つかりませんでした');
            return;
        }

        setIsGenerating(true);
        setAiSuggestionCount(prev => prev + 1);

        // Filter by selected category and pick random spots
        setTimeout(() => {
            let filteredSpots = convertedPresets;
            if (selectedCategory) {
                filteredSpots = convertedPresets.filter((s: GeneratedSpot) => s.category === selectedCategory);
            }
            // Shuffle and pick up to 3 spots
            const shuffled = [...filteredSpots].sort(() => Math.random() - 0.5);
            setGeneratedSpots(shuffled.slice(0, 3));
            setIsGenerating(false);
        }, 1500);
    };

    const handleAdoptSpot = (spot: GeneratedSpot) => {
        if (adoptedSpotIds.includes(spot.id)) {
            setAdoptedSpotIds(prev => prev.filter(id => id !== spot.id));
        } else {
            setAdoptedSpotIds(prev => [...prev, spot.id]);
        }
    };
    */

    const renderItem = ({ item }: { item: typeof CATEGORIES[0] }) => (
        <TouchableOpacity
            style={styles.itemContainer}
            activeOpacity={0.8}
            onPress={() => router.push({
                pathname: '/proposals/create',
                params: { category: item.id }
            })}
        >
            <Image
                source={{ uri: item.image }}
                style={styles.image}
                contentFit="cover"
                transition={300}
            />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradientOverlay}
            >
                <Text style={styles.itemTitle}>{item.label}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );

    const randomBgImage = AI_BG_IMAGES[Math.floor(Math.random() * AI_BG_IMAGES.length)];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Text style={styles.headerTitle}>カタログ</Text>
            <BannerAdComponent />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* AI Recommendations Card */}
                <View
                    style={styles.aiCard}
                >
                    <Image
                        source={{ uri: randomBgImage }}
                        style={styles.aiCardImage}
                        contentFit="cover"
                    />
                    <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' }} />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                        style={styles.aiCardOverlay}
                    >
                        <View style={[styles.aiCardBadge, { backgroundColor: '#333' }]}>
                            <Ionicons name="time" size={14} color="#fff" />
                            <Text style={[styles.aiCardBadgeText, { color: '#fff' }]}>Coming Soon</Text>
                        </View>
                        <Text style={styles.aiCardTitle}>AIスポット提案</Text>
                        <Text style={styles.aiCardSubtitle}>AIがあなたにぴったりのデートスポットを提案します</Text>
                        <View style={styles.aiCardFooter}>
                            <View style={[styles.aiCardButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <Text style={[styles.aiCardButtonText, { color: '#fff' }]}>準備中</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Categories Section */}
                <View style={styles.categoriesSection}>
                    <Text style={styles.sectionTitle}>カテゴリから探す</Text>
                    <FlatList
                        data={CATEGORIES}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        numColumns={2}
                        scrollEnabled={false}
                        contentContainerStyle={styles.list}
                        columnWrapperStyle={styles.listRow}
                    />
                </View>
            </ScrollView>

            {/* AI Plan Generator Modal - Disabled for Coming Soon
            <Modal
                visible={isAIModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsAIModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <LinearGradient
                        colors={['#fd297b', '#ff6b6b']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.modalHeader}
                    >
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeaderContent}>
                            <Ionicons name="sparkles" size={24} color="#fff" />
                            <Text style={styles.modalHeaderTitle}>AIスポット提案</Text>
                        </View>
                    </LinearGradient>

                    {isGenerating ? (
                        <View style={styles.generatingContainer}>
                            <ActivityIndicator size="large" color="#fd297b" style={{ marginVertical: 20 }} />
                            <Text style={styles.generatingText}>AIがスポットを提案中...</Text>
                            <Text style={styles.generatingSubtext}>あなたにぴったりのスポットをお届けします</Text>
                        </View>
                    ) : generatedSpots.length > 0 ? (
                        <ScrollView style={styles.planScroll} contentContainerStyle={styles.planContent}>
                            <View style={styles.planHeader}>
                                <Text style={styles.planTitle}>おすすめスポット</Text>
                            </View>

                            <View style={styles.planBody}>
                                <Text style={styles.planDescription}>気に入ったスポットを採用してチケットに追加しましょう</Text>

                                {generatedSpots.map((spot) => (
                                    <TouchableOpacity
                                        key={spot.id}
                                        style={[
                                            styles.spotCardWrapper,
                                            adoptedSpotIds.includes(spot.id) && styles.spotCardSelected
                                        ]}
                                        activeOpacity={0.9}
                                        onPress={() => handleAdoptSpot(spot)}
                                    >
                                        <Image source={{ uri: spot.image }} style={styles.spotCardImage} contentFit="cover" />
                                        <LinearGradient
                                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                                            style={styles.spotCardOverlay}
                                        >
                                            <View style={styles.spotCardHeader}>
                                                <Text style={styles.spotCardTitle} numberOfLines={1}>{spot.title}</Text>
                                                {adoptedSpotIds.includes(spot.id) && (
                                                    <View style={styles.selectedBadge}>
                                                        <Ionicons name="checkmark" size={12} color="#fff" />
                                                    </View>
                                                )}
                                            </View>
                                            <View style={styles.spotCardMeta}>
                                                <Ionicons name="location-sharp" size={12} color="rgba(255,255,255,0.7)" />
                                                <Text style={styles.spotCardMetaText} numberOfLines={1}>{spot.location}</Text>
                                            </View>
                                            {spot.price && (
                                                <View style={styles.spotCardMeta}>
                                                    <Ionicons name="cash-outline" size={12} color="rgba(255,255,255,0.7)" />
                                                    <Text style={styles.spotCardMetaText}>{spot.price}</Text>
                                                </View>
                                            )}
                                            <Text style={styles.spotCardBio} numberOfLines={2}>{spot.description}</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                ))}

                                <TouchableOpacity style={styles.regenerateButton} onPress={() => {
                                    setGeneratedSpots([]);
                                    handleGenerateSpots();
                                }}>
                                    <Ionicons name="refresh" size={20} color="#fd297b" />
                                    <Text style={styles.regenerateButtonText}>別のスポットを提案</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    ) : (
                        <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent}>
                            <Text style={styles.formSubtitle}>希望を入力して、おすすめのスポットを提案してもらいましょう</Text>
                            <Text style={styles.formLimitText}>無料枠残り: {remainingSuggestions}/{AI_SUGGESTION_LIMIT}回</Text>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>カテゴリを選択</Text>
                                <View style={styles.categoryGrid}>
                                    {CATEGORIES.map(cat => (
                                        <TouchableOpacity
                                            key={cat.id}
                                            style={[
                                                styles.categoryChip,
                                                selectedCategory === cat.id && styles.categoryChipSelected
                                            ]}
                                            onPress={() => setSelectedCategory(cat.id)}
                                        >
                                            <Ionicons
                                                name={cat.icon as any}
                                                size={16}
                                                color={selectedCategory === cat.id ? '#fff' : cat.color}
                                            />
                                            <Text style={[
                                                styles.categoryChipText,
                                                selectedCategory === cat.id && styles.categoryChipTextSelected
                                            ]}>
                                                {cat.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>希望や要望（任意）</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="例: 夜景が見たい、予算は1万円以内..."
                                    placeholderTextColor="#999"
                                    value={customInput}
                                    onChangeText={setCustomInput}
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>候補日（任意）</Text>
                                <MultiSelectCalendar
                                    selectedDates={selectedDates}
                                    onDatesChange={setSelectedDates}
                                />
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.generateButton,
                                    !selectedCategory && selectedDates.length === 0 && !customInput && styles.generateButtonDisabled
                                ]}
                                onPress={handleGenerateSpots}
                                disabled={!selectedCategory && selectedDates.length === 0 && !customInput}
                            >
                                <Ionicons name="sparkles" size={20} color="#fff" />
                                <Text style={styles.generateButtonText}>スポットを提案</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    )}
                </View>
            </Modal>
            */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        paddingHorizontal: 20,
        marginBottom: 10,
        color: '#333',
    },
    scrollView: {
        flex: 1,
    },
    // AI Card
    aiCard: {
        marginHorizontal: 15,
        height: 160,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    aiCardImage: {
        ...StyleSheet.absoluteFillObject,
    },
    aiCardOverlay: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    aiCardBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        alignSelf: 'flex-start',
        gap: 4,
        marginBottom: 12,
    },
    aiCardBadgeText: {
        color: '#fd297b',
        fontSize: 12,
        fontWeight: 'bold',
    },
    aiCardTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 6,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    aiCardSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        marginBottom: 16,
        lineHeight: 18,
    },
    aiCardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    aiCardButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 6,
    },
    aiCardButtonText: {
        color: '#fd297b',
        fontSize: 14,
        fontWeight: 'bold',
    },
    aiCardLimit: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
    // Categories Section
    categoriesSection: {
        paddingBottom: 100,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    list: {
        paddingHorizontal: 10,
    },
    listRow: {
        justifyContent: 'center',
    },
    itemContainer: {
        width: ITEM_WIDTH,
        height: ITEM_WIDTH * 1.4,
        margin: 5,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#eee',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    gradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 15,
        paddingTop: 40,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    itemTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        paddingTop: 12,
        paddingBottom: 20,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    modalHandle: {
        width: 40,
        height: 5,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 3,
        marginBottom: 16,
    },
    modalHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    modalHeaderTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    // Form Styles
    formScroll: {
        flex: 1,
    },
    formContent: {
        padding: 20,
    },
    formSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 20,
    },
    formLimitText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginBottom: 24,
    },
    formGroup: {
        marginBottom: 24,
    },
    formLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        backgroundColor: '#fff',
        gap: 6,
    },
    categoryChipSelected: {
        backgroundColor: '#fd297b',
        borderColor: '#fd297b',
    },
    categoryChipText: {
        fontSize: 13,
        color: '#333',
        fontWeight: '500',
    },
    categoryChipTextSelected: {
        color: '#fff',
    },
    textInput: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#333',
        minHeight: 80,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    generateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(253, 41, 123, 0.15)',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
        marginTop: 8,
        borderWidth: 1,
        borderColor: 'rgba(253, 41, 123, 0.3)',
    },
    generateButtonDisabled: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    generateButtonText: {
        color: '#fd297b',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Generating
    generatingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    generatingText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    generatingSubtext: {
        fontSize: 14,
        color: '#666',
    },
    // Plan
    planScroll: {
        flex: 1,
    },
    planContent: {
        paddingBottom: 40,
    },
    planHeader: {
        padding: 24,
        alignItems: 'center',
    },
    planTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
    },
    planBody: {
        padding: 20,
    },
    planDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
        marginBottom: 28,
        textAlign: 'center',
    },
    spotCardWrapper: {
        height: 180,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        backgroundColor: '#eee',
        position: 'relative',
    },
    spotCardSelected: {
        borderWidth: 3,
        borderColor: '#fd297b',
        shadowColor: '#fd297b',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 6,
    },
    spotCardImage: {
        ...StyleSheet.absoluteFillObject,
    },
    spotCardOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
        padding: 12,
        paddingTop: 60,
        justifyContent: 'flex-end',
    },
    spotCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    spotCardTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    selectedBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#fd297b',
        justifyContent: 'center',
        alignItems: 'center',
    },
    spotCardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 2,
    },
    spotCardMetaText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 11,
    },
    spotCardBio: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
        lineHeight: 15,
        marginTop: 4,
    },
    regenerateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
        marginTop: 20,
    },
    regenerateButtonText: {
        color: '#fd297b',
        fontSize: 15,
        fontWeight: '600',
    },
});
