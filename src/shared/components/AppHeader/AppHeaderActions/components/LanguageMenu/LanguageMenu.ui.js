import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

export default function LanguageMenuUI({
  currentLanguageCode,
  languages,
  onClose,
  onSelectLanguage,
  styles,
  t,
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
          {languages.map((language) => {
            const isActive = language.code === currentLanguageCode;

            return (
              <TouchableOpacity
                key={language.code}
                onPress={() => onSelectLanguage(language.code)}
                style={styles.item}
              >
                <Text style={styles.flag}>{language.flag}</Text>
                <Text style={[styles.label, isActive && styles.activeLabel]}>
                  {t(language.translationKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
