import Constants, { ExecutionEnvironment } from 'expo-constants';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface AdMobContextType {
    isInitialized: boolean;
}

const AdMobContext = createContext<AdMobContextType>({
    isInitialized: false,
});

export const useAdMob = () => useContext(AdMobContext);

// Check if we are running in Expo Go
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const isWeb = Platform.OS === 'web';
const isAdMobAvailable = !isExpoGo && !isWeb;

// テストデバイスIDをここに追加
// ログに表示される "To get test ads on this device, set: ..." からIDをコピー
const TEST_DEVICE_IDS: string[] = [
    'EMULATOR',  // Androidエミュレータ
    // 実機のテストデバイスIDを追加（複数可）
    // 'YOUR_IOS_DEVICE_ID',
    // 'YOUR_ANDROID_DEVICE_ID',
];

export const AdMobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const init = async () => {
            if (!isAdMobAvailable) {
                console.log('AdMob: Not available (Expo Go or Web)');
                return;
            }

            try {
                // Dynamic import/require to avoid top-level crash
                const mobileAds = require('react-native-google-mobile-ads').default;
                const { MaxAdContentRating } = require('react-native-google-mobile-ads');

                // 開発モードではテストデバイスを設定
                const testDevices = __DEV__ ? TEST_DEVICE_IDS : [];

                // Configure global settings
                await mobileAds().setRequestConfiguration({
                    maxAdContentRating: MaxAdContentRating.G,
                    tagForChildDirectedTreatment: false,
                    tagForUnderAgeOfConsent: false,
                    testDeviceIdentifiers: testDevices,
                });

                console.log('AdMob: Test devices configured:', testDevices);

                // Initialize AdMob
                const adapterStatuses = await mobileAds().initialize();
                console.log('AdMob: Initialized successfully');
                setIsInitialized(true);
            } catch (error) {
                console.error('AdMob: Initialization Error:', error);
            }
        };

        init();
    }, []);

    return (
        <AdMobContext.Provider value={{ isInitialized }}>
            {children}
        </AdMobContext.Provider>
    );
};
