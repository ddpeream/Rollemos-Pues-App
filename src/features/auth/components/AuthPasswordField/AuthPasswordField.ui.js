import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AuthPasswordFieldUI({
  disabled,
  label,
  onChangeText,
  onTogglePassword,
  placeholder,
  showPassword,
  styles,
  theme,
  value,
}) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text.muted}
        secureTextEntry={!showPassword}
        style={styles.input}
        value={value}
      />
      <TouchableOpacity
        disabled={disabled}
        hitSlop={8}
        onPress={onTogglePassword}
        style={styles.passwordToggle}
      >
        <Ionicons
          name={showPassword ? 'eye' : 'eye-off'}
          size={20}
          color={theme.colors.text.secondary}
        />
      </TouchableOpacity>
    </View>
  );
}

