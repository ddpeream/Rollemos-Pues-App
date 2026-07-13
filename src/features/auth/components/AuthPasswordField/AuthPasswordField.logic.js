import React, { useMemo } from 'react';

import { useTheme } from '../../../../hooks/useTheme';
import { createStyles } from './authPasswordField.style';
import AuthPasswordFieldUI from './AuthPasswordField.ui';

export default function AuthPasswordField(props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return <AuthPasswordFieldUI {...props} styles={styles} theme={theme} />;
}

