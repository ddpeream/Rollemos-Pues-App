import React, { useMemo } from 'react';

import { useTheme } from '../../../../hooks/useTheme';
import { createStyles } from './appHeaderActions.style';
import AppHeaderActionsUI from './AppHeaderActions.ui';

export default function AppHeaderActions({
  onLogout,
  showLanguageButton = true,
  showThemeButton = true,
  showUserMenu = false,
}) {
  const { isDark, theme, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <AppHeaderActionsUI
      isDark={isDark}
      onLogout={onLogout}
      onToggleTheme={toggleTheme}
      showLanguageButton={showLanguageButton}
      showThemeButton={showThemeButton}
      showUserMenu={showUserMenu}
      styles={styles}
      theme={theme}
    />
  );
}
