import React, { useMemo } from 'react';

import { useTheme } from '../../../../hooks/useTheme';
import { createStyles } from './authFeedbackMessage.style';
import AuthFeedbackMessageUI from './AuthFeedbackMessage.ui';

export default function AuthFeedbackMessage(props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!props.message) return null;

  return <AuthFeedbackMessageUI {...props} styles={styles} />;
}

