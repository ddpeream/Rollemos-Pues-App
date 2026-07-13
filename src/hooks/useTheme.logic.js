import { useEffect } from 'react';
import { StatusBar } from 'react-native';

import { useAppStore } from '../store/useAppStore';

export function useTheme() {
  const isDark = useAppStore((state) => state.isDark);
  const isThemeLoading = useAppStore((state) => state.isThemeLoading);
  const theme = useAppStore((state) => state.theme);
  const initializeTheme = useAppStore((state) => state.initializeTheme);
  const setTheme = useAppStore((state) => state.setTheme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);

  useEffect(() => {
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
  }, [isDark]);

  return {
    initializeTheme,
    isDark,
    isThemeLoading,
    setTheme,
    theme,
    toggleTheme,
  };
}

export default useTheme;
