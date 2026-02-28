import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ja from './locales/ja.json';
import en from './locales/en.json';

const resources = {
  ja: { translation: ja },
  en: { translation: en },
};

// Default to Japanese - the I18nProvider will detect the device language
// and update i18n after the native modules are properly initialized
const defaultLanguage = 'ja';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLanguage,
    fallbackLng: 'ja',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'ja', name: '日本語', nativeName: 'Japanese' },
  { code: 'en', name: 'English', nativeName: 'English' },
] as const;

export type LanguageCode = 'ja' | 'en';
