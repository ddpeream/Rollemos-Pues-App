import React, { useMemo } from 'react';

import { useTheme } from '../../../../../../hooks/useTheme';
import { createStyles } from './authSocialButtons.style';
import AuthSocialButtonsUI from './AuthSocialButtons.ui';

export default function AuthSocialButtons() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return <AuthSocialButtonsUI styles={styles} theme={theme} />;
}

