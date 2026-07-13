import React, { useMemo } from 'react';

import { useTheme } from '../../../../hooks/useTheme';
import { createStyles } from './authTextField.style';
import AuthTextFieldUI from './AuthTextField.ui';

export default function AuthTextField(props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return <AuthTextFieldUI {...props} styles={styles} theme={theme} />;
}

