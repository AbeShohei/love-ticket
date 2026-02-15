import { BannerAdComponent } from '@/components/Ads';
import { CATEGORIES } from '@/constants/Presets';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useMatchStore } from '@/stores/matchStore';
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Linking, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  CurvedTransition, Extrapolate, interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Card dimensions: Full width/height usage within tab view
const CARD_WIDTH = SCREEN_WIDTH;
const CARD_HEIGHT = SCREEN_HEIGHT - 90; // Fill screen height minus tab bar (approx 83px) + gap

// Limits (Mock for now, should come from config/DB)
const DAILY_LIKE_LIMIT = 10;
const DAILY_SUPER_LIKE_LIMIT = 1;

type Proposal = {
  id: string;
  isAd?: boolean;
  title: string;
  description: string;
  image_url: string | null;
  images?: string[];
  category: string;
  location?: string;
  url?: string;
  price?: string;
  created_by: string;
};

type DailyUsage = {
  like_count: number;
  super_like_count: number;
  proposal_create_count: number;
};

export default function SwipeScreen() {
  const insets = useSafeAreaInsets();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage>({ like_count: 0, super_like_count: 0, proposal_create_count: 0 });

  const { profile } = useAuth();
  const router = useRouter();
  const addMatch = useMatchStore((state) => state.addMatch);

  // Swipe Animation Shared Values (Lifted for interactive buttons)
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Ref for the swipeable card
  const cardRef = useRef<any>(null);

  // fetchData is now simpler
  const fetchData = useCallback(async (isInitial = false) => {
    // Only show full loading screen on initial load
    if (isInitial) {
      setLoading(true);
    }

    // Immediate load (mock)
    const { MOCK_PROPOSALS, AD_MOCK_DATA } = require('@/constants/MockData');

    // Inject Ads every 3 items
    const augmentedProposals: Proposal[] = [];
    let adCounter = 0;
    MOCK_PROPOSALS.forEach((p: Proposal, index: number) => {
      augmentedProposals.push(p);
      if ((index + 1) % 3 === 0) {
        const adMock = AD_MOCK_DATA[adCounter % AD_MOCK_DATA.length];
        augmentedProposals.push({
          ...adMock,
          created_by: 'admob'
        });
        adCounter++;
      }
    });

    setProposals(augmentedProposals);
    setDailyUsage({
      like_count: 3,
      super_like_count: 0,
      proposal_create_count: 1
    });
    setLoading(false);
  }, []); // Remove profile/proposals.length to avoid loops

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  const activeProposal = proposals[currentIndex];

  const onSwipeComplete = async (direction: 'left' | 'right' | 'up') => {
    // Haptics
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Check Limits
    if (direction === 'right' && dailyUsage.like_count >= DAILY_LIKE_LIMIT) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Limit Reached', 'Daily limit reached!');
      return;
    }

    // Optimistic Update
    // Do NOT reset translateX/Y here anymore, SwipeableCard will handle its own local values
    setCurrentIndex(prev => prev + 1);

    // Update Usage Local
    if (direction === 'right') {
      setDailyUsage(prev => ({ ...prev, like_count: prev.like_count + 1 }));
    } else if (direction === 'up') { // Super Like
      setDailyUsage(prev => ({ ...prev, super_like_count: prev.super_like_count + 1 }));
    }

    // activeProposal is already declared above
    if (!activeProposal) return;

    // Skip backend call for mock data
    if (activeProposal.id.startsWith('mock-')) {
      console.log('Swiped mock proposal:', activeProposal.id, direction);

      // Add to local match store
      if (direction === 'right' || direction === 'up') {
        const image = activeProposal.images?.[0] || activeProposal.image_url || 'https://placehold.co/200x200';
        addMatch({
          id: activeProposal.id,
          name: activeProposal.title,
          image,
          type: direction === 'right' ? 'love' : 'star',
          bio: activeProposal.description,
          location: activeProposal.location || 'Tokyo, Japan',
          age: Math.floor(Math.random() * 5) + 20, // Mock age 20-25
          tags: [activeProposal.category],
          price: activeProposal.price,
          url: activeProposal.url,
        });
      }
      return;
    }

    const { error } = await supabase.from('swipes').insert({
      proposal_id: activeProposal.id,
      user_id: profile!.id,
      direction: direction === 'up' ? 'super_like' : direction,
    });

    if (error) {
      console.error('Swipe error', error);
    }
  };

  const handleManualSwipe = (direction: 'left' | 'right' | 'up') => {
    // Trigger animation via ref
    if (cardRef.current) {
      cardRef.current.swipe(direction);
    }
  };

  // Button Animated Styles (Must be top-level, before ANY early returns)
  const nopeButtonStyle = useAnimatedStyle(() => {
    const isDominant = translateX.value < 0 && Math.abs(translateX.value) > Math.abs(translateY.value);
    const scale = interpolate(Math.abs(translateX.value), [0, 100], [0, 2], Extrapolate.CLAMP);
    return {
      transform: [{ scale: isDominant ? scale : 0 }],
      opacity: isDominant ? 1 : 0,
    };
  });

  const superLikeButtonStyle = useAnimatedStyle(() => {
    const isDominant = translateY.value < 0 && Math.abs(translateY.value) > Math.abs(translateX.value);
    const scale = interpolate(Math.abs(translateY.value), [0, 100], [0, 2], Extrapolate.CLAMP);
    return {
      transform: [{ scale: isDominant ? scale : 0 }],
      opacity: isDominant ? 1 : 0,
    };
  });

  const likeButtonStyle = useAnimatedStyle(() => {
    const isDominant = translateX.value > 0 && Math.abs(translateX.value) > Math.abs(translateY.value);
    const scale = interpolate(Math.abs(translateX.value), [0, 100], [0, 2], Extrapolate.CLAMP);
    return {
      transform: [{ scale: isDominant ? scale : 0 }],
      opacity: isDominant ? 1 : 0,
    };
  });

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        {/* Removed loading delay */}
        <ActivityIndicator size="large" color="#fd297b" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.cardContainer}>
        {/* Radar / Empty State (Always at the bottom) */}
        <View style={[styles.centerContainer, StyleSheet.absoluteFillObject]}>
          <View style={styles.radarContainer}>
            <View style={styles.radarCircle} />
            <Image
              source={require('@/assets/images/adaptive-icon.png')}
              style={{ width: 80, height: 80, borderRadius: 40 }}
            />
          </View>
          <Text style={styles.emptyText}>No more profiles nearby.</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={() => fetchData(true)}>
            <Text style={styles.refreshButtonText}>REFRESH</Text>
          </TouchableOpacity>
        </View>

        {/* Card Stack - Persistent rendering to avoid flashes */}
        {proposals.map((item, index) => {
          // Only render current and next card
          if (index < currentIndex || index > currentIndex + 1) return null;

          const isTop = index === currentIndex;

          return (
            <SwipeableCard
              ref={isTop ? cardRef : null}
              key={item.id}
              item={item}
              onSwipe={onSwipeComplete}
              canLike={dailyUsage.like_count < DAILY_LIKE_LIMIT}
              isActive={isTop}
              sharedX={translateX}
              sharedY={translateY}
            />
          );
        }).reverse() /* Render top card last for correct z-index */}

        {/* Action Buttons Overlay (Fixed position) */}
        <View style={[styles.actionButtonsOverlay, { bottom: 100 }]}>
          {/* Nope Button (Blue Gradient) */}
          <View style={styles.circleButtonLarge}>
            <View style={[StyleSheet.absoluteFill, { borderRadius: 32, overflow: 'hidden' }]}>
              <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 32, overflow: 'hidden' }, nopeButtonStyle]}>
                <LinearGradient
                  colors={['#24C6DC', '#514A9D']}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
            <TouchableOpacity
              style={styles.buttonInner}
              onPress={() => handleManualSwipe('left')}
            >
              <Image source={require('@/assets/images/nope_stamp.png')} style={{ width: 40, height: 40 }} contentFit="contain" />
            </TouchableOpacity>
          </View>

          {/* Super Like Button (Yellow/Gold Gradient) */}
          <View style={styles.circleButtonLarge}>
            <View style={[StyleSheet.absoluteFill, { borderRadius: 32, overflow: 'hidden' }]}>
              <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 32, overflow: 'hidden' }, superLikeButtonStyle]}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
            <TouchableOpacity
              style={styles.buttonInner}
              onPress={() => handleManualSwipe('up')}
            >
              <Image source={require('@/assets/images/super_like_stamp.png')} style={{ width: 40, height: 40 }} contentFit="contain" />
            </TouchableOpacity>
          </View>

          {/* Like Button (Pink Gradient) */}
          <View style={styles.circleButtonLarge}>
            <View style={[StyleSheet.absoluteFill, { borderRadius: 32, overflow: 'hidden' }]}>
              <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 32, overflow: 'hidden' }, likeButtonStyle]}>
                <LinearGradient
                  colors={['#FF1493', '#fd297b']}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
            <TouchableOpacity
              style={styles.buttonInner}
              onPress={() => handleManualSwipe('right')}
            >
              <Image source={require('@/assets/images/like_stamp.png')} style={{ width: 40, height: 40 }} contentFit="contain" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={{ position: 'absolute', top: insets.top, left: 0, right: 0, zIndex: 1000 }}>
        <BannerAdComponent />
      </View>
    </GestureHandlerRootView>
  );
}

// Sub-components
// Ad Card Component
const AdCard = React.memo(({ item }: { item: Proposal }) => {
  const handleAdPress = () => {
    if (item.url) {
      Linking.openURL(item.url);
    }
  };

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: item.image_url || 'https://placehold.co/600x900/png?text=Sponsored' }}
        style={styles.cardImage}
        contentFit="cover"
      />
      <MaskedView
        style={styles.bottomBlurMask}
        maskElement={
          <LinearGradient
            colors={['transparent', 'black']}
            style={StyleSheet.absoluteFill}
            locations={[0, 0.4]}
          />
        }
      >
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      </MaskedView>

      <View style={styles.cardContent}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
        <View style={styles.tagsRow}>
          <View style={[styles.tag, { backgroundColor: '#FFD700' }]}>
            <Ionicons name="megaphone" size={14} color="#000" style={{ marginRight: 6 }} />
            <Text style={[styles.tagText, { color: '#000', fontWeight: 'bold' }]}>Sponsored</Text>
          </View>
        </View>
        <Text style={styles.cardDesc}>{item.description}</Text>
        <TouchableOpacity
          onPress={handleAdPress}
          style={[styles.refreshButton, { marginTop: 20, width: '100%', backgroundColor: '#fd297b' }]}
        >
          <Text style={styles.refreshButtonText}>LEARN MORE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

// Profile Card Component
const Card = React.memo(({ item, isTop }: { item: Proposal, isTop: boolean }) => {
  if (item.isAd) {
    return <AdCard item={item} />;
  }

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = item.images && item.images.length > 0 ? item.images : [item.image_url || 'https://placehold.co/600x800/png?text=Profile'];

  const isAdult = item.category === 'adult';
  const isSinglePhoto = images.length <= 1;
  const [isExpanded, setIsExpanded] = useState(false);

  // Find category details
  const categoryObj = CATEGORIES.find(c => c.id === item.category);

  const toggleExpand = () => {
    // Simple layout animation or state toggle
    setIsExpanded(!isExpanded);
  };

  const handleNext = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: images[currentImageIndex] }}
        style={styles.cardImage}
        contentFit="cover"
        transition={200}
      />



      {/* Navigation Touch Zones (Only active if isTop is true to avoid accidental clicks on back card) */}
      {isTop && images.length > 1 && (
        <>
          <Pressable style={styles.leftTouchZone} onPress={handlePrev} />
          <Pressable style={styles.rightTouchZone} onPress={handleNext} />
        </>
      )}

      {isAdult && (
        <BlurView intensity={30} style={StyleSheet.absoluteFill}>
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={48} color="#fff" />
          </View>
        </BlurView>
      )}

      {/* Top Gradient Blur using MaskedView */}
      <MaskedView
        style={styles.topBlurMask}
        maskElement={
          <LinearGradient
            colors={['black', 'transparent']}
            style={StyleSheet.absoluteFill}
            locations={[0.6, 1.0]} // Blur is solid at top 60%, then fades out to 100%
          />
        }
      >
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      </MaskedView>

      {/* Bottom Gradient Blur using MaskedView */}
      <MaskedView
        style={styles.bottomBlurMask}
        maskElement={
          <LinearGradient
            colors={['transparent', 'black']}
            style={StyleSheet.absoluteFill}
            locations={[0, 0.4]} // Fade in the blur over top 40% of the area
          />
        }
      >
        <BlurView
          intensity={80}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        {/* We need the content to be OUTSIDE the MaskedView if we don't want the content itself to be masked/faded.
            However, the user wants the "Transparency" (Blur) to be gradient.
            If we put content inside, it might get faded.
            Let's put the BlurView inside the MaskedView to create the "Gradient Blur Background".
            And render the content ON TOP of it in a separate View.
        */}
      </MaskedView>

      {/* Content Container - Rendered on top of the Gradient Blur */}
      <View style={[styles.cardContent, isExpanded && styles.cardContentExpanded]} pointerEvents="box-none">

        {/* Toggle Button for Single Photo Accordion */}
        {isSinglePhoto && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={toggleExpand}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name={isExpanded ? "chevron-down" : "chevron-up"} size={24} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Pagination Dots - Only if multiple images */}
        {!isSinglePhoto && images.length > 1 && (
          <View style={styles.paginationContainer}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationBar,
                  { backgroundColor: index === currentImageIndex ? '#fff' : 'rgba(255,255,255,0.5)' }
                ]}
              />
            ))}
          </View>
        )}

        <Animated.View layout={CurvedTransition} style={styles.titleRow}>
          <Text style={styles.cardTitle}>{item.title}</Text>
        </Animated.View>

        {/* Tags Row - Always visible */}
        <Animated.View layout={CurvedTransition} style={styles.tagsRow}>
          {categoryObj && (
            <View style={[styles.tag, { backgroundColor: categoryObj.color }]}>
              <Ionicons name={categoryObj.icon as any} size={14} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.tagText}>{categoryObj.label}</Text>
            </View>
          )}
        </Animated.View>

        {/* Detailed Description - Visible if multiple photos OR if expanded */}
        {(!isSinglePhoto || isExpanded) && (
          <Animated.View layout={CurvedTransition} style={{ marginTop: 10 }}>
            {(isExpanded || currentImageIndex === 0) && (
              <Text style={styles.cardDesc}>{item.description}</Text>
            )}

            {/* Meta details (Location, URL, Price) - Visible on 2nd page+ OR if Expanded */}
            {(isExpanded || (!isSinglePhoto && currentImageIndex > 0)) && (
              <Animated.View layout={CurvedTransition} style={styles.metaContainer}>
                {item.location && (
                  <View style={styles.metaRow}>
                    <Ionicons name="location" size={16} color="rgba(255,255,255,0.8)" style={styles.metaIcon} />
                    <Text style={styles.metaText}>{item.location}</Text>
                  </View>
                )}
                {item.price && (
                  <View style={styles.metaRow}>
                    <Ionicons name="cash" size={16} color="rgba(255,255,255,0.8)" style={styles.metaIcon} />
                    <Text style={styles.metaText}>{item.price}</Text>
                  </View>
                )}
                {item.url && (
                  <TouchableOpacity onPress={() => Linking.openURL(item.url!)}>
                    <View style={styles.metaRow}>
                      <Ionicons name="link" size={16} color="#24C6DC" style={styles.metaIcon} />
                      <Text style={[styles.metaText, { color: '#24C6DC', textDecorationLine: 'underline' }]} numberOfLines={1}>{item.url}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </Animated.View>
            )}
          </Animated.View>
        )}
      </View>
    </View>
  );
});

const SwipeableCard = React.memo(forwardRef(({ item, onSwipe, canLike, isActive, sharedX, sharedY }: { item: Proposal, onSwipe: (dir: 'left' | 'right' | 'up') => void, canLike: boolean, isActive: boolean, sharedX: any, sharedY: any }, ref) => {
  const localX = useSharedValue(0);
  const localY = useSharedValue(0);
  const rotation = useSharedValue(0);

  // Sync local values to global shared values ONLY if active
  // This drives the action button animations without affecting background cards
  useAnimatedReaction(
    () => ({ x: localX.value, y: localY.value }),
    (current) => {
      if (isActive) {
        sharedX.value = current.x;
        sharedY.value = current.y;
      }
    },
    [isActive]
  );

  // Expose swipe method via ref
  useImperativeHandle(ref, () => ({
    swipe: (direction: 'left' | 'right' | 'up') => {
      const duration = 400;
      if (direction === 'left') {
        localX.value = withTiming(-SCREEN_WIDTH * 1.8, { duration }, () => {
          runOnJS(onSwipe)('left');
          // Reset global values to 0 for next card's button drive
          sharedX.value = 0;
          sharedY.value = 0;
        });
        rotation.value = withTiming(-30, { duration });
      } else if (direction === 'right') {
        if (!canLike) {
          runOnJS(Alert.alert)('Limit', 'Come back tomorrow!');
          return;
        }
        localX.value = withTiming(SCREEN_WIDTH * 1.8, { duration }, () => {
          runOnJS(onSwipe)('right');
          sharedX.value = 0;
          sharedY.value = 0;
        });
        rotation.value = withTiming(30, { duration });
      } else if (direction === 'up') {
        localY.value = withTiming(-SCREEN_HEIGHT * 1.2, { duration }, () => {
          runOnJS(onSwipe)('up');
          sharedX.value = 0;
          sharedY.value = 0;
        });
      }
    }
  }));

  const gesture = Gesture.Pan()
    .enabled(isActive)
    .onUpdate((event) => {
      localX.value = event.translationX;
      localY.value = event.translationY;
      // Calculate rotation based on translation
      rotation.value = interpolate(
        event.translationX,
        [-SCREEN_WIDTH / 2, SCREEN_WIDTH / 2],
        [-10, 10],
        Extrapolate.CLAMP
      );
    })
    .onEnd((event) => {
      const swipeThreshold = SCREEN_WIDTH * 0.3;
      const velocityThreshold = 800;

      // Check for horizontal swipe
      if (event.translationX > swipeThreshold || event.velocityX > velocityThreshold) {
        // Swipe Right
        if (!canLike) {
          localX.value = withSpring(0);
          localY.value = withSpring(0);
          rotation.value = withSpring(0);
          runOnJS(Alert.alert)('Limit', 'Come back tomorrow!');
          return;
        }
        localX.value = withTiming(SCREEN_WIDTH * 1.8, { duration: 300 }, () => {
          runOnJS(onSwipe)('right');
          sharedX.value = 0;
          sharedY.value = 0;
        });
        rotation.value = withTiming(35, { duration: 300 });
      } else if (event.translationX < -swipeThreshold || event.velocityX < -velocityThreshold) {
        // Swipe Left
        localX.value = withTiming(-SCREEN_WIDTH * 1.8, { duration: 300 }, () => {
          runOnJS(onSwipe)('left');
          sharedX.value = 0;
          sharedY.value = 0;
        });
        rotation.value = withTiming(-35, { duration: 300 });
      } else if (event.translationY < -swipeThreshold || event.velocityY < -velocityThreshold) {
        // Swipe Up (Super Like)
        localY.value = withTiming(-SCREEN_HEIGHT * 1.2, { duration: 300 }, () => {
          runOnJS(onSwipe)('up');
          sharedX.value = 0;
          sharedY.value = 0;
        });
      } else {
        // Reset to center - use timing for a firm, non-bouncy return
        const resetDuration = 250;
        localX.value = withTiming(0, { duration: resetDuration });
        localY.value = withTiming(0, { duration: resetDuration });
        rotation.value = withTiming(0, { duration: resetDuration });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: localX.value },
      { translateY: localY.value },
      { rotate: `${rotation.value}deg` }
    ]
  }));

  // Overlay opacity styles
  // Overlay opacity styles with mutual exclusivity
  const likeStyle = useAnimatedStyle(() => {
    const isHorizontal = Math.abs(localX.value) > Math.abs(localY.value);
    return {
      opacity: (isActive && isHorizontal) ? interpolate(localX.value, [0, 80], [0, 1], Extrapolate.CLAMP) : 0
    };
  });
  const nopeStyle = useAnimatedStyle(() => {
    const isHorizontal = Math.abs(localX.value) > Math.abs(localY.value);
    return {
      opacity: (isActive && isHorizontal) ? interpolate(localX.value, [0, -80], [0, 1], Extrapolate.CLAMP) : 0
    };
  });
  const superLikeStyle = useAnimatedStyle(() => {
    const isVertical = Math.abs(localY.value) > Math.abs(localX.value);
    return {
      opacity: (isActive && isVertical) ? interpolate(localY.value, [0, -80], [0, 1], Extrapolate.CLAMP) : 0
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.cardWrapper, animatedStyle]}>
        <Card item={item} isTop={isActive} />

        {/* Swiping Stamps */}
        <Animated.View style={[styles.stampContainer, styles.likeStamp, likeStyle]}>
          <Image source={require('@/assets/images/like_stamp.png')} style={styles.stampImage} contentFit="contain" />
        </Animated.View>
        <Animated.View style={[styles.stampContainer, styles.nopeStamp, nopeStyle]}>
          <Image source={require('@/assets/images/nope_stamp.png')} style={styles.stampImage} contentFit="contain" />
        </Animated.View>
        <Animated.View style={[styles.stampContainer, styles.superLikeStamp, superLikeStyle]}>
          <Image source={require('@/assets/images/super_like_stamp.png')} style={styles.stampImage} contentFit="contain" />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}));

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Lighter gray instead of pure white
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // Base for empty/loading
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    marginTop: 0,
  },
  cardWrapper: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    zIndex: 10,
    top: 0, // Fixed top margin to avoid status bar
    left: (SCREEN_WIDTH - CARD_WIDTH) / 2,
  },
  card: {
    width: CARD_WIDTH,
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  cardBelow: {
    position: 'absolute',
    zIndex: 1,
    height: CARD_HEIGHT,
    top: 0, // Match front card top
    left: (SCREEN_WIDTH - CARD_WIDTH) / 2,
  },
  cardImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  topBlurMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100, // Top area blur
    zIndex: 10,
  },
  bottomBlurMask: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%', // Height of the blur area
    zIndex: 9,
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 110, // Default padding
    zIndex: 10,
  },
  cardContentExpanded: {
    paddingBottom: 40, // Reduced padding when expanded (scrolling might be needed but for now just fit)
    backgroundColor: 'rgba(0,0,0,0.6)', // Darker background when expanded
    top: '40%', // Take up more space
  },
  expandButton: {
    alignSelf: 'center',
    padding: 5,
    marginBottom: 5,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  metaContainer: {
    marginTop: 10,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaIcon: {
    width: 20,
    textAlign: 'center',
  },
  metaText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  cardAge: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'normal',
  },
  cardDesc: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tagText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Action Buttons Overlay
  actionButtonsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 50,
    // Allow touches to pass through empty spaces so swiping works
    pointerEvents: 'box-none',
  },
  circleButtonSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  circleButtonLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Stamps
  stampContainer: {
    position: 'absolute',
    top: '35%',
    // borderWidth: 4, // Removed border for Emoji
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 999,
  },
  stampEmoji: {
    fontSize: 80, // Large emoji size
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  stampImage: {
    width: 120,
    height: 120,
  },
  likeStamp: {
    left: 40,
    borderColor: '#4CD964',
    transform: [{ rotate: '-20deg' }],
  },
  nopeStamp: {
    right: 40,
    borderColor: '#EC5E6F',
    transform: [{ rotate: '20deg' }],
  },
  superLikeStamp: {
    bottom: 50,
    alignSelf: 'center',
    borderColor: '#24C6DC',
  },
  itemsText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CD964',
    letterSpacing: 2,
  },

  // Empty State
  radarContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  radarCircle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 100,
    backgroundColor: 'rgba(253, 41, 123, 0.1)',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    fontWeight: '500',
  },
  refreshButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#fd297b',
  },
  refreshButtonText: {
    color: '#fd297b',
    fontWeight: 'bold',
  },
  // Pagination
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center the dots
    marginBottom: 8, // Space above title
    gap: 6,
  },
  paginationBar: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  leftTouchZone: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '50%',
    height: '100%',
    zIndex: 90,
  },
  rightTouchZone: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '50%',
    height: '100%',
    zIndex: 90,
  },
  lockOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
