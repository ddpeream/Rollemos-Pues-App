import React, { useMemo } from 'react';

import { useTheme } from '../../../../hooks/useTheme';
import { createStyles } from './authOptionModal.style';
import AuthOptionModalUI from './AuthOptionModal.ui';

export default function AuthOptionModal(props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return <AuthOptionModalUI {...props} styles={styles} />;
}

