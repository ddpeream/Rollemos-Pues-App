import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGE_CODES } from './i18n.constants';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
};

const getDeviceLanguage = () => {
  const locale = Localization.getLocales?.()[0];
  const languageCode = locale?.languageCode || DEFAULT_LANGUAGE;

  return SUPPORTED_LANGUAGE_CODES.includes(languageCode)
    ? languageCode
    : DEFAULT_LANGUAGE;
};

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
