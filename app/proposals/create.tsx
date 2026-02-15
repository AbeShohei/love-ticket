import { MultiSelectCalendar } from '@/components/MultiSelectCalendar';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES } from '../../constants/Presets';
import { Proposal } from '../../types/Proposal';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Home Screen Card Dimensions
const HOME_CARD_WIDTH = SCREEN_WIDTH;
const HOME_CARD_HEIGHT = SCREEN_HEIGHT - 90;

// 90% of Home Screen Card
const CARD_WIDTH = (HOME_CARD_WIDTH > 0 ? HOME_CARD_WIDTH : SCREEN_WIDTH) * 0.9;
const CARD_HEIGHT = (HOME_CARD_HEIGHT > 0 ? HOME_CARD_HEIGHT : SCREEN_HEIGHT * 0.8) * 0.9;

export default function CreateProposal() {
    const router = useRouter();
    const params = useLocalSearchParams<{ category?: string }>();
    const insets = useSafeAreaInsets();

    // Finds the initial category object based on param or defaults to first one
    const initialCategory = CATEGORIES.find(c => c.id === params.category) || CATEGORIES[0];

    // State
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // Category is fixed to the one selected in Explore
    const [category] = useState(initialCategory.id);
    const activeCategory = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];

    // Optional Fields
    const [location, setLocation] = useState('');
    const [url, setUrl] = useState('');
    const [price, setPrice] = useState('');

    const [step, setStep] = useState<'card' | 'dates'>('card');
    const [candidateDates, setCandidateDates] = useState<string[]>([]);

    const scrollViewRef = useRef<ScrollView>(null);


    const handleNext = () => {
        if (currentImageIndex < images.length - 1) {
            const nextIndex = currentImageIndex + 1;
            scrollViewRef.current?.scrollTo({ x: nextIndex * CARD_WIDTH, animated: true });
            setCurrentImageIndex(nextIndex);
        }
    };

    const handlePrev = () => {
        if (currentImageIndex > 0) {
            const prevIndex = currentImageIndex - 1;
            scrollViewRef.current?.scrollTo({ x: prevIndex * CARD_WIDTH, animated: true });
            setCurrentImageIndex(prevIndex);
        }
    };

    const pickImages = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 5,
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled) {
            const newUris = result.assets.map(asset => asset.uri);
            setImages(prev => [...prev, ...newUris]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => {
            const newImages = prev.filter((_, i) => i !== index);
            // Adjust current index if needed
            if (currentImageIndex >= newImages.length && newImages.length > 0) {
                setCurrentImageIndex(newImages.length - 1);
            } else if (newImages.length === 0) {
                setCurrentImageIndex(0);
            }
            return newImages;
        });
    };

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = event.nativeEvent.contentOffset.x / slideSize;
        const roundIndex = Math.round(index);
        if (roundIndex !== currentImageIndex) {
            setCurrentImageIndex(roundIndex);
        }
    };

    const submit = async () => {
        if (!title) {
            Alert.alert('エラー', 'タイトルを入力してください');
            return;
        }

        if (images.length === 0) {
            Alert.alert('エラー', '写真を少なくとも1枚追加してください');
            return;
        }

        setLoading(true);

        // Mock Submission
        const newProposal: Proposal = {
            id: Date.now().toString(),
            title,
            description,
            images,
            category: category as any,
            location: location || undefined,
            url: url || undefined,
            price: price || undefined,
            candidateDates: candidateDates.length > 0 ? candidateDates : undefined,
            createdAt: new Date(),
        };

        console.log('New Proposal Created:', JSON.stringify(newProposal, null, 2));

        // Simulate network delay
        setTimeout(() => {
            setLoading(false);
            Alert.alert('成功', '提案を作成しました！(フロントエンドのみ)');
            router.back();
        }, 1000);
    };

    // Derived state for display logic
    // If only 1 image (or 0), show everything on page 0.
    // If > 1 image:
    //   Page 0: Show Title, Category
    //   Page 1+: Show Details (Location, URL, Price, Description)
    const showTitle = images.length <= 1 || currentImageIndex === 0;
    const showDetails = images.length <= 1 || currentImageIndex > 0;

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <View style={{ paddingTop: 10, paddingBottom: 10, alignItems: 'center', zIndex: 10 }}>
                <View style={styles.modalHandle} />
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={{ paddingBottom: 400 }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                automaticallyAdjustKeyboardInsets={true}
            >
                {step === 'card' ? (
                    /* Visual Card (WYSIWYG) */
                    <View style={styles.cardContainer}>
                        <View style={styles.card}>

                            {/* Image Carousel / Placeholder */}
                            <View style={styles.imageContainer}>
                                <ScrollView
                                    ref={scrollViewRef}
                                    horizontal
                                    pagingEnabled
                                    showsHorizontalScrollIndicator={false}
                                    style={StyleSheet.absoluteFill}
                                    onMomentumScrollEnd={onScroll}
                                >
                                    {images.length > 0 ? (
                                        images.map((img, index) => (
                                            <View key={index} style={styles.imageWrapper}>
                                                <Image source={{ uri: img }} style={styles.cardImage} contentFit="cover" />
                                                <TouchableOpacity
                                                    style={styles.removeImageButton}
                                                    onPress={() => removeImage(index)}
                                                >
                                                    <Ionicons name="close-circle" size={24} color="#fff" />
                                                </TouchableOpacity>
                                            </View>
                                        ))
                                    ) : (
                                        <TouchableOpacity style={styles.placeholderContainer} onPress={pickImages}>
                                            <Ionicons name="images-outline" size={48} color="#fff" />
                                            <Text style={styles.placeholderText}>写真を追加</Text>
                                        </TouchableOpacity>
                                    )}
                                </ScrollView>

                                {/* Tap Zones for Navigation */}
                                {images.length > 1 && (
                                    <>
                                        <TouchableOpacity style={styles.leftTouchZone} onPress={handlePrev} />
                                        <TouchableOpacity style={styles.rightTouchZone} onPress={handleNext} />
                                    </>
                                )}
                            </View>

                            {/* Add more images button if images exist */}
                            {images.length > 0 && (
                                <TouchableOpacity style={styles.addMoreButton} onPress={pickImages}>
                                    <Ionicons name="add-circle" size={32} color="#fff" />
                                </TouchableOpacity>
                            )}

                            {/* Pagination Dots */}
                            {images.length > 1 && (
                                <View style={styles.pagination}>
                                    {images.map((_, i) => (
                                        <View key={i} style={[styles.dot, { opacity: i === currentImageIndex ? 1 : 0.5 }]} />
                                    ))}
                                </View>
                            )}

                            {/* Content Overlay */}
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
                                style={styles.cardGradient}
                            >
                                {/* Title & Category (Page 1 Logic) */}
                                {showTitle && (
                                    <>
                                        <View style={styles.categorySelector}>
                                            <View
                                                style={[
                                                    styles.categoryChip,
                                                    { backgroundColor: activeCategory.color, borderColor: activeCategory.color }
                                                ]}
                                            >
                                                <Ionicons
                                                    name={activeCategory.icon as any}
                                                    size={12}
                                                    color={'#fff'}
                                                />
                                                <Text style={[styles.categoryText, { color: '#fff' }]}>
                                                    {activeCategory.label}
                                                </Text>
                                            </View>
                                        </View>

                                        <TextInput
                                            style={styles.titleInput}
                                            placeholder="タイトルを入力..."
                                            placeholderTextColor="rgba(255,255,255,0.7)"
                                            value={title}
                                            onChangeText={setTitle}
                                            multiline
                                            maxLength={40}
                                            autoFocus={true}
                                        />
                                    </>
                                )}

                                {/* Details (Page 2+ Logic, or Page 1 if single image) */}
                                {showDetails && (
                                    <View style={styles.detailsContainer}>
                                        {/* Optional Fields Row - Vertical List */}
                                        <View style={styles.metaList}>
                                            <View style={styles.metaInputRow}>
                                                <Ionicons name="location" size={20} color="#fff" style={styles.metaIcon} />
                                                <TextInput
                                                    style={styles.metaInput}
                                                    placeholder="場所"
                                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                                    value={location}
                                                    onChangeText={setLocation}
                                                />
                                            </View>

                                            <View style={styles.metaInputRow}>
                                                <Ionicons name="link" size={20} color="#fff" style={styles.metaIcon} />
                                                <TextInput
                                                    style={styles.metaInput}
                                                    placeholder="URL"
                                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                                    value={url}
                                                    onChangeText={setUrl}
                                                    keyboardType="url"
                                                    autoCapitalize="none"
                                                />
                                            </View>

                                            <View style={styles.metaInputRow}>
                                                <Ionicons name="cash" size={20} color="#fff" style={styles.metaIcon} />
                                                <TextInput
                                                    style={styles.metaInput}
                                                    placeholder="予算"
                                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                                    value={price}
                                                    onChangeText={setPrice}
                                                />
                                            </View>
                                        </View>

                                        <TextInput
                                            style={styles.descInput}
                                            placeholder="詳細を入力してください..."
                                            placeholderTextColor="rgba(255,255,255,0.7)"
                                            value={description}
                                            onChangeText={setDescription}
                                            multiline
                                            numberOfLines={3}
                                        />
                                    </View>
                                )}

                            </LinearGradient>
                        </View>
                    </View>
                ) : (
                    <View style={{ padding: 20 }}>
                        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
                            候補日を選択してください
                        </Text>
                        <MultiSelectCalendar
                            selectedDates={candidateDates}
                            onDatesChange={setCandidateDates}
                        />
                    </View>
                )}

                {/* Submit / Next Button */}
                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={() => {
                        if (step === 'card') {
                            if (!title) {
                                Alert.alert('エラー', 'タイトルを入力してください');
                                return;
                            }
                            if (images.length === 0) {
                                Alert.alert('エラー', '写真を少なくとも1枚追加してください');
                                return;
                            }
                            setStep('dates');
                        } else {
                            submit();
                        }
                    }}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>
                            {step === 'card' ? '次へ (日程選択)' : '提案を作成'}
                        </Text>
                    )}
                </TouchableOpacity>

                {step === 'dates' && (
                    <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: 'transparent', marginTop: -10 }]}
                        onPress={() => setStep('card')}
                    >
                        <Text style={[styles.submitButtonText, { color: '#aaa', fontSize: 14 }]}>戻る</Text>
                    </TouchableOpacity>
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    cardContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 40,
        overflow: 'hidden',
        backgroundColor: '#333',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    imageContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    imageWrapper: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeImageButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
    },
    addMoreButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 5,
        zIndex: 10,
    },
    placeholderContainer: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#444',
        paddingBottom: 220,
    },
    placeholderText: {
        color: '#fff',
        marginTop: 10,
        fontSize: 16,
        fontWeight: 'bold',
    },
    pagination: {
        position: 'absolute',
        top: 20,
        alignSelf: 'center',
        flexDirection: 'row',
        gap: 6,
        zIndex: 10,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#fff',
    },
    cardGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingTop: 60,
        justifyContent: 'flex-end',
    },
    categorySelector: {
        flexDirection: 'row',
        marginBottom: 16,
        maxHeight: 40,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#666',
        marginRight: 8,
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#ccc',
    },
    titleInput: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    detailsContainer: {
        width: '100%',
    },
    metaList: {
        marginBottom: 16,
        gap: 12,
    },
    metaInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    metaIcon: {
        width: 24,
        textAlign: 'center',
    },
    metaInput: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
    },
    descInput: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 24,
        minHeight: 80,
    },
    submitButton: {
        backgroundColor: '#FF4B4B',
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 20,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#555',
        borderRadius: 2.5,
    },
    leftTouchZone: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '30%',
        height: '100%',
        zIndex: 5,
    },
    rightTouchZone: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: '30%',
        height: '100%',
        zIndex: 5,
    },
});
