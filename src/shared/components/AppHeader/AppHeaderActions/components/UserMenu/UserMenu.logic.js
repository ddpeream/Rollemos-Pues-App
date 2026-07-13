import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { USER_MENU_ITEMS } from '../../../appHeader.constants';
import { createStyles } from './userMenu.style';
import UserMenuUI from './UserMenu.ui';

export default function UserMenu({ onClose, onLogout, theme, visible }) {
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <UserMenuUI
      items={USER_MENU_ITEMS}
      onClose={onClose}
      onLogout={onLogout}
      styles={styles}
      t={t}
      theme={theme}
      visible={visible}
    />
  );
}
