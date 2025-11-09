import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

const ThemeContext = createContext();

export const lightTheme = {
  colors: {
    primary: '#4DD7D0',
    secondary: '#D26BFF',
    background: {
      primary: '#F7F9FB',
      surface: 'rgba(0, 0, 0, 0.04)',
      surface2: 'rgba(0, 0, 0, 0.08)',
    },
    text: {
      primary: '#101418',
      secondary: '#495469',
      muted: '#495469',
    },
    glass: {
      background: 'rgba(0, 0, 0, 0.04)',
      border: 'rgba(0, 0, 0, 0.08)',
      backdrop: 'rgba(0, 0, 0, 0.08)',
    },
    tabs: {
      active: '#E91E63',
      inactive: '#808080',
    },
    gradients: {
      primary: ['#4DD7D0', '#2bbdb5'],
      secondary: ['#D26BFF', '#b856e6'],
      primarySecondary: ['#4DD7D0', '#D26BFF'],
      overlay: ['rgba(11, 15, 20, 0)', 'rgba(11, 15, 20, 0.6)'],
    },
    states: {
      hover: 'rgba(77, 215, 208, 0.1)',
      focus: 'rgba(77, 215, 208, 0.2)',
      active: 'rgba(77, 215, 208, 0.3)',
    },
    alpha: {
      primary15: 'rgba(77, 215, 208, 0.15)',
      black04: 'rgba(0, 0, 0, 0.04)',
      black06: 'rgba(0, 0, 0, 0.06)',
      black08: 'rgba(0, 0, 0, 0.08)',
      black10: 'rgba(0, 0, 0, 0.1)',
      black12: 'rgba(0, 0, 0, 0.12)',
      black15: 'rgba(0, 0, 0, 0.15)',
      black20: 'rgba(0, 0, 0, 0.2)',
      black30: 'rgba(0, 0, 0, 0.3)',
      black40: 'rgba(0, 0, 0, 0.4)',
      black50: 'rgba(0, 0, 0, 0.5)',
      black60: 'rgba(0, 0, 0, 0.6)',
      black70: 'rgba(0, 0, 0, 0.7)',
      black80: 'rgba(0, 0, 0, 0.8)',
    },
  },
  shadows: {
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 30,
      elevation: 4,
    },
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 3,
    },
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 3,
    },
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
  },
};

export const darkTheme = {
  colors: {
    primary: '#4DD7D0',
    secondary: '#D26BFF',
    background: {
      primary: '#0B0F14',
      surface: 'rgba(255, 255, 255, 0.06)',
      surface2: 'rgba(255, 255, 255, 0.1)',
    },
    text: {
      primary: '#E6EEF5',
      secondary: '#A8B3BE',
      muted: '#A8B3BE',
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.06)',
      border: 'rgba(255, 255, 255, 0.08)',
      backdrop: 'rgba(255, 255, 255, 0.1)',
    },
    tabs: {
      active: '#E91E63',
      inactive: '#808080',
    },
    gradients: {
      primary: ['#4DD7D0', '#2bbdb5'],
      secondary: ['#D26BFF', '#b856e6'],
      primarySecondary: ['#4DD7D0', '#D26BFF'],
      overlay: ['rgba(11, 15, 20, 0)', 'rgba(11, 15, 20, 0.6)'],
    },
    states: {
      hover: 'rgba(77, 215, 208, 0.1)',
      focus: 'rgba(77, 215, 208, 0.2)',
      active: 'rgba(77, 215, 208, 0.3)',
    },
    alpha: {
      primary15: 'rgba(77, 215, 208, 0.15)',
      white06: 'rgba(255, 255, 255, 0.06)',
      white08: 'rgba(255, 255, 255, 0.08)',
      white10: 'rgba(255, 255, 255, 0.1)',
      white12: 'rgba(255, 255, 255, 0.12)',
      white15: 'rgba(255, 255, 255, 0.15)',
      white20: 'rgba(255, 255, 255, 0.2)',
      white30: 'rgba(255, 255, 255, 0.3)',
      white40: 'rgba(255, 255, 255, 0.4)',
      white50: 'rgba(255, 255, 255, 0.5)',
      white60: 'rgba(255, 255, 255, 0.6)',
      white70: 'rgba(255, 255, 255, 0.7)',
      white80: 'rgba(255, 255, 255, 0.8)',
    },
  },
  shadows: {
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.35,
      shadowRadius: 30,
      elevation: 8,
    },
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 4,
    },
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 3,
    },
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
  },
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@theme');
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark');
      } else {
        // Si no hay tema guardado, usar el tema del sistema
        const systemTheme = Appearance.getColorScheme();
        setIsDark(systemTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem('@theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
