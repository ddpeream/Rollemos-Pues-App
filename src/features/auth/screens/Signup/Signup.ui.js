import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import AuthScreenIntro from '../../components/AuthScreenIntro/AuthScreenIntro';
import SignupAvatarField from './components/SignupAvatarField/SignupAvatarField';
import SignupForm from './components/SignupForm/SignupForm';

export default function SignupUI({
  copy,
  disciplines,
  error,
  formData,
  isLoading,
  levels,
  message,
  onBackPress,
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
  theme,
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthScreenIntro
            iconName="person-add"
            subtitle={copy.subtitle}
            title={copy.title}
          />

          <SignupAvatarField label={copy.form.profilePhoto} />

          <SignupForm
            copy={copy.form}
            disciplines={disciplines}
            error={error}
            formData={formData}
            isLoading={isLoading}
            levels={levels}
            message={message}
            onChangeField={onChangeField}
            onCloseDisciplineModal={onCloseDisciplineModal}
            onCloseLevelModal={onCloseLevelModal}
            onOpenDisciplineModal={onOpenDisciplineModal}
            onOpenLevelModal={onOpenLevelModal}
            onSelectDiscipline={onSelectDiscipline}
            onSelectLevel={onSelectLevel}
            onSubmit={onSubmit}
            onToggleConfirmPassword={onToggleConfirmPassword}
            onTogglePassword={onTogglePassword}
            showConfirmPassword={showConfirmPassword}
            showDisciplineModal={showDisciplineModal}
            showLevelModal={showLevelModal}
            showPassword={showPassword}
            modalCopy={copy.modals}
          />

          <TouchableOpacity
            disabled={isLoading}
            onPress={onBackPress}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={18} color={theme.colors.primary} />
            <Text style={styles.backButtonText}>{copy.form.backToLogin}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
