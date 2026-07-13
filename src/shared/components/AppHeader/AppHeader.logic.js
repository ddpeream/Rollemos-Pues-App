import React, { useMemo } from 'react';

import { useTheme } from '../../../hooks/useTheme';
import AppHeaderActions from './AppHeaderActions/AppHeaderActions';
import { createStyles } from './appHeader.style';
import AppHeaderUI from './AppHeader.ui';

export default function AppHeader({
  onLogout,
  showLanguageButton = true,
  showThemeButton = true,
  showUserMenu = false,
  transparent = false,
}) {
  const { theme } = useTheme();
  const styles = useMemo(
    () => createStyles(theme, { transparent }),
    [theme, transparent]
  );

  return (
    <AppHeaderUI styles={styles}>
      <AppHeaderActions
        onLogout={onLogout}
        showLanguageButton={showLanguageButton}
        showThemeButton={showThemeButton}
        showUserMenu={showUserMenu}
      />
    </AppHeaderUI>
  );
}
