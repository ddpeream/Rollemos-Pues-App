import React, { useMemo } from 'react';

import { useTheme } from '../../../../../../hooks/useTheme';
import { createStyles } from './signupAvatarField.style';
import SignupAvatarFieldUI from './SignupAvatarField.ui';

export default function SignupAvatarField({ label }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return <SignupAvatarFieldUI label={label} styles={styles} theme={theme} />;
}
