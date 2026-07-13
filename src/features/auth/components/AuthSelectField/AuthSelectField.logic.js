import React, { useMemo } from 'react';

import { useTheme } from '../../../../hooks/useTheme';
import { createStyles } from './authSelectField.style';
import AuthSelectFieldUI from './AuthSelectField.ui';

const getSelectedLabel = (items, selectedId) => (
  items.find((item) => item.id === selectedId)?.label || selectedId
);

export default function AuthSelectField({ options, selectedId, ...props }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <AuthSelectFieldUI
      {...props}
      selectedLabel={getSelectedLabel(options, selectedId)}
      styles={styles}
      theme={theme}
    />
  );
}

