import React, { useMemo } from 'react';

import { createStyles } from './headerThemeToggle.style';
import HeaderThemeToggleUI from './HeaderThemeToggle.ui';

export default function HeaderThemeToggle({ isDark, onPress, theme }) {
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <HeaderThemeToggleUI
      isDark={isDark}
      onPress={onPress}
      styles={styles}
      theme={theme}
    />
  );
}
