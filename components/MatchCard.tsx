import { CATEGORIES } from '@/constants/Presets';
import { Match } from '@/stores/matchStore';
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type MatchCardProps = {
    item: Match;
    onPress: () => void;
    compact?: boolean;
};

export const MatchCard = ({ item, onPress, compact }: MatchCardProps) => {
    return (
        <TouchableOpacity style={[styles.cardContainer, compact && { height: 160, marginBottom: 0 }]} onPress={onPress}>
            {/* 1. Full Background Image */}
            <Image source={{ uri: item.image }} style={styles.cardImage} contentFit="cover" />

            {/* Top Left Stamp */}
            <Image
                source={(() => {
                    if (item.type === 'star') return require('@/assets/images/super_like_stamp.png');
                    if (item.type === 'love' || item.type === 'right' as any) return require('@/assets/images/like_stamp.png');
                    return require('@/assets/images/nope_stamp.png');
                })()}
                style={styles.topLeftStamp}
                contentFit="contain"
            />

            {/* 2. Gradient Blur Overlay (Right Side) */}
            <View style={styles.cardContentRow}>
                {/* Left Spacer (Transparent) */}
                <View style={styles.leftSpacer} />

                {/* Right: Gradient Masked Blur */}
                <MaskedView
                    style={styles.rightBlurContainer}
                    maskElement={
                        <LinearGradient
                            colors={['transparent', 'black']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0.5, y: 0 }} // Fade in over 50% of width
                            style={StyleSheet.absoluteFill}
                        />
                    }
                >
                    <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
                </MaskedView>

                {/* Content laid over the Blur (No Mask on Content) */}
                <View style={[styles.detailsOverlay, compact && { paddingLeft: 60 }]}>
                    <View style={styles.headerRow}>
                        <Text style={[styles.nameText, compact && { fontSize: 14 }]} numberOfLines={1}>{item.name}</Text>
                    </View>

                    <View style={styles.metaContainer}>
                        <View style={styles.metaRow}>
                            <Ionicons name="location-sharp" size={12} color="rgba(255,255,255,0.7)" />
                            <Text style={styles.metaText} numberOfLines={1}>{item.location || 'Tokyo, JP'}</Text>
                        </View>
                        {item.price && (
                            <View style={[styles.metaRow, compact && { display: 'none' }]}>
                                <Ionicons name="cash-outline" size={12} color="rgba(255,255,255,0.7)" />
                                <Text style={styles.metaText} numberOfLines={1}>{item.price}</Text>
                            </View>
                        )}
                    </View>

                    <Text style={[styles.bioText, compact && { display: 'none' }]} numberOfLines={2}>
                        {item.bio || 'Recently matched! Start a conversation.'}
                    </Text>

                    {item.url && !compact && (
                        <TouchableOpacity onPress={() => Linking.openURL(item.url!)} style={styles.linkRow}>
                            <Ionicons name="link" size={12} color="#4CD964" />
                            <Text style={styles.linkText} numberOfLines={1}>{item.url}</Text>
                        </TouchableOpacity>
                    )}

                    {(item.tags && item.tags.length > 0) && (
                        <View style={styles.tagsContainer}>
                            {item.tags.slice(0, compact ? 1 : undefined).map((tag, index) => {
                                const cat = CATEGORIES.find(c => c.id === tag || c.label === tag);
                                return (
                                    <View key={index} style={[styles.tagBadge, cat && { backgroundColor: cat.color, borderColor: cat.color }]}>
                                        {cat && <Ionicons name={cat.icon as any} size={10} color="#fff" style={{ marginRight: 4 }} />}
                                        <Text style={styles.tagText}>{cat ? cat.label : tag}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
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
});
