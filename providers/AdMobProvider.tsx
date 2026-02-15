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

export const AdMobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const init = async () => {
            if (!isAdMobAvailable) {
                console.log('AdMob is not available in this environment (Expo Go or Web). Skipping initialization.');
                return;
            }

            try {
                // Dynamic import/require to avoid top-level crash
                const mobileAds = require('react-native-google-mobile-ads').default;
                const { MaxAdContentRating } = require('react-native-google-mobile-ads');

                // Configure global settings
                await mobileAds().setRequestConfiguration({
                    maxAdContentRating: MaxAdContentRating.G,
                    tagForChildDirectedTreatment: true,
                    tagForUnderAgeOfConsent: true,
                    testDeviceIdentifiers: ['EMULATOR'],
                });

                // Initialize AdMob
                const adapterStatuses = await mobileAds().initialize();
                console.log('AdMob Initialized:', adapterStatuses);
                setIsInitialized(true);
            } catch (error) {
                console.error('AdMob Initialization Error:', error);
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
