import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';

import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import RootNavigator from '../navigation/RootNavigator';
import { navigationRef } from '../navigation/navigationRef';
import { createStyles } from './app.style';

export default function AppContent() {
  const { initializeLanguage } = useLanguage();
  const { initializeTheme, isDark, theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    initializeTheme();
    initializeLanguage();
  }, [initializeLanguage, initializeTheme]);

  return (
    <View style={styles.app}>
      <View style={styles.content}>
        <NavigationContainer ref={navigationRef}>
          <RootNavigator />
        </NavigationContainer>
      </View>

      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}
