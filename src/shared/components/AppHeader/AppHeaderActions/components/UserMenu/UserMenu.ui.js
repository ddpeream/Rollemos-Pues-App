import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function UserMenuUI({
  items,
  onClose,
  onLogout,
  styles,
  t,
  theme,
  visible,
}) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={styles.overlay}
      >
        <View style={styles.menu}>
          {items.map((item) => (
            <TouchableOpacity
              disabled
              key={item.id}
              style={[styles.item, styles.disabledItem]}
            >
              <Ionicons
                name={item.iconName}
                size={18}
                color={theme.colors.text.secondary}
              />
              <Text style={[styles.label, styles.disabledLabel]}>
                {t(item.translationKey)}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.separator} />

          <TouchableOpacity onPress={onLogout} style={styles.item}>
            <Ionicons
              name="log-out-outline"
              size={18}
              color={theme.colors.error}
            />
            <Text style={[styles.label, styles.logoutLabel]}>
              {t('common.menu.logout')}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
