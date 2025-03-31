import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en.json';
import viTranslation from './locales/vi.json';

// Initialize i18next
i18n
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next
  .use(initReactI18next)
  // init i18next
  .init({
    debug: process.env.NODE_ENV === 'development', // Turn on debug mode in development
    resources: {
      en: {
        translation: enTranslation
      },
      vi: {
        translation: viTranslation
      }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // not needed for react as it escapes by default
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage']
    }
  });

export default i18n; 