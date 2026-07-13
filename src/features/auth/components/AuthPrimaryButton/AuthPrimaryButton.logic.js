import React, { useMemo } from 'react';

import { useTheme } from '../../../../hooks/useTheme';
import { createStyles } from './authPrimaryButton.style';
import AuthPrimaryButtonUI from './AuthPrimaryButton.ui';

export default function AuthPrimaryButton(props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return <AuthPrimaryButtonUI {...props} styles={styles} theme={theme} />;
}

