import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import LoginUI from './Login.ui';
import { AUTH_ROUTES } from '../../../../navigation/navigation.constants';
import {
  getFriendlyAuthErrorCode,
  validateLoginForm,
} from '../../utils/authValidation.utils';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../../../hooks/useTheme';
import { createStyles } from './login.style';

export default function Login({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const authError = useAuthStore((state) => state.authError);
  const isAuthLoading = useAuthStore((state) => state.isAuthLoading);
  const loginWithEmail = useAuthStore((state) => state.loginWithEmail);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);

  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const copy = useMemo(
    () => ({
      divider: t('auth.login.divider'),
      footerAction: t('auth.login.footerAction'),
      footerText: t('auth.login.footerText'),
      form: {
        emailLabel: t('auth.login.emailLabel'),
        emailPlaceholder: t('auth.login.emailPlaceholder'),
        passwordLabel: t('auth.login.passwordLabel'),
        passwordPlaceholder: t('auth.login.passwordPlaceholder'),
        submit: t('auth.login.submit'),
      },
      subtitle: t('auth.login.subtitle'),
      title: t('auth.login.title'),
    }),
    [t]
  );

  const translateLoginError = (errorCode) => {
    if (!errorCode) return null;

    return t(`auth.login.errors.${errorCode}`, { defaultValue: errorCode });
  };

  const submitLogin = async () => {
    const validationError = validateLoginForm({ email, password });
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    clearAuthError();

    const result = await loginWithEmail({ email, password });
    if (!result.ok) {
      setFormError(getFriendlyAuthErrorCode(result.error) || result.error);
    }
  };

  const goToSignup = () => {
    setFormError(null);
    clearAuthError();
    navigation?.navigate(AUTH_ROUTES.SIGNUP);
  };

  return (
    <LoginUI
      copy={copy}
      email={email}
      error={translateLoginError(
        formError || getFriendlyAuthErrorCode(authError) || authError
      )}
      isLoading={isAuthLoading}
      onChangeEmail={setEmail}
      onChangePassword={setPassword}
      onSubmit={submitLogin}
      onTogglePassword={() => setShowPassword((value) => !value)}
      onSignupPress={goToSignup}
      password={password}
      showPassword={showPassword}
      styles={styles}
      theme={theme}
    />
  );
}
