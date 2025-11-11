import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import useAppStore from '../store/useAppStore';

/**
 * Hook personalizado para manejar el tema de la aplicación
 * Sincroniza el tema con la StatusBar y provee utilidades
 */
const useTheme = () => {
  const { isDark, theme, toggleTheme } = useAppStore();

  // Sincronizar StatusBar con el tema
  useEffect(() => {
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
  }, [isDark]);

  return {
    isDark,
    theme,
    toggleTheme,
    colors: theme.colors,
    spacing: theme.spacing,
    typography: theme.typography,
  };
};

export default useTheme;
