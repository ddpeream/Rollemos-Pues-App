import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  createSignupInitialForm,
  SKATING_DISCIPLINES,
  SKATING_LEVELS,
} from '../../constants/auth.constants';
import SignupUI from './Signup.ui';
import {
  getFriendlyAuthErrorCode,
  validateSignupForm,
} from '../../utils/authValidation.utils';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../../../hooks/useTheme';
import { useUserStore } from '../../../users';
import { createStyles } from './signup.style';

export default function Signup({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const authError = useAuthStore((state) => state.authError);
  const isAuthLoading = useAuthStore((state) => state.isAuthLoading);
  const registerWithEmail = useAuthStore((state) => state.registerWithEmail);
  const logout = useAuthStore((state) => state.logout);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);
  const createCurrentUserProfile = useUserStore((state) => state.createCurrentUserProfile);
  const isCurrentUserLoading = useUserStore((state) => state.isCurrentUserLoading);
  const userError = useUserStore((state) => state.userError);

  const [formData, setFormData] = useState(createSignupInitialForm);
  const [formError, setFormError] = useState(null);
  const [formMessage, setFormMessage] = useState(null);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDisciplineModal, setShowDisciplineModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isLoading = isAuthLoading || isCurrentUserLoading;

  const copy = useMemo(
    () => ({
      form: {
        backToLogin: t('auth.signup.form.backToLogin'),
        bioLabel: t('auth.signup.form.bioLabel'),
        bioPlaceholder: t('auth.signup.form.bioPlaceholder'),
        cityLabel: t('auth.signup.form.cityLabel'),
        cityPlaceholder: t('auth.signup.form.cityPlaceholder'),
        confirmPasswordLabel: t('auth.signup.form.confirmPasswordLabel'),
        confirmPasswordPlaceholder: t('auth.signup.form.confirmPasswordPlaceholder'),
        disciplineLabel: t('auth.signup.form.disciplineLabel'),
        emailLabel: t('auth.signup.form.emailLabel'),
        emailPlaceholder: t('auth.signup.form.emailPlaceholder'),
        levelLabel: t('auth.signup.form.levelLabel'),
        nameLabel: t('auth.signup.form.nameLabel'),
        namePlaceholder: t('auth.signup.form.namePlaceholder'),
        passwordLabel: t('auth.signup.form.passwordLabel'),
        passwordPlaceholder: t('auth.signup.form.passwordPlaceholder'),
        profilePhoto: t('auth.signup.form.profilePhoto'),
        submit: t('auth.signup.form.submit'),
      },
      modals: {
        disciplineTitle: t('auth.signup.modals.disciplineTitle'),
        levelTitle: t('auth.signup.modals.levelTitle'),
      },
      subtitle: t('auth.signup.subtitle'),
      title: t('auth.signup.title'),
    }),
    [t]
  );

  const translatedDisciplines = useMemo(
    () =>
      SKATING_DISCIPLINES.map((discipline) => ({
        ...discipline,
        label: t(discipline.translationKey),
      })),
    [t]
  );

  const translatedLevels = useMemo(
    () =>
      SKATING_LEVELS.map((level) => ({
        ...level,
        label: t(level.translationKey),
      })),
    [t]
  );

  const translateSignupError = (errorCode) => {
    if (!errorCode) return null;

    return t(`auth.signup.errors.${errorCode}`, { defaultValue: errorCode });
  };

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const submitSignup = async () => {
    const validationError = validateSignupForm(formData);
    if (validationError) {
      setFormError(validationError);
      setFormMessage(null);
      return;
    }

    setFormError(null);
    setFormMessage(null);
    clearAuthError();

    const authResult = await registerWithEmail({
      email: formData.email,
      metadata: { nombre: formData.nombre.trim() },
      password: formData.password,
    });

    if (!authResult.ok) {
      setFormError(getFriendlyAuthErrorCode(authResult.error) || authResult.error);
      return;
    }

    const authUser = authResult.data?.session?.user || authResult.data?.user;
    if (!authUser?.id) {
      setFormMessage(t('auth.signup.messages.confirmEmail'));
      return;
    }

    const profileResult = await createCurrentUserProfile({
      bio: formData.bio.trim(),
      ciudad: formData.ciudad.trim(),
      disciplina: formData.disciplina,
      email: formData.email.trim(),
      id: authUser.id,
      nivel: formData.nivel,
      nombre: formData.nombre.trim(),
    });

    if (!profileResult.ok) {
      await logout();
      setFormError(profileResult.error);
    }
  };

  const goBackToLogin = () => {
    setFormError(null);
    setFormMessage(null);
    clearAuthError();
    navigation?.goBack();
  };

  return (
    <SignupUI
      copy={copy}
      disciplines={translatedDisciplines}
      error={translateSignupError(
        formError || getFriendlyAuthErrorCode(authError) || userError
      )}
      formData={formData}
      isLoading={isLoading}
      levels={translatedLevels}
      message={formMessage}
      onBackPress={goBackToLogin}
      onChangeField={updateField}
      onCloseDisciplineModal={() => setShowDisciplineModal(false)}
      onCloseLevelModal={() => setShowLevelModal(false)}
      onOpenDisciplineModal={() => setShowDisciplineModal(true)}
      onOpenLevelModal={() => setShowLevelModal(true)}
      onSelectDiscipline={(value) => {
        updateField('disciplina', value);
        setShowDisciplineModal(false);
      }}
      onSelectLevel={(value) => {
        updateField('nivel', value);
        setShowLevelModal(false);
      }}
      onSubmit={submitSignup}
      onToggleConfirmPassword={() => setShowConfirmPassword((value) => !value)}
      onTogglePassword={() => setShowPassword((value) => !value)}
      showConfirmPassword={showConfirmPassword}
      showDisciplineModal={showDisciplineModal}
      showLevelModal={showLevelModal}
      showPassword={showPassword}
      styles={styles}
      theme={theme}
    />
  );
}
