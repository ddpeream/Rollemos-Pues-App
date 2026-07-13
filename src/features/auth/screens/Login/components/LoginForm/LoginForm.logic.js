import React, { useMemo } from 'react';

import { useTheme } from '../../../../../../hooks/useTheme';
import { createStyles } from './loginForm.style';
import LoginFormUI from './LoginForm.ui';

export default function LoginForm(props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return <LoginFormUI {...props} styles={styles} />;
}

