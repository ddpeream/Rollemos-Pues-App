import React, { useMemo } from 'react';

import { useTheme } from '../../../../../../hooks/useTheme';
import { createStyles } from './signupForm.style';
import SignupFormUI from './SignupForm.ui';

export default function SignupForm(props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return <SignupFormUI {...props} styles={styles} />;
}

