import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { LocaleConfig } from 'react-native-calendars';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from './AuthProvider';
import i18n, { LanguageCode, SUPPORTED_LANGUAGES } from '@/i18n';

type I18nContextType = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  isLoading: boolean;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
};

const I18nContext = createContext<I18nContextType>({
  language: 'ja',
  setLanguage: async () => {},
  isLoading: true,
  supportedLanguages: SUPPORTED_LANGUAGES,
});

export const useI18n = () => useContext(I18nContext);

// Configure calendar locales - must be called before any calendar component renders
const setupCalendarLocale = (lang: LanguageCode) => {
  // Japanese locale
  LocaleConfig.locales['ja'] = {
    monthNames: [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ],
    monthNamesShort: [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ],
    dayNames: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
    dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'],
    today: '今日',
    numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  };

  // English locale (ensure it exists)
  LocaleConfig.locales['en'] = {
    monthNames: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    monthNamesShort: [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ],
    dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    today: 'Today',
    numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  };

  LocaleConfig.defaultLocale = lang === 'ja' ? 'ja' : 'en';
};

// Initialize calendar locales immediately when module loads
// This ensures locales are available before any calendar component renders
setupCalendarLocale('ja');

// Get device language - simple fallback approach
// Note: expo-localization requires native rebuild, so we use a simpler approach
const getDeviceLanguage = (): LanguageCode => {
  // Check if running on web with navigator available
  if (typeof navigator !== 'undefined' && navigator.language) {
    const browserLang = navigator.language.split('-')[0];
    return ['ja', 'en'].includes(browserLang) ? (browserLang as LanguageCode) : 'ja';
  }

  // For native platforms without expo-localization linked, default to Japanese
  // Users can change language in settings, which is saved to their profile
  return 'ja';
};

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, profile, isLoading: authLoading } = useAuth();
  const [language, setLanguageState] = useState<LanguageCode>('ja');
  const [isInitialized, setIsInitialized] = useState(false);

  // Only query Convex when user is signed in and profile is available
  const userData = useQuery(
    api.users.getById,
    isSignedIn && profile?._id ? { id: profile._id } : 'skip'
  );

  const updateLanguageMutation = useMutation(api.users.updateLanguage);

  // Initialize language from user preference or device
  useEffect(() => {
    const initLanguage = async () => {
      // Wait for auth to finish loading
      if (authLoading) return;

      let targetLang: LanguageCode = getDeviceLanguage();

      if (userData?.language) {
        // Use saved preference from Convex
        targetLang = userData.language as LanguageCode;
      }

      // Update i18n and calendar
      await i18n.changeLanguage(targetLang);
      setupCalendarLocale(targetLang);
      setLanguageState(targetLang);
      setIsInitialized(true);
    };

    initLanguage();
  }, [userData?.language, authLoading]);

  // Set language and save to Convex
  const setLanguage = useCallback(async (lang: LanguageCode) => {
    // Update i18n immediately for responsive UI
    await i18n.changeLanguage(lang);
    setupCalendarLocale(lang);
    setLanguageState(lang);

    // Save to Convex if signed in (non-blocking, graceful failure)
    if (profile?._id) {
      try {
        await updateLanguageMutation({
          language: lang,
          userId: profile._id,
        });
      } catch (error) {
        // Log but don't throw - language change in UI is already successful
        console.warn('Could not save language preference to server:', error);
      }
    }
  }, [profile?._id, updateLanguageMutation]);

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        isLoading: !isInitialized,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};
