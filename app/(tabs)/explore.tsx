import { BannerAdComponent } from '@/components/Ads';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES } from '../../constants/Presets';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = (SCREEN_WIDTH - 30) / 2;

export default function ExploreScreen() {
    const router = useRouter();

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

            {/* Gradient Text Overlay */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradientOverlay}
            >
                <Text style={styles.itemTitle}>{item.label}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );

    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Text style={styles.headerTitle}>カタログ</Text>
            <BannerAdComponent />
            <FlatList
                data={CATEGORIES}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                numColumns={2}
                contentContainerStyle={styles.list}
            />
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
        marginBottom: 20,
        color: '#333',
    },
    list: {
        paddingHorizontal: 10,
        paddingBottom: 100,
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
});
