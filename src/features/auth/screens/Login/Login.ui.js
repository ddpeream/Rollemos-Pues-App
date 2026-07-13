import React from 'react';
import {
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthScreenIntro from '../../components/AuthScreenIntro/AuthScreenIntro';
import AuthSocialButtons from './components/AuthSocialButtons/AuthSocialButtons';
import LoginForm from './components/LoginForm/LoginForm';

export default function LoginUI({
  copy,
  email,
  error,
  isLoading,
  onChangeEmail,
  onChangePassword,
  onSignupPress,
  onSubmit,
  onTogglePassword,
  password,
  showPassword,
  styles,
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AuthScreenIntro
          iconName="trail-sign"
          subtitle={copy.subtitle}
          title={copy.title}
        />

        <LoginForm
          copy={copy.form}
          email={email}
          error={error}
          isLoading={isLoading}
          onChangeEmail={onChangeEmail}
          onChangePassword={onChangePassword}
          onSubmit={onSubmit}
          onTogglePassword={onTogglePassword}
          password={password}
          showPassword={showPassword}
        />

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>{copy.divider}</Text>
          <View style={styles.divider} />
        </View>

        <AuthSocialButtons />

        <Text style={styles.footerText}>
          {copy.footerText}{' '}
          <Text style={styles.footerLink} onPress={onSignupPress}>
            {copy.footerAction}
          </Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
