import React from 'react';
import { Text, TextInput, View } from 'react-native';

export default function AuthTextFieldUI({
  autoCapitalize,
  autoCorrect,
  inputStyle,
  keyboardType,
  label,
  multiline,
  onChangeText,
  placeholder,
  styles,
  theme,
  value,
}) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text.muted}
        style={[styles.input, multiline && styles.multilineInput, inputStyle]}
        value={value}
      />
    </View>
  );
}

