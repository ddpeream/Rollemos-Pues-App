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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useAppStore } from '../store/useAppStore';
import { spacing, typography, borderRadius } from '../theme';
import { getUsuarioById } from '../services/usuarios';
import BackButton from '../components/common/BackButton';

export default function Perfil() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [displayUser, setDisplayUser] = useState(user);

  // Cargar datos frescos cada vez que la pantalla recibe foco
  useFocusEffect(
    React.useCallback(() => {
      const loadFreshUserData = async () => {
        if (!user?.id) {
          console.warn('⚠️ Perfil: No hay usuario autenticado');
          setError(t('screens.perfil.noAuth'));
          return;
        }

        setLoading(true);
        console.log('🔄 Perfil: Sincronizando datos del servidor para:', user.id);
        console.log('📋 Perfil: Usuario actual en store:', JSON.stringify(user, null, 2));

        try {
          const freshUser = await getUsuarioById(user.id);

          if (freshUser) {
            console.log('✅ Perfil: Datos sincronizados exitosamente');
            console.log('📋 Perfil: Usuario fresco de BD:', JSON.stringify(freshUser, null, 2));

            // Limpiar el objeto usuario para asegurarnos de que solo tiene las propiedades esperadas
            const cleanUser = {
              id: freshUser.id,
              nombre: freshUser.nombre || '',
              email: freshUser.email || '',
              ciudad: freshUser.ciudad || '',
              nivel: freshUser.nivel || 'principiante',
              disciplina: freshUser.disciplina || 'street',
              bio: freshUser.bio || '',
              avatar_url: freshUser.avatar_url || null,
              created_at: freshUser.created_at,
              updated_at: freshUser.updated_at,
            };

            setDisplayUser(cleanUser);
            setUser(cleanUser); // Actualizar store también
            setError(null);
          } else {
            console.error('❌ Perfil: No se pudo cargar usuario');
            setError('Error al cargar el perfil');
            setDisplayUser(user); // Usar datos locales como fallback
          }
        } catch (err) {
          console.error('❌ Perfil: Error sincronizando:', err);
          console.error('📌 Perfil: Stack trace:', err.stack);
          setError('Error al sincronizar datos');
          setDisplayUser(user);
        } finally {
          setLoading(false);
        }
      };

      loadFreshUserData();
    }, [user?.id, setUser])
  );

  const strings = useMemo(() => ({
    title: t('screens.perfil.title', 'Mi Perfil'),
    editProfile: t('screens.perfil.editProfile', 'Editar Perfil'),
    greetings: t('screens.perfil.greetings', '¡Hola'),
    bio: t('screens.perfil.bio', 'Bio'),
    city: t('screens.perfil.city', 'Ciudad'),
    discipline: t('screens.perfil.discipline', 'Disciplina'),
    level: t('screens.perfil.level', 'Nivel'),
    email: t('screens.perfil.email', 'Correo'),
    loadingError: t('screens.perfil.loadingError', 'Error al cargar el perfil'),
    noBio: t('screens.perfil.noBio', 'Sin biografía'),
    logout: t('common.logout', 'Cerrar sesión'),
  }), [t]);

  useEffect(() => {
    if (!user) {
      setError(t('screens.perfil.noAuth'));
    } else {
      console.log('👤 Usuario cargado en Perfil:', user?.nombre);
    }
    setLoading(false);
  }, [user]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    header: {
      backgroundColor: theme.colors.background.surface,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.glass.border,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.alpha.primary15,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.lg,
      borderWidth: 3,
      borderColor: theme.colors.primary,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 60,
    },
    avatarPlaceholder: {
      fontSize: 48,
    },
    greetings: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    userName: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.primary,
    },
    content: {
      flex: 1,
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    sectionTitleIcon: {
      marginRight: spacing.sm,
    },
    bioText: {
      fontSize: typography.fontSize.md,
      color: theme.colors.text.secondary,
      lineHeight: 22,
      fontStyle: 'italic',
    },
    infoGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    infoBox: {
      flex: 1,
      backgroundColor: theme.colors.alpha.primary10,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      alignItems: 'center',
    },
    infoLabel: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginBottom: spacing.xs,
    },
    infoValue: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    contactSection: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.glass.border,
    },
    contactIcon: {
      marginRight: spacing.md,
    },
    contactText: {
      flex: 1,
      fontSize: typography.fontSize.md,
      color: theme.colors.text.secondary,
    },
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.lg,
      flexDirection: 'row',
      gap: spacing.md,
    },
    buttonText: {
      color: theme.colors.onPrimary,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
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

  if (error || !displayUser) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text style={styles.errorText}>{error || strings.loadingError}</Text>
      </View>
    );
  }

  const getDisciplineTranslation = (discipline) => {
    const disciplineMap = {
      street: t('screens.shared.disciplines.street', 'Street'),
      park: t('screens.shared.disciplines.park', 'Park'),
      slalom: t('screens.shared.disciplines.slalom', 'Slalom'),
      downhill: t('screens.shared.disciplines.downhill', 'Downhill'),
      freestyle: t('screens.shared.disciplines.freestyle', 'Freestyle'),
      speed: t('screens.shared.disciplines.speed', 'Speed'),
    };
    return disciplineMap[discipline] || discipline;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Back Button */}
      <BackButton title="Mi Perfil" />
      
      {/* Header con avatar */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          {displayUser?.avatar_url ? (
            <Image source={{ uri: displayUser.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person-circle" size={120} color={theme.colors.primary} />
          )}
        </View>
        <Text style={styles.greetings}>
          {strings.greetings} <Text style={styles.userName}>{displayUser?.nombre || 'Usuario'}</Text>!
        </Text>
        <Text style={{ fontSize: typography.fontSize.sm, color: theme.colors.text.secondary }}>
          {displayUser?.ciudad || 'Sin ubicación'}
        </Text>
      </View>

      {/* Contenido principal */}
      <View style={styles.content}>
        {/* Biografía */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="document-text" size={20} color={theme.colors.primary} />
            {strings.bio}
          </Text>
          <Text style={styles.bioText}>
            {displayUser?.bio || strings.noBio}
          </Text>
        </View>

        {/* Información personal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
            Información Personal
          </Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>{strings.discipline}</Text>
              <Text style={styles.infoValue}>
                {getDisciplineTranslation(displayUser?.disciplina)}
              </Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>{strings.level}</Text>
              <Text style={styles.infoValue}>
                {displayUser?.nivel ? displayUser.nivel.charAt(0).toUpperCase() + displayUser.nivel.slice(1) : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Contacto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="call" size={20} color={theme.colors.primary} />
            Contacto
          </Text>
          <View style={styles.contactSection}>
            <Ionicons
              name="mail"
              size={24}
              color={theme.colors.primary}
              style={styles.contactIcon}
            />
            <Text style={styles.contactText}>{displayUser?.email}</Text>
          </View>
        </View>

        {/* Botón Editar Perfil */}
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('EditarPerfil')}
        >
          <Ionicons name="create" size={20} color={theme.colors.onPrimary} />
          <Text style={styles.buttonText}>{strings.editProfile}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
