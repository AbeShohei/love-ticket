import Constants, { ExecutionEnvironment } from 'expo-constants';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

// Check if we are running in Expo Go or Web
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const isWeb = Platform.OS === 'web';
const isAdMobAvailable = !isExpoGo && !isWeb;

let BannerAd: any;
let BannerAdSize: any;
let TestIds: any;

if (isAdMobAvailable) {
    try {
        const lib = require('react-native-google-mobile-ads');
        BannerAd = lib.BannerAd;
        BannerAdSize = lib.BannerAdSize;
        TestIds = lib.TestIds;
    } catch (e) {
        console.warn('Failed to load react-native-google-mobile-ads:', e);
    }
}

export const BANNER_UNIT_ID = isAdMobAvailable && TestIds
    ? (__DEV__
        ? TestIds.BANNER
        : (Platform.OS === 'ios' ? 'ca-app-pub-7370584857233870/3713248096' : 'ca-app-pub-7370584857233870/3713248096'))
    : 'test-id';

export const BannerAdComponent: React.FC = () => {
    if (!isAdMobAvailable || !BannerAd) {
        if (__DEV__) {
            return (
                <View style={[styles.bannerContainer, { height: 50, backgroundColor: '#eee', borderStyle: 'dashed', borderWidth: 1 }]}>
                    <Text style={{ fontSize: 10, color: '#999' }}>AdMob Banner Placeholder (Expo Go/Web)</Text>
                </View>
            );
        }
        return null;
    }

    return (
        <View style={styles.bannerContainer}>
            <BannerAd
                unitId={BANNER_UNIT_ID}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                }}
                onAdFailedToLoad={(error: any) => console.log('Banner Ad Failed:', error)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    bannerContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        paddingVertical: 4,
    },
});
