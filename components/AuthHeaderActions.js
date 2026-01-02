import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import ThemeToggle from './ThemeToggle';
import useAppStore from '../store/useAppStore';

/**
 * Header actions for Auth screens (Login/Signup)
 * Contains only Theme toggle and Language selector
 */
export default function AuthHeaderActions() {
  const { theme } = useAppStore();
  const setLanguage = useAppStore((state) => state.setLanguage);
  const { i18n } = useTranslation();
  
  const [languageVisible, setLanguageVisible] = useState(false);
  const currentLang = i18n.language;

  const openLanguage = () => setLanguageVisible(true);
  const closeLanguage = () => setLanguageVisible(false);

  const getFlag = () => {
    if (currentLang === 'es') return '🇨🇴';
    if (currentLang === 'en') return '🇺🇸';
    if (currentLang === 'fr') return '🇫🇷';
    return '🏳️';
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 10,
    },
    themeWrapper: {
      marginRight: 8,
    },
    languageButton: {
      padding: 8,
      backgroundColor: theme.colors.glass.background,
      borderRadius: 20,
      minWidth: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    flagText: {
      fontSize: 24,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    languageMenu: {
      position: 'absolute',
      top: 60,
      right: 16,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 8,
      paddingVertical: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    languageItem: {
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    languageText: {
      fontSize: 16,
      color: theme.colors.text.primary,
    },
    languageTextActive: {
      fontWeight: 'bold',
    },
  }), [theme]);

  return (
    <>
      <View pointerEvents="box-none" style={styles.container}>
        <View style={styles.themeWrapper}>
          <ThemeToggle />
        </View>
        <Pressable
          onPress={openLanguage}
          style={styles.languageButton}
          hitSlop={8}
        >
          <Text style={styles.flagText}>{getFlag()}</Text>
        </Pressable>
      </View>

      <Modal
        visible={languageVisible}
        transparent
        animationType="fade"
        onRequestClose={closeLanguage}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={closeLanguage}
          style={styles.modalOverlay}
        >
          <View style={styles.languageMenu}>
            {[
              { id: 'es', label: '🇨🇴 Español' },
              { id: 'en', label: '🇺🇸 English' },
              { id: 'fr', label: '🇫🇷 Français' },
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  setLanguage(item.id);
                  closeLanguage();
                }}
                style={styles.languageItem}
              >
                <Text
                  style={[
                    styles.languageText,
                    currentLang === item.id && styles.languageTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
