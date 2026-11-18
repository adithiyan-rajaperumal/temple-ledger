import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import taTranslations from './locales/ta.json';

const applyHtmlLang = (lang) => {
  if (typeof document !== 'undefined') {
    const validLang = lang === 'ta' ? 'ta' : 'en';
    document.documentElement.lang = validLang;
    document.documentElement.setAttribute('lang', validLang);
    if (document.body) {
      document.body.setAttribute('lang', validLang);
    }
  }
};

const getInitialLanguage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem('temple_ledger_lang');
    if (saved === 'ta' || saved === 'en') {
      return saved;
    }
  }
  return 'en';
};

const initialLang = getInitialLanguage();
applyHtmlLang(initialLang);

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      ta: { translation: taTranslations }
    },
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React safely escapes values by default
    }
  });

i18n.on('languageChanged', (lng) => {
  applyHtmlLang(lng);
});

export const changeLanguage = (lang) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('temple_ledger_lang', lang);
  }
  applyHtmlLang(lang);
  return i18n.changeLanguage(lang);
};

export default i18n;
