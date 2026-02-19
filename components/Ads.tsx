import Constants, { ExecutionEnvironment } from 'expo-constants';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

// Check if we are running in Expo Go or Web
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const isWeb = Platform.OS === 'web';
const isAdMobAvailable = !isExpoGo && !isWeb;

let BannerAd: any;
let BannerAdSize: any;
let TestIds: any;
let mobileAds: any;

if (isAdMobAvailable) {
    try {
        const lib = require('react-native-google-mobile-ads');
        BannerAd = lib.BannerAd;
        BannerAdSize = lib.BannerAdSize;
        TestIds = lib.TestIds;
        mobileAds = lib.mobileAds;
    } catch (e) {
        console.warn('Failed to load react-native-google-mobile-ads:', e);
    }
}

// テストデバイスIDをここに追加（ログから取得）
// 例: ['ABC123DEF456', 'GHI789JKL012']
const TEST_DEVICE_IDS: string[] = [
    // ここにテストデバイスIDを追加
    // 'YOUR_TEST_DEVICE_ID_HERE',
];

// 本番用広告ユニットID
const PROD_BANNER_ID = Platform.OS === 'ios'
    ? 'ca-app-pub-7370584857233870/3713248096'
    : 'ca-app-pub-7370584857233870/3713248096';

export const BANNER_UNIT_ID = __DEV__ && TestIds
    ? TestIds.BANNER
    : PROD_BANNER_ID;

// AdMob初期化
export const initializeAdMob = async () => {
    if (!isAdMobAvailable || !mobileAds) return;

    try {
        // テストデバイスを設定
        if (__DEV__ && TEST_DEVICE_IDS.length > 0) {
            await mobileAds().setRequestConfiguration({
                testDeviceIdentifiers: TEST_DEVICE_IDS,
                maxAdContentRating: 'G',
                tagForChildDirectedTreatment: false,
            });
            console.log('AdMob: Test devices configured');
        }

        // AdMobを初期化
        await mobileAds().initialize();
        console.log('AdMob: Initialized successfully');
    } catch (error) {
        console.warn('AdMob initialization error:', error);
    }
};

export const BannerAdComponent: React.FC = () => {
    useEffect(() => {
        initializeAdMob();
    }, []);

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
                    requestNonPersonalizedAdsOnly: __DEV__,
                }}
                onAdLoaded={() => console.log('Banner Ad Loaded')}
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
