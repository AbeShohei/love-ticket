// Stub module for react-native-google-mobile-ads on web
// This prevents Metro from trying to load native-only modules on web platform

export const BannerAd = () => null;
export const BannerAdSize = {
    BANNER: 'BANNER',
    ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
};
export const TestIds = {
    BANNER: 'test-banner',
};
export const MaxAdContentRating = {
    G: 'G',
};

const mobileAds = () => ({
    initialize: async () => { },
    setRequestConfiguration: async () => { },
});

export default mobileAds;
