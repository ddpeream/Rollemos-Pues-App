import React from 'react';
import { View } from 'react-native';

import AuthFeedbackMessage from '../../../../components/AuthFeedbackMessage/AuthFeedbackMessage';
import AuthOptionModal from '../../../../components/AuthOptionModal/AuthOptionModal';
import AuthPasswordField from '../../../../components/AuthPasswordField/AuthPasswordField';
import AuthPrimaryButton from '../../../../components/AuthPrimaryButton/AuthPrimaryButton';
import AuthSelectField from '../../../../components/AuthSelectField/AuthSelectField';
import AuthTextField from '../../../../components/AuthTextField/AuthTextField';

export default function SignupFormUI({
  copy,
  disciplines,
  error,
  formData,
  isLoading,
  levels,
  message,
  modalCopy,
  onChangeField,
  onCloseDisciplineModal,
  onCloseLevelModal,
  onOpenDisciplineModal,
  onOpenLevelModal,
  onSelectDiscipline,
  onSelectLevel,
  onSubmit,
  onToggleConfirmPassword,
  onTogglePassword,
  showConfirmPassword,
  showDisciplineModal,
  showLevelModal,
  showPassword,
  styles,
}) {
  return (
    <>
      <View style={styles.formContainer}>
        <AuthTextField
          label={copy.nameLabel}
          onChangeText={(value) => onChangeField('nombre', value)}
          placeholder={copy.namePlaceholder}
          value={formData.nombre}
        />

        <AuthTextField
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          label={copy.emailLabel}
          onChangeText={(value) => onChangeField('email', value)}
          placeholder={copy.emailPlaceholder}
          value={formData.email}
        />

        <AuthPasswordField
          disabled={isLoading}
          label={copy.passwordLabel}
          onChangeText={(value) => onChangeField('password', value)}
          onTogglePassword={onTogglePassword}
          placeholder={copy.passwordPlaceholder}
          showPassword={showPassword}
          value={formData.password}
        />

        <AuthPasswordField
          disabled={isLoading}
          label={copy.confirmPasswordLabel}
          onChangeText={(value) => onChangeField('confirmPassword', value)}
          onTogglePassword={onToggleConfirmPassword}
          placeholder={copy.confirmPasswordPlaceholder}
          showPassword={showConfirmPassword}
          value={formData.confirmPassword}
        />

        <AuthTextField
          label={copy.cityLabel}
          onChangeText={(value) => onChangeField('ciudad', value)}
          placeholder={copy.cityPlaceholder}
          value={formData.ciudad}
        />

        <AuthSelectField
          label={copy.levelLabel}
          onPress={onOpenLevelModal}
          options={levels}
          selectedId={formData.nivel}
        />

        <AuthSelectField
          label={copy.disciplineLabel}
          onPress={onOpenDisciplineModal}
          options={disciplines}
          selectedId={formData.disciplina}
        />

        <AuthTextField
          label={copy.bioLabel}
          multiline
          onChangeText={(value) => onChangeField('bio', value)}
          placeholder={copy.bioPlaceholder}
          value={formData.bio}
        />

        <AuthFeedbackMessage message={error} />
        <AuthFeedbackMessage message={message} type="success" />
      </View>

      <AuthPrimaryButton
        isLoading={isLoading}
        onPress={onSubmit}
        title={copy.submit}
      />

      <AuthOptionModal
        onClose={onCloseLevelModal}
        onSelect={onSelectLevel}
        options={levels}
        selectedId={formData.nivel}
        title={modalCopy.levelTitle}
        visible={showLevelModal}
      />

      <AuthOptionModal
        onClose={onCloseDisciplineModal}
        onSelect={onSelectDiscipline}
        options={disciplines}
        selectedId={formData.disciplina}
        title={modalCopy.disciplineTitle}
        visible={showDisciplineModal}
      />
    </>
  );
}
