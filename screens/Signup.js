import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme, useAppStore } from '../store/useAppStore';
import { uploadAvatarImage } from '../utils/usuarios';
import { spacing, typography, borderRadius } from '../theme';
import { supabase } from '../config/supabase';

const { height, width } = Dimensions.get('window');

const NIVELES = [
  { id: 'principiante', label: 'Principiante', icon: '🛹' },
  { id: 'intermedio', label: 'Intermedio', icon: '⭐' },
  { id: 'avanzado', label: 'Avanzado', icon: '🏆' },
  { id: 'profesional', label: 'Profesional', icon: '👑' },
];

const DISCIPLINAS = [
  { id: 'street', label: 'Street', icon: '🛣️' },
  { id: 'park', label: 'Park', icon: '🎡' },
  { id: 'freestyle', label: 'Freestyle', icon: '🎪' },
  { id: 'speed', label: 'Speed', icon: '⚡' },
  { id: 'downhill', label: 'Downhill', icon: '⬇️' },
  { id: 'cruising', label: 'Cruising', icon: '🌊' },
];

export default function Signup({ navigation }) {
  const { theme } = useTheme();
  const setUser = useAppStore((state) => state.setUser);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    ciudad: '',
    nivel: 'principiante',
    disciplina: 'street',
    bio: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNivelModal, setShowNivelModal] = useState(false);
  const [showDisciplinaModal, setShowDisciplinaModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState(null);

  // Función para seleccionar imagen
  const handlePickImage = async () => {
    try {
      // Solicitar permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitas permitir acceso a la galería para seleccionar una imagen');
        return;
      }

      // Abrir selector de imagen
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Cuadrado
        quality: 0.8,
      });

      if (!result.canceled) {
        const selectedImage = result.assets[0];
        setAvatarUri(selectedImage.uri);
        console.log('✅ Imagen seleccionada:', selectedImage.uri);
      }
    } catch (error) {
      console.error('❌ Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Función para manejar el registro con Supabase Auth
  const handleSignup = async () => {
    // Validaciones
    if (!formData.nombre.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert('Error', 'El email es requerido');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'El email no es válido');
      return;
    }

    if (!formData.password) {
      Alert.alert('Error', 'La contraseña es requerida');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (!formData.ciudad.trim()) {
      Alert.alert('Error', 'La ciudad es requerida');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Registrando usuario con Supabase Auth...');

      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            nombre: formData.nombre.trim(),
          },
          emailRedirectTo: undefined, // Deshabilitar confirmación por email en desarrollo
        },
      });

      if (authError) {
        console.error('❌ Error en Supabase Auth:', authError.message);

        let errorMessage = authError.message;
        if (authError.message.includes('already registered')) {
          errorMessage = 'Este email ya está registrado';
        }

        Alert.alert('Error', errorMessage);
        setLoading(false);
        return;
      }

      console.log('✅ Usuario creado en Supabase Auth:', authData.user?.id);

      // 2. Crear registro en tabla usuarios (sin password)
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .insert([
          {
            id: authData.user.id, // Usar el mismo ID de Supabase Auth
            nombre: formData.nombre.trim(),
            email: formData.email.trim(),
            ciudad: formData.ciudad.trim(),
            nivel: formData.nivel,
            disciplina: formData.disciplina,
            bio: formData.bio.trim() || null,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (usuarioError) {
        console.error('❌ Error creando registro de usuario:', usuarioError.message);
        Alert.alert('Error', 'No se pudo completar el registro');
        setLoading(false);
        return;
      }

      console.log('✅ Registro de usuario creado');

      // 3. Si hay avatar, subirlo
      let avatarUrl = null;
      if (avatarUri) {
        console.log('📤 Subiendo avatar...');
        const uploadResult = await uploadAvatarImage(avatarUri, authData.user.id);

        if (uploadResult.success) {
          avatarUrl = uploadResult.url;
          console.log('✅ Avatar subido:', avatarUrl);

          // Actualizar usuario con URL del avatar
          await supabase
            .from('usuarios')
            .update({ avatar_url: avatarUrl })
            .eq('id', authData.user.id);

          usuarioData.avatar_url = avatarUrl;
        } else {
          console.warn('⚠️ Error subiendo avatar, continuando sin imagen');
        }
      }

      // 4. Usuario creado exitosamente
      Alert.alert(
        '¡Éxito!',
        'Cuenta creada correctamente. Has iniciado sesión automáticamente.',
        [{ text: 'Continuar', style: 'default' }]
      );

      // 5. Establecer el usuario en el store (ya está autenticado)
      setUser(usuarioData);

      console.log('✅ Registro completado exitosamente');

    } catch (error) {
      console.error('❌ Error en signup:', error);
      Alert.alert('Error', 'Ocurrió un error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    },
    headerSection: {
      alignItems: 'center',
      marginBottom: spacing.lg,
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
    avatarSection: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    avatarContainer: {
      width: 120,
      height: 120,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.background.surface,
      borderWidth: 2,
      borderColor: theme.colors.glass.border,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarOverlay: {
      position: 'absolute',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    avatarPlaceholderText: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.primary,
      fontWeight: '600',
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
    textAreaInput: {
      height: 70,
      paddingTop: spacing.xs,
      textAlignVertical: 'top',
    },
    passwordToggle: {
      position: 'absolute',
      right: spacing.base,
      top: '50%',
      marginTop: 0,
    },
    pickerContainer: {
      flexDirection: 'row',
      gap: spacing.sm,
      backgroundColor: theme.colors.background.surface,
      borderWidth: 1,
      borderColor: theme.colors.glass.border,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.base,
      height: 40,
      alignItems: 'center',
    },
    pickerButton: {
      flex: 1,
      height: '100%',
      justifyContent: 'center',
    },
    pickerButtonText: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.primary,
      fontWeight: '500',
    },
    divider: {
      width: 1,
      height: '60%',
      backgroundColor: theme.colors.glass.border,
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
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      marginTop: spacing.sm,
    },
    backButtonText: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.background.primary,
      borderTopLeftRadius: borderRadius.lg,
      borderTopRightRadius: borderRadius.lg,
      paddingHorizontal: spacing.base,
      paddingTop: spacing.base,
      paddingBottom: spacing.lg,
      maxHeight: height * 0.6,
    },
    modalHeader: {
      fontSize: typography.fontSize.base,
      fontWeight: '700',
      color: theme.colors.text.primary,
      marginBottom: spacing.base,
      textAlign: 'center',
    },
    optionItem: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.base,
      borderRadius: borderRadius.md,
      marginBottom: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.glass.border,
      backgroundColor: theme.colors.background.surface,
    },
    optionItemSelected: {
      backgroundColor: theme.colors.alpha.primary15,
      borderColor: theme.colors.primary,
    },
    optionIcon: {
      fontSize: 20,
    },
    optionText: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.primary,
      fontWeight: '500',
    },
    optionTextSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
  }), [theme]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Ionicons 
              name="person-add" 
              size={24} 
              color={theme.colors.primary} 
            />
          </View>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>
            Únete a la comunidad de patinadores
          </Text>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handlePickImage}
            activeOpacity={0.7}
          >
            {avatarUri ? (
              <>
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.avatarImage}
                />
                <View style={styles.avatarOverlay}>
                  <Ionicons name="camera" size={24} color="#fff" />
                </View>
              </>
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="camera" size={40} color={theme.colors.primary} />
                <Text style={styles.avatarPlaceholderText}>Agregar foto</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Nombre */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre Completo *</Text>
            <TextInput
              style={styles.input}
              placeholder="Tu nombre"
              placeholderTextColor={theme.colors.text.muted}
              value={formData.nombre}
              onChangeText={(value) => handleChange('nombre', value)}
            />
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="tu@email.com"
              placeholderTextColor={theme.colors.text.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
            />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña *</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.text.muted}
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(value) => handleChange('password', value)}
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

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirmar Contraseña *</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.text.muted}
              secureTextEntry={!showConfirmPassword}
              value={formData.confirmPassword}
              onChangeText={(value) => handleChange('confirmPassword', value)}
            />
            <TouchableOpacity 
              style={styles.passwordToggle}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye' : 'eye-off'}
                size={18}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>
          </View>

          {/* Ciudad */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ciudad</Text>
            <TextInput
              style={styles.input}
              placeholder="Tu ciudad"
              placeholderTextColor={theme.colors.text.muted}
              value={formData.ciudad}
              onChangeText={(value) => handleChange('ciudad', value)}
            />
          </View>

          {/* Nivel */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nivel</Text>
            <TouchableOpacity 
              style={styles.pickerContainer}
              onPress={() => setShowNivelModal(true)}
            >
              <View style={styles.pickerButton}>
                <Text style={styles.pickerButtonText}>
                  {NIVELES.find(n => n.id === formData.nivel)?.label || formData.nivel}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.pickerButton}>
                <Ionicons name="chevron-down" size={20} color={theme.colors.primary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Disciplina */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Disciplina</Text>
            <TouchableOpacity 
              style={styles.pickerContainer}
              onPress={() => setShowDisciplinaModal(true)}
            >
              <View style={styles.pickerButton}>
                <Text style={styles.pickerButtonText}>
                  {DISCIPLINAS.find(d => d.id === formData.disciplina)?.label || formData.disciplina}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.pickerButton}>
                <Ionicons name="chevron-down" size={20} color={theme.colors.primary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Bio */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Biografía (Opcional)</Text>
            <TextInput
              style={[styles.input, styles.textAreaInput]}
              placeholder="Cuéntanos sobre ti..."
              placeholderTextColor={theme.colors.text.muted}
              multiline
              value={formData.bio}
              onChangeText={(value) => handleChange('bio', value)}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Crear Cuenta</Text>
          )}
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
          disabled={loading}
        >
          <Ionicons name="arrow-back" size={18} color={theme.colors.primary} />
          <Text style={styles.backButtonText}>Volver al Login</Text>
        </TouchableOpacity>

        {/* Modal Nivel */}
        <Modal
          visible={showNivelModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowNivelModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>Selecciona tu nivel</Text>
              <FlatList
                data={NIVELES}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      formData.nivel === item.id && styles.optionItemSelected,
                    ]}
                    onPress={() => {
                      handleChange('nivel', item.id);
                      setShowNivelModal(false);
                    }}
                  >
                    <Text style={styles.optionIcon}>{item.icon}</Text>
                    <Text
                      style={[
                        styles.optionText,
                        formData.nivel === item.id && styles.optionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Modal Disciplina */}
        <Modal
          visible={showDisciplinaModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDisciplinaModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>Selecciona tu disciplina</Text>
              <FlatList
                data={DISCIPLINAS}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      formData.disciplina === item.id && styles.optionItemSelected,
                    ]}
                    onPress={() => {
                      handleChange('disciplina', item.id);
                      setShowDisciplinaModal(false);
                    }}
                  >
                    <Text style={styles.optionIcon}>{item.icon}</Text>
                    <Text
                      style={[
                        styles.optionText,
                        formData.disciplina === item.id && styles.optionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}
