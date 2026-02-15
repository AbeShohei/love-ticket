import { BannerAdComponent } from '@/components/Ads';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;

const PROMO_ITEMS = [
    {
        id: 'gold',
        title: 'Tinder Gold',
        desc: 'See who likes you & more!',
        colors: ['#e5c06e', '#b8860b'] as const,
        icon: 'star',
        iconColor: '#fff',
    },
    {
        id: 'platinum',
        title: 'Tinder Platinum',
        desc: 'Priority likes & more!',
        colors: ['#333', '#000'] as const,
        icon: 'flash',
        iconColor: '#fff',
    },
    {
        id: 'plus',
        title: 'Tinder Plus',
        desc: 'Unlimited likes & rewinds!',
        colors: ['#ff655b', '#fd297b'] as const,
        icon: 'add-circle',
        iconColor: '#fff',
    },
];

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                {/* Profile Header */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarBorder}>
                            <Image
                                source={{ uri: 'https://placehold.co/400x400' }}
                                style={styles.avatar}
                                contentFit="cover"
                            />
                        </View>
                        <View style={styles.completionBadge}>
                            <Text style={styles.completionText}>50% COMPLETE</Text>
                        </View>
                    </View>
                    <Text style={styles.name}>Shoko, 24</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionBtnContainer} onPress={handlePress}>
                        <View style={styles.glassBtnSmall}>
                            <Ionicons name="settings-sharp" size={24} color="#7c8591" />
                        </View>
                        <Text style={styles.actionLabel}>SETTINGS</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtnContainer} onPress={handlePress}>
                        <LinearGradient
                            colors={['#fd297b', '#ff655b']}
                            style={styles.mainActionBtn}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                        >
                            <MaterialCommunityIcons name="pencil" size={32} color="#fff" />
                            <View style={styles.shine} />
                        </LinearGradient>
                        <Text style={styles.actionLabel}>EDIT INFO</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtnContainer} onPress={handlePress}>
                        <View style={styles.glassBtnSmall}>
                            <Ionicons name="shield-checkmark" size={24} color="#7c8591" />
                        </View>
                        <Text style={styles.actionLabel}>SAFETY</Text>
                    </TouchableOpacity>
                </View>

                {/* Promo Carousel */}
                <View style={styles.carouselContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.carouselContent}
                        decelerationRate="fast"
                        snapToInterval={SCREEN_WIDTH * 0.85}
                    >
                        {PROMO_ITEMS.map((item) => (
                            <TouchableOpacity key={item.id} activeOpacity={0.9} onPress={handlePress}>
                                <LinearGradient
                                    colors={item.colors}
                                    style={styles.promoCard}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={styles.promoIconContainer}>
                                        <Ionicons name={item.icon as any} size={32} color={item.iconColor} />
                                    </View>
                                    <View style={styles.promoTextContainer}>
                                        <Text style={styles.promoTitle}>{item.title}</Text>
                                        <Text style={styles.promoDesc}>{item.desc}</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Menu List */}
                <View style={styles.menuContainer}>
                    <Text style={styles.menuTitle}>Account Settings</Text>
                    {['Get Verified', 'Manage Account', 'Restore Purchases'].map((item, index) => (
                        <TouchableOpacity key={index} style={styles.menuItem} onPress={handlePress}>
                            <Text style={styles.menuItemText}>{item}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>
                    ))}
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f6f7fb',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    bannerContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarContainer: {
        marginBottom: 15,
        position: 'relative',
    },
    avatarBorder: {
        width: 160,
        height: 160,
        borderRadius: 80,
        padding: 5,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 80,
        backgroundColor: '#e1e1e1',
    },
    completionBadge: {
        position: 'absolute',
        bottom: -10,
        alignSelf: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    completionText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#666',
    },
    name: {
        fontSize: 28,
        fontWeight: '700',
        color: '#222',
        marginTop: 10,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginBottom: 40,
        paddingHorizontal: 20,
        gap: 25,
    },
    actionBtnContainer: {
        alignItems: 'center',
    },
    glassBtnSmall: {
        width: 55,
        height: 55,
        borderRadius: 27.5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        marginBottom: 8,
    },
    mainActionBtn: {
        width: 75,
        height: 75,
        borderRadius: 37.5,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ff655b',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
        marginBottom: 8,
        position: 'relative',
        overflow: 'hidden',
    },
    shine: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 50,
        height: 50,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 25,
        transform: [{ scale: 1.5 }],
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8e9aaf',
        letterSpacing: 0.5,
    },
    carouselContainer: {
        height: 140,
        marginBottom: 30,
    },
    carouselContent: {
        paddingHorizontal: 15,
    },
    promoCard: {
        width: SCREEN_WIDTH * 0.8,
        height: 120,
        borderRadius: 16,
        marginRight: 15,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    promoIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    promoTextContainer: {
        flex: 1,
    },
    promoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    promoDesc: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
    },
    menuContainer: {
        paddingHorizontal: 20,
    },
    menuTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 15,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 18,
        marginBottom: 1,
        borderRadius: 0, // Flat list style
    },
    menuItemText: {
        fontSize: 16,
        color: '#444',
    },
});
