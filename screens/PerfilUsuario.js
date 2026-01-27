/**
 * 👤 PerfilUsuario Screen
 * 
 * Pantalla para ver el perfil de otros usuarios/patinadores.
 * Se navega aquí desde la lista de patinadores.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useAppStore } from '../store/useAppStore';
import { spacing, typography, borderRadius } from '../theme';
import { getUsuarioById } from '../services/usuarios';
import BackButton from '../components/common/BackButton';

const { width } = Dimensions.get('window');

export default function PerfilUsuario() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const currentUser = useAppStore((state) => state.user);

  // Obtener el userId del parámetro de navegación
  const { userId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usuario, setUsuario] = useState(null);

  // Cargar datos del usuario
  useEffect(() => {
    const loadUsuario = async () => {
      if (!userId) {
        setError(t('screens.perfilUsuario.missingUser'));
        setLoading(false);
        return;
      }

      // Si el userId es el usuario actual, redirigir a Perfil
      if (userId === currentUser?.id) {
        navigation.replace('Perfil');
        return;
      }

      setLoading(true);
      console.log('🔄 PerfilUsuario: Cargando datos de:', userId);

      try {
        const data = await getUsuarioById(userId);

        if (data) {
          console.log('✅ PerfilUsuario: Usuario cargado:', data.nombre);
          setUsuario(data);
          setError(null);
        } else {
          console.error('❌ PerfilUsuario: Usuario no encontrado');
          setError(t('screens.perfilUsuario.userNotFound'));
        }
      } catch (err) {
        console.error('❌ PerfilUsuario: Error cargando:', err);
        setError(t('screens.perfilUsuario.loadError'));
      } finally {
        setLoading(false);
      }
    };

    loadUsuario();
  }, [userId, currentUser?.id, navigation]);

  // Estilos dinámicos
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xl,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
      color: theme.colors.text.primary,
      marginLeft: spacing.md,
      flex: 1,
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
      padding: spacing.xl,
    },
    errorText: {
      fontSize: typography.fontSize.md,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginTop: spacing.md,
    },
    scrollContent: {
      paddingBottom: spacing.xxl,
    },
    // Cabecera del perfil
    profileHeader: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
    avatarContainer: {
      marginBottom: spacing.md,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 3,
      borderColor: theme.colors.primary,
    },
    avatarPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.glass.background,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: theme.colors.primary,
    },
    nombre: {
      fontSize: typography.fontSize.xxl,
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginBottom: spacing.xs,
    },
    ciudad: {
      fontSize: typography.fontSize.md,
      color: theme.colors.text.secondary,
      marginBottom: spacing.sm,
    },
    ciudadRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    // Badges
    badgesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.round,
      backgroundColor: theme.colors.alpha.primary15,
      gap: spacing.xs,
    },
    badgeText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: theme.colors.primary,
    },
    // Secciones
    section: {
      marginTop: spacing.lg,
      paddingHorizontal: spacing.lg,
    },
    sectionTitle: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
      color: theme.colors.text.primary,
      marginBottom: spacing.sm,
    },
    bioCard: {
      backgroundColor: theme.colors.glass.background,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.glass.border,
    },
    bioText: {
      fontSize: typography.fontSize.md,
      color: theme.colors.text.secondary,
      lineHeight: 22,
    },
    noBioText: {
      fontSize: typography.fontSize.md,
      color: theme.colors.text.tertiary,
      fontStyle: 'italic',
    },
    // Info cards
    infoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginTop: spacing.md,
    },
    infoCard: {
      flex: 1,
      minWidth: (width - spacing.lg * 3) / 2,
      backgroundColor: theme.colors.glass.background,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.glass.border,
    },
    infoLabel: {
      fontSize: typography.fontSize.xs,
      color: theme.colors.text.tertiary,
      marginBottom: spacing.xs,
      textTransform: 'uppercase',
    },
    infoValue: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.medium,
      color: theme.colors.text.primary,
    },
    // Acciones
    actionsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.md,
      marginTop: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      gap: spacing.sm,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
    },
    secondaryButton: {
      backgroundColor: theme.colors.glass.background,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    primaryButtonText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
      color: theme.colors.onPrimary,
    },
    secondaryButtonText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
      color: theme.colors.primary,
    },
  }), [theme]);

  // Traducir nivel
  const getNivelLabel = (nivel) => {
    const niveles = {
      principiante: t('screens.shared.levels.principiante', 'Principiante'),
      intermedio: t('screens.shared.levels.intermedio', 'Intermedio'),
      avanzado: t('screens.shared.levels.avanzado', 'Avanzado'),
      profesional: t('screens.shared.levels.profesional', 'Profesional'),
    };
    return niveles[nivel] || nivel || t('common.notDefined');
  };

  // Traducir disciplina
  const getDisciplinaLabel = (disciplina) => {
    const disciplinas = {
      street: t('screens.shared.disciplines.street', 'Street'),
      park: t('screens.shared.disciplines.park', 'Park'),
      freestyle: t('screens.shared.disciplines.freestyle', 'Freestyle'),
      slalom: t('screens.shared.disciplines.slalom', 'Slalom'),
      downhill: t('screens.shared.disciplines.downhill', 'Downhill'),
      dance: t('screens.shared.disciplines.dance', 'Dance'),
    };
    return disciplinas[disciplina] || disciplina || t('common.notDefined');
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>{t('common.loading')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  // Error state
  if (error || !usuario) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>{t('screens.perfilUsuario.profileTitle')}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color={theme.colors.text.tertiary} />
          <Text style={styles.errorText}>{error || t('screens.perfilUsuario.userNotFound')}</Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton, { marginTop: spacing.lg }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.primaryButtonText}>{t('common.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>{usuario.nombre || t('screens.perfilUsuario.profileTitle')}</Text>
      </View>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {usuario.avatar_url ? (
              <Image
                source={{ uri: usuario.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={50} color={theme.colors.text.tertiary} />
              </View>
            )}
          </View>

          <Text style={styles.nombre}>{usuario.nombre}</Text>

          {usuario.ciudad && (
            <View style={styles.ciudadRow}>
              <Ionicons name="location-outline" size={16} color={theme.colors.text.secondary} />
              <Text style={styles.ciudad}>{usuario.ciudad}</Text>
            </View>
          )}

          {/* Badges */}
          <View style={styles.badgesContainer}>
            {usuario.nivel && (
              <View style={styles.badge}>
                <Ionicons name="trophy-outline" size={14} color={theme.colors.primary} />
                <Text style={styles.badgeText}>{getNivelLabel(usuario.nivel)}</Text>
              </View>
            )}
            {usuario.disciplina && (
              <View style={styles.badge}>
                <Ionicons name="bicycle-outline" size={14} color={theme.colors.primary} />
                <Text style={styles.badgeText}>{getDisciplinaLabel(usuario.disciplina)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bio Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('screens.perfilUsuario.bioTitle')}</Text>
          <View style={styles.bioCard}>
            {usuario.bio ? (
              <Text style={styles.bioText}>{usuario.bio}</Text>
            ) : (
              <Text style={styles.noBioText}>{t('screens.perfilUsuario.noBio')}</Text>
            )}
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('screens.perfilUsuario.infoTitle')}</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>{t('screens.perfilUsuario.level')}</Text>
              <Text style={styles.infoValue}>{getNivelLabel(usuario.nivel)}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>{t('screens.perfilUsuario.discipline')}</Text>
              <Text style={styles.infoValue}>{getDisciplinaLabel(usuario.disciplina)}</Text>
            </View>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>{t('screens.perfilUsuario.city')}</Text>
              <Text style={styles.infoValue}>
                {usuario.ciudad || t('common.notSpecified')}
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>{t('screens.perfilUsuario.memberSince')}</Text>
              <Text style={styles.infoValue}>
                {usuario.created_at 
                  ? new Date(usuario.created_at).toLocaleDateString(i18n.language || undefined, { 
                      year: 'numeric', 
                      month: 'short' 
                    })
                  : t('common.notAvailable')
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
            <Ionicons name="chatbubble-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.secondaryButtonText}>{t('screens.perfilUsuario.message')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
            <Ionicons name="person-add-outline" size={20} color={theme.colors.onPrimary} />
            <Text style={styles.primaryButtonText}>{t('screens.perfilUsuario.follow')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
