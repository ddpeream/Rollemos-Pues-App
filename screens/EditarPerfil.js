import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme, useAppStore } from '../store/useAppStore';
import { spacing, typography, borderRadius } from '../theme';
import { updateUsuario, uploadAvatarImage, getUsuarioById } from '../utils/usuarios';

export default function EditarPerfil() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [nombre, setNombre] = useState('');
  const [bio, setBio] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [email, setEmail] = useState('');
  const [disciplina, setDisciplina] = useState('');
  const [nivel, setNivel] = useState('');
  const [avatarUri, setAvatarUri] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const strings = useMemo(() => ({
    title: t('screens.editarPerfil.title', 'Editar Perfil'),
    save: t('screens.editarPerfil.save', 'Guardar Cambios'),
    cancel: t('screens.editarPerfil.cancel', 'Cancelar'),
    name: t('screens.editarPerfil.name', 'Nombre'),
    bio: t('screens.editarPerfil.bio', 'Biografía'),
    city: t('screens.editarPerfil.city', 'Ciudad'),
    email: t('screens.editarPerfil.email', 'Correo'),
    discipline: t('screens.editarPerfil.discipline', 'Disciplina'),
    level: t('screens.editarPerfil.level', 'Nivel'),
    saving: t('screens.editarPerfil.saving', 'Guardando...'),
    loadingError: t('screens.editarPerfil.loadingError', 'Error al cargar el perfil'),
    successMessage: t('screens.editarPerfil.successMessage', 'Perfil actualizado correctamente'),
    errorMessage: t('screens.editarPerfil.errorMessage', 'Error al actualizar el perfil'),
  }), [t]);

  const disciplines = [
    { value: 'freestyle', label: t('screens.shared.disciplines.freestyle', 'Freestyle') },
    { value: 'speed', label: t('screens.shared.disciplines.speed', 'Speed') },
    { value: 'street', label: t('screens.shared.disciplines.street', 'Street') },
    { value: 'park', label: t('screens.shared.disciplines.park', 'Park') },
    { value: 'slalom', label: t('screens.shared.disciplines.slalom', 'Slalom') },
    { value: 'downhill', label: t('screens.shared.disciplines.downhill', 'Downhill') },
  ];

  const levels = [
    { value: 'principiante', label: t('screens.shared.levels.principiante', 'Principiante') },
    { value: 'intermedio', label: t('screens.shared.levels.intermedio', 'Intermedio') },
    { value: 'avanzado', label: t('screens.shared.levels.avanzado', 'Avanzado') },
    { value: 'profesional', label: t('screens.shared.levels.profesional', 'Profesional') },
  ];

  // Cargar datos frescos cada vez que la pantalla recibe foco
  useFocusEffect(
    React.useCallback(() => {
      const loadFreshUserData = async () => {
        if (!user?.id) {
          setError('No hay usuario autenticado');
          return;
        }

        setLoading(true);
        console.log('🔄 EditarPerfil: Sincronizando datos del servidor para:', user.id);
        
        try {
          const freshUser = await getUsuarioById(user.id);
          
          if (freshUser) {
            console.log('✅ EditarPerfil: Datos sincronizados exitosamente');
            // Populate form with fresh user data
            setNombre(freshUser?.nombre || '');
            setBio(freshUser?.bio || '');
            setCiudad(freshUser?.ciudad || '');
            setEmail(freshUser?.email || '');
            
            const disciplinaLower = (freshUser?.disciplina || 'freestyle').toLowerCase();
            const nivelLower = (freshUser?.nivel || 'principiante').toLowerCase();
            
            setDisciplina(disciplinaLower);
            setNivel(nivelLower);
            setAvatarUri(freshUser?.avatar_url || null);
            setError(null);
          } else {
            console.error('❌ EditarPerfil: No se pudo cargar usuario');
            setError('Error al cargar el perfil');
          }
        } catch (err) {
          console.error('❌ EditarPerfil: Error sincronizando:', err);
          setError('Error al sincronizar datos');
        } finally {
          setLoading(false);
        }
      };

      loadFreshUserData();
    }, [user?.id])
  );

  // Función para seleccionar imagen
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitas permitir acceso a la galería para seleccionar una imagen');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
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

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'No se pudo identificar el usuario');
      return;
    }

    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }

    try {
      setSaving(true);
      const updatedData = {
        nombre: nombre.trim(),
        bio: bio.trim(),
        ciudad: ciudad.trim(),
        email: email.trim(),
        disciplina: disciplina.toLowerCase(),
        nivel: nivel.toLowerCase(),
      };

      // Si hay una imagen nueva (no es URL), subirla
      let avatarUrl = user?.avatar_url;
      if (avatarUri && !avatarUri.startsWith('http')) {
        console.log('📤 Subiendo nuevo avatar...');
        setUploadingAvatar(true);
        const uploadResult = await uploadAvatarImage(avatarUri, user.id);
        
        if (uploadResult.success) {
          avatarUrl = uploadResult.url;
          console.log('✅ Avatar subido:', avatarUrl);
          updatedData.avatar_url = avatarUrl;
        } else {
          console.warn('⚠️ Error subiendo avatar, continuando sin cambiar imagen');
        }
        setUploadingAvatar(false);
      }

      const result = await updateUsuario(user.id, updatedData);
      
      if (result.success || result.data) {
        // Actualizar el usuario en el store
        setUser({
          ...user,
          ...updatedData,
        });
        Alert.alert('Éxito', strings.successMessage, [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', result.error || strings.errorMessage);
      }
    } catch (err) {
      console.error('❌ Error guardando usuario:', err);
      Alert.alert('Error', err.message || strings.errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    keyboardView: {
      flex: 1,
    },
    content: {
      padding: spacing.lg,
    },
    section: {
      marginBottom: spacing.xl,
      backgroundColor: theme.colors.background.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.glass.border,
    },
    sectionTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginBottom: spacing.md,
    },
    label: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
      color: theme.colors.text.primary,
      marginBottom: spacing.sm,
    },
    input: {
      backgroundColor: theme.colors.alpha.primary10,
      borderWidth: 1,
      borderColor: theme.colors.glass.border,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: typography.fontSize.md,
      color: theme.colors.text.primary,
      marginBottom: spacing.md,
      minHeight: 48,
    },
    bioInput: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    selectButton: {
      backgroundColor: theme.colors.alpha.primary10,
      borderWidth: 1,
      borderColor: theme.colors.glass.border,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    selectButtonText: {
      fontSize: typography.fontSize.md,
      color: theme.colors.text.primary,
    },
    selectButtonPlaceholder: {
      color: theme.colors.text.secondary,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    rowItem: {
      flex: 1,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.xl,
    },
    button: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
    },
    cancelButton: {
      backgroundColor: theme.colors.background.surface,
      borderWidth: 1,
      borderColor: theme.colors.glass.border,
    },
    buttonText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: '#000',
    },
    cancelButtonText: {
      color: theme.colors.text.primary,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: spacing.xl,
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    errorText: {
      fontSize: typography.fontSize.lg,
      color: '#EF4444',
      textAlign: 'center',
    },
  }), [theme]);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: spacing.md, color: theme.colors.text.secondary }}>
          {t('common.loading', 'Cargando...')}
        </Text>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text style={styles.errorText}>{error || strings.loadingError}</Text>
        <TouchableOpacity
          style={[styles.button, styles.saveButton, { marginTop: spacing.lg }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>{t('common.goBack', 'Volver')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handlePickImage}
              activeOpacity={0.7}
              disabled={uploadingAvatar || saving}
            >
              {avatarUri ? (
                <>
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.avatarImage}
                  />
                  <View style={styles.avatarOverlay}>
                    {uploadingAvatar ? (
                      <ActivityIndicator color="#fff" size="large" />
                    ) : (
                      <Ionicons name="camera" size={24} color="#fff" />
                    )}
                  </View>
                </>
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="camera" size={40} color={theme.colors.primary} />
                  <Text style={styles.avatarPlaceholderText}>Cambiar foto</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Información básica */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Básica</Text>

            <Text style={styles.label}>{strings.name}</Text>
            <TextInput
              style={styles.input}
              placeholder={strings.name}
              value={nombre}
              onChangeText={setNombre}
              placeholderTextColor={theme.colors.text.secondary}
            />

            <Text style={styles.label}>{strings.email}</Text>
            <TextInput
              style={styles.input}
              placeholder={strings.email}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholderTextColor={theme.colors.text.secondary}
            />

            <Text style={styles.label}>{strings.city}</Text>
            <TextInput
              style={styles.input}
              placeholder={strings.city}
              value={ciudad}
              onChangeText={setCiudad}
              placeholderTextColor={theme.colors.text.secondary}
            />
          </View>

          {/* Disciplina y Nivel */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Patinaje</Text>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>{strings.discipline}</Text>
                <TouchableOpacity style={styles.selectButton}>
                  <Text style={[styles.selectButtonText, { flex: 1 }]}>
                    {disciplines.find(d => d.value === disciplina)?.label || strings.discipline}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.rowItem}>
                <Text style={styles.label}>{strings.level}</Text>
                <TouchableOpacity style={styles.selectButton}>
                  <Text style={[styles.selectButtonText, { flex: 1 }]}>
                    {levels.find(l => l.value === nivel)?.label || strings.level}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Biografía */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{strings.bio}</Text>

            <Text style={styles.label}>{strings.bio}</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder={strings.bio}
              value={bio}
              onChangeText={setBio}
              placeholderTextColor={theme.colors.text.secondary}
              multiline
              numberOfLines={5}
            />
          </View>

          {/* Botones de acción */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => navigation.goBack()}
              disabled={saving}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                {strings.cancel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Text style={styles.buttonText}>{strings.save}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
