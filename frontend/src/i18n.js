import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import taTranslations from './locales/ta.json';

const getInitialLanguage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem('temple_ledger_lang');
    if (saved === 'ta' || saved === 'en') {
      return saved;
    }
  }
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      ta: { translation: taTranslations }
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React safely escapes values by default
    }
  });

export const changeLanguage = (lang) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('temple_ledger_lang', lang);
  }
  return i18n.changeLanguage(lang);
};

export default i18n;
