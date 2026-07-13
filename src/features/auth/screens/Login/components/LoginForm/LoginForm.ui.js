import React from 'react';
import { View } from 'react-native';

import AuthFeedbackMessage from '../../../../components/AuthFeedbackMessage/AuthFeedbackMessage';
import AuthPasswordField from '../../../../components/AuthPasswordField/AuthPasswordField';
import AuthPrimaryButton from '../../../../components/AuthPrimaryButton/AuthPrimaryButton';
import AuthTextField from '../../../../components/AuthTextField/AuthTextField';

export default function LoginFormUI({
  copy,
  email,
  error,
  isLoading,
  onChangeEmail,
  onChangePassword,
  onSubmit,
  onTogglePassword,
  password,
  showPassword,
  styles,
}) {
  return (
    <>
      <View style={styles.formContainer}>
        <AuthTextField
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          label={copy.emailLabel}
          onChangeText={onChangeEmail}
          placeholder={copy.emailPlaceholder}
          value={email}
        />

        <AuthPasswordField
          disabled={isLoading}
          label={copy.passwordLabel}
          onChangeText={onChangePassword}
          onTogglePassword={onTogglePassword}
          placeholder={copy.passwordPlaceholder}
          showPassword={showPassword}
          value={password}
        />

        <AuthFeedbackMessage message={error} />
      </View>

      <AuthPrimaryButton
        isLoading={isLoading}
        onPress={onSubmit}
        title={copy.submit}
      />
    </>
  );
}
