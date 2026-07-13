import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '../../../../../../hooks/useLanguage';
import LanguageMenu from '../LanguageMenu/LanguageMenu';
import { createStyles } from './headerLanguageButton.style';
import HeaderLanguageButtonUI from './HeaderLanguageButton.ui';

export default function HeaderLanguageButton({ theme }) {
  const { t } = useTranslation();
  const { availableLanguages, currentLanguage, language, setLanguage } =
    useLanguage();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const openMenu = useCallback(() => {
    setIsMenuVisible(true);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuVisible(false);
  }, []);

  const handleSelectLanguage = useCallback(
    async (nextLanguage) => {
      await setLanguage(nextLanguage);
      closeMenu();
    },
    [closeMenu, setLanguage]
  );

  return (
    <>
      <HeaderLanguageButtonUI
        flag={currentLanguage.flag}
        onPress={openMenu}
        styles={styles}
      />
      <LanguageMenu
        currentLanguageCode={language}
        languages={availableLanguages}
        onClose={closeMenu}
        onSelectLanguage={handleSelectLanguage}
        t={t}
        theme={theme}
        visible={isMenuVisible}
      />
    </>
  );
}
