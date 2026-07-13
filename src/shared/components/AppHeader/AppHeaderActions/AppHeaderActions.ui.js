import React from 'react';
import { View } from 'react-native';

import HeaderLanguageButton from './components/HeaderLanguageButton/HeaderLanguageButton';
import HeaderThemeToggle from './components/HeaderThemeToggle/HeaderThemeToggle';
import HeaderUserMenuButton from './components/HeaderUserMenuButton/HeaderUserMenuButton';

export default function AppHeaderActionsUI({
  isDark,
  onLogout,
  onToggleTheme,
  showLanguageButton,
  showThemeButton,
  showUserMenu,
  styles,
  theme,
}) {
  return (
    <View pointerEvents="box-none" style={styles.container}>
      {showThemeButton && (
        <HeaderThemeToggle
          isDark={isDark}
          onPress={onToggleTheme}
          theme={theme}
        />
      )}
      {showLanguageButton && <HeaderLanguageButton theme={theme} />}
      {showUserMenu && (
        <HeaderUserMenuButton onLogout={onLogout} theme={theme} />
      )}
    </View>
  );
}
