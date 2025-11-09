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
import { spacing, typography, borderRadius } from '../theme';
import { supabase } from '../utils/supabase';
import { getUsuarioByEmail } from '../utils/usuarios';

const { height, width } = Dimensions.get('window');

export default function Auth({ navigation }) {
  const { theme } = useTheme();
  const setUser = useAppStore((state) => state.setUser);
  const [email, setEmail] = useState('dedapemo@gmail.com');
  const [password, setPassword] = useState('12345678');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validar que los campos no estén vacíos
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        '⚠️ Campos Incompletos',
        'Por favor completa email y contraseña',
        [{ text: 'OK', style: 'default' }]
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
        let errorMessage = 'Credenciales inválidas';
        if (authError.message.includes('Invalid login credentials')) {
          errorMessage = 'Email o contraseña incorrectos';
        } else if (authError.message.includes('Email not confirmed')) {
          errorMessage = 'Por favor confirma tu email antes de iniciar sesión';
        }

        Alert.alert(
          '❌ Error de Autenticación',
          errorMessage,
          [{ text: 'Intentar de Nuevo', style: 'cancel' }]
        );
        return;
      }

      console.log('✅ Autenticación exitosa:', authData.user.email);

      // Obtener datos completos del usuario desde la tabla usuarios
      const usuario = await getUsuarioByEmail(authData.user.email);

      if (!usuario) {
        console.error('❌ Usuario no encontrado en la tabla usuarios');
        Alert.alert(
          '❌ Error',
          'No se encontraron los datos del usuario',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      // Guardar usuario en Zustand (sin password)
      const { password: _, ...usuarioSeguro } = usuario;
      setUser(usuarioSeguro);

      console.log('✅ Usuario guardado en store:', usuarioSeguro.nombre);

      // Mostrar modal de éxito
      Alert.alert(
        '✅ ¡Bienvenido!',
        `Hola ${usuario.nombre}, has iniciado sesión correctamente`,
        [{ text: 'Continuar', style: 'default' }]
      );

    } catch (err) {
      console.error('❌ Error en handleLogin:', err);
      Alert.alert(
        '❌ Error del Servidor',
        'Error al iniciar sesión. Intenta nuevamente.',
        [{ text: 'OK', style: 'default' }]
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
            <Text style={styles.title}>Bienvenido</Text>
            <Text style={styles.subtitle}>
              Inicia sesión para conectar con patinadores
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                placeholderTextColor={theme.colors.text.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
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
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>o continúa</Text>
            <View style={styles.divider} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-google" size={16} color="#DB4437" />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-apple" size={16} color={theme.colors.text.primary} />
              <Text style={styles.socialButtonText}>Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footerText}>
            ¿No tienes cuenta?{' '}
            <Text 
              style={styles.footerLink}
              onPress={() => navigation?.navigate('SignupScreen')}
            >
              Registrate
            </Text>
          </Text>
      </ScrollView>
    </SafeAreaView>
  );
}