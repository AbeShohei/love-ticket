import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
    onPress: () => void;
}

export function SubscriptionBanner({ onPress }: Props) {
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <LinearGradient
                colors={['#1a1a1a', '#2c3e50']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.leftContent}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>PREMIUM</Text>
                    </View>
                    <Text style={styles.title}>LoveTicket Premium</Text>
                    <Text style={styles.subtitle}>二人の絆を、もっと深めるために</Text>
                </View>

                <View style={styles.rightContent}>
                    <Image
                        source={require('../assets/images/icon.png')}
                        style={styles.buttonIcon}
                    />
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
        marginBottom: 32,
    },
    gradient: {
        flexDirection: 'row',
        padding: 20,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftContent: {
        flex: 1,
    },
    badge: {
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.5)',
    },
    badgeText: {
        color: '#FFD700',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
    },
    rightContent: {
        marginLeft: 12,
    },
    buttonIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
    },
});
