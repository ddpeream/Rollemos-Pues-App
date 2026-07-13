import React, { useMemo } from 'react';

import { useTheme } from '../../../../hooks/useTheme';
import { createStyles } from './authScreenIntro.style';
import AuthScreenIntroUI from './AuthScreenIntro.ui';

export default function AuthScreenIntro(props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return <AuthScreenIntroUI {...props} styles={styles} theme={theme} />;
}
