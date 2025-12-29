import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';
import { spacing, typography, borderRadius } from '../theme';
import { supabase } from '../config/supabase';
import { getUsuarioByEmail } from '../services/usuarios';

const { height, width } = Dimensions.get('window');

export default function Auth({ navigation }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const setUser = useAppStore((state) => state.setUser);
  const [email, setEmail] = useState('dedapemo@gmail.com');
  const [password, setPassword] = useState('12345678');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validar que los campos no estén vacíos
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        t('screens.auth.missingFieldsTitle'),
        t('screens.auth.missingFieldsMessage'),
        [{ text: t('common.ok'), style: 'default' }]
      );
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Iniciando login con Supabase Auth...');

      // Autenticar con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        console.error('❌ Error de autenticación:', authError.message);

        // Mensajes más amigables
        let errorMessage = t('screens.auth.invalidCredentials');
        if (authError.message.includes('Invalid login credentials')) {
          errorMessage = t('screens.auth.invalidLogin');
        } else if (authError.message.includes('Email not confirmed')) {
          errorMessage = t('screens.auth.emailNotConfirmed');
        }

        Alert.alert(
          t('screens.auth.errorTitle'),
          errorMessage,
          [{ text: t('screens.auth.tryAgain'), style: 'cancel' }]
        );
        return;
      }

      console.log('✅ Autenticación exitosa:', authData.user.email);

      // Obtener datos completos del usuario desde la tabla usuarios
      const usuario = await getUsuarioByEmail(authData.user.email);

      if (!usuario) {
        console.error('❌ Usuario no encontrado en la tabla usuarios');
        Alert.alert(
          t('common.error'),
          t('screens.auth.userNotFound'),
          [{ text: t('common.ok'), style: 'default' }]
        );
        return;
      }

      // Guardar usuario en Zustand (sin password)
      const { password: _, ...usuarioSeguro } = usuario;
      setUser(usuarioSeguro);

      console.log('✅ Usuario guardado en store:', usuarioSeguro.nombre);

      // Mostrar modal de éxito
      Alert.alert(
        t('screens.auth.welcomeTitle'),
        t('screens.auth.welcomeMessage', { name: usuario.nombre }),
        [{ text: t('screens.auth.continue'), style: 'default' }]
      );

    } catch (err) {
      console.error('❌ Error en handleLogin:', err);
      Alert.alert(
        t('screens.auth.serverErrorTitle'),
        t('screens.auth.serverErrorMessage'),
        [{ text: t('common.ok'), style: 'default' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.base,
      justifyContent: 'space-between',
    },
    headerSection: {
      alignItems: 'center',
      marginBottom: spacing.base,
    },
    logoContainer: {
      width: 45,
      height: 45,
      backgroundColor: theme.colors.alpha.primary15,
      borderRadius: borderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    title: {
      fontSize: typography.fontSize.lg,
      fontWeight: 'bold',
      color: theme.colors.text.primary,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: 18,
    },
    formContainer: {
      gap: spacing.sm,
      marginBottom: spacing.base,
    },
    inputContainer: {
      position: 'relative',
    },
    label: {
      fontSize: typography.fontSize.xs,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: spacing.xs,
    },
    input: {
      backgroundColor: theme.colors.background.surface,
      borderWidth: 1,
      borderColor: theme.colors.glass.border,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.base,
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.primary,
      height: 40,
    },
    inputFocused: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.background.surface2,
    },
    passwordToggle: {
      position: 'absolute',
      right: spacing.base,
      top: '50%',
      marginTop: 0,
    },
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm,
      height: 44,
    },
    buttonText: {
      fontSize: typography.fontSize.sm,
      fontWeight: '700',
      color: '#fff',
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginVertical: spacing.base,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.glass.border,
    },
    dividerText: {
      fontSize: typography.fontSize.xs,
      color: theme.colors.text.secondary,
    },
    socialButtonsContainer: {
      gap: spacing.xs,
    },
    socialButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      backgroundColor: theme.colors.background.surface,
      borderWidth: 1,
      borderColor: theme.colors.glass.border,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.xs,
      height: 40,
    },
    socialButtonText: {
      fontSize: typography.fontSize.xs,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    footerText: {
      fontSize: typography.fontSize.xs,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    footerLink: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
  }), [theme]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <Ionicons 
                name="trail-sign" 
                size={24} 
                color={theme.colors.primary} 
              />
            </View>
            <Text style={styles.title}>{t('screens.auth.title')}</Text>
            <Text style={styles.subtitle}>
              {t('screens.auth.subtitle')}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('screens.auth.email')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('screens.auth.emailPlaceholder')}
                placeholderTextColor={theme.colors.text.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('screens.auth.password')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('screens.auth.passwordPlaceholder')}
                placeholderTextColor={theme.colors.text.muted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity 
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye' : 'eye-off'}
                  size={18}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Button */}
          <TouchableOpacity 
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t('screens.auth.login')}</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>{t('screens.auth.orContinue')}</Text>
            <View style={styles.divider} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-google" size={16} color="#DB4437" />
              <Text style={styles.socialButtonText}>{t('screens.auth.google')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-apple" size={16} color={theme.colors.text.primary} />
              <Text style={styles.socialButtonText}>{t('screens.auth.apple')}</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footerText}>
            {t('screens.auth.noAccount')}{' '}
            <Text 
              style={styles.footerLink}
              onPress={() => navigation?.navigate('SignupScreen')}
            >
              {t('screens.auth.signUp')}
            </Text>
          </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
