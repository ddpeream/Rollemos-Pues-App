import { useMemo } from 'react';

import { SUPPORTED_LANGUAGES } from '../i18n/i18n.constants';
import { useAppStore } from '../store/useAppStore';

export function useLanguage() {
  const language = useAppStore((state) => state.language);
  const initializeLanguage = useAppStore((state) => state.initializeLanguage);
  const isLanguageLoading = useAppStore((state) => state.isLanguageLoading);
  const setLanguage = useAppStore((state) => state.setLanguage);

  const currentLanguage = useMemo(
    () =>
      SUPPORTED_LANGUAGES.find((item) => item.code === language) ||
      SUPPORTED_LANGUAGES[0],
    [language]
  );

  return {
    availableLanguages: SUPPORTED_LANGUAGES,
    currentLanguage,
    initializeLanguage,
    isLanguageLoading,
    language,
    setLanguage,
  };
}

export default useLanguage;
