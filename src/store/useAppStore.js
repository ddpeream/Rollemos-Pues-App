import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { create } from 'zustand';

import i18n from '../i18n';
import { createTheme } from '../theme';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGE_CODES } from '../i18n/i18n.constants';

const THEME_STORAGE_KEY = '@theme';
const LANGUAGE_STORAGE_KEY = '@language';

const getSystemIsDark = () => Appearance.getColorScheme() === 'dark';

const getSafeLanguage = (language) =>
  SUPPORTED_LANGUAGE_CODES.includes(language) ? language : DEFAULT_LANGUAGE;

export const useAppStore = create((set, get) => ({
  isDark: true,
  isThemeLoading: true,
  theme: createTheme(true),
  language: getSafeLanguage(i18n.language),
  isLanguageLoading: true,

  initializeTheme: async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      const isDark = savedTheme ? savedTheme === 'dark' : getSystemIsDark();

      set({
        isDark,
        isThemeLoading: false,
        theme: createTheme(isDark),
      });
    } catch (error) {
      set({
        isDark: get().isDark,
        isThemeLoading: false,
        theme: createTheme(get().isDark),
      });
    }
  },

  setTheme: async (isDark) => {
    set({
      isDark,
      theme: createTheme(isDark),
    });

    await AsyncStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
  },

  toggleTheme: async () => {
    await get().setTheme(!get().isDark);
  },

  initializeLanguage: async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      const language = getSafeLanguage(savedLanguage || i18n.language);

      await i18n.changeLanguage(language);

      set({
        language,
        isLanguageLoading: false,
      });
    } catch (error) {
      const language = getSafeLanguage(get().language);

      set({
        language,
        isLanguageLoading: false,
      });
    }
  },

  setLanguage: async (language) => {
    const nextLanguage = getSafeLanguage(language);

    set({ language: nextLanguage });
    await i18n.changeLanguage(nextLanguage);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  },
}));

export default useAppStore;
