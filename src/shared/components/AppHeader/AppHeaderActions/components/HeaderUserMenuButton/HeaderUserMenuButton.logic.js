import React, { useCallback, useMemo, useState } from 'react';

import { createStyles } from './headerUserMenuButton.style';
import HeaderUserMenuButtonUI from './HeaderUserMenuButton.ui';
import UserMenu from '../UserMenu/UserMenu';

export default function HeaderUserMenuButton({ onLogout, theme }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const openMenu = useCallback(() => {
    setIsMenuVisible(true);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuVisible(false);
  }, []);

  const handleLogout = useCallback(() => {
    closeMenu();
    onLogout?.();
  }, [closeMenu, onLogout]);

  return (
    <>
      <HeaderUserMenuButtonUI
        onPress={openMenu}
        styles={styles}
        theme={theme}
      />
      <UserMenu
        onClose={closeMenu}
        onLogout={handleLogout}
        theme={theme}
        visible={isMenuVisible}
      />
    </>
  );
}
