import React, { useMemo } from 'react';

import { createStyles } from './languageMenu.style';
import LanguageMenuUI from './LanguageMenu.ui';

export default function LanguageMenu({
  currentLanguageCode,
  languages,
  onClose,
  onSelectLanguage,
  theme,
  t,
  visible,
}) {
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <LanguageMenuUI
      currentLanguageCode={currentLanguageCode}
      languages={languages}
      onClose={onClose}
      onSelectLanguage={onSelectLanguage}
      styles={styles}
      t={t}
      visible={visible}
    />
  );
}
