import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../store/useAppStore';
import { spacing, borderRadius, typography } from '../theme';

/**
 * Componente de tarjeta para mostrar información de un spot
 * Diseño elegante y responsive para usar en lista y mapa
 */
export default function SpotCard({ 
  spot, 
  onPress = null,
  onMapPress = null,
  isSelected = false,
  compact = false,
  style = null 
}) {
  const { theme } = useTheme();

  const difficultyColor = useMemo(() => {
    switch (spot.dificultad) {
      case 'baja':
        return '#10B981'; // Verde
      case 'media':
        return '#F59E0B'; // Amarillo
      case 'alta':
        return '#EF4444'; // Rojo
      default:
        return theme.colors.primary;
    }
  }, [spot.dificultad, theme.colors.primary]);

  const typeIcon = useMemo(() => {
    switch (spot.tipo) {
      case 'park':
        return 'basketball';
      case 'street':
        return 'car';
      case 'pumptrack':
        return 'refresh-circle';
      default:
        return 'location';
    }
  }, [spot.tipo]);

  const openExternalMap = () => {
    if (!spot.lat || !spot.lng) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`;
    Linking.openURL(url);
  };

  const handlePress = () => {
    onPress?.(spot);
  };

  const handleMapPress = (e) => {
    e.stopPropagation();
    onMapPress?.(spot);
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background.surface,
      borderRadius: borderRadius.lg,
      padding: compact ? spacing.sm : spacing.md,
      borderWidth: isSelected ? 2 : 1,
      borderColor: isSelected ? theme.colors.primary : theme.colors.glass.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isSelected ? 0.15 : 0.08,
      shadowRadius: isSelected ? 6 : 4,
      elevation: isSelected ? 4 : 2,
      marginBottom: compact ? spacing.sm : spacing.md,
      ...style,
    },
    imageContainer: {
      borderRadius: borderRadius.md,
      overflow: 'hidden',
      marginBottom: spacing.sm,
    },
    image: {
      width: '100%',
      height: compact ? 120 : 180,
      resizeMode: 'cover',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.xs,
    },
    title: {
      flex: 1,
      fontSize: compact ? typography.fontSize.md : typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginRight: spacing.sm,
    },
    difficultyBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      alignSelf: 'flex-start',
    },
    difficultyText: {
      color: '#FFFFFF',
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold,
      textTransform: 'capitalize',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
      gap: spacing.xs,
    },
    metaText: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginLeft: spacing.xs,
    },
    description: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.primary,
      lineHeight: 20,
      marginBottom: spacing.md,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    locationInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    locationText: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
      fontWeight: typography.fontWeight.medium,
    },
    mapButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      gap: spacing.xs,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    mapButtonText: {
      color: '#000',
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
    },
    compactFooter: {
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
  });

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: spot.foto }} style={styles.image} />
      </View>

      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {spot.nombre}
        </Text>
        <View 
          style={[
            styles.difficultyBadge, 
            { backgroundColor: difficultyColor }
          ]}
        >
          <Text style={styles.difficultyText}>
            {spot.dificultad}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Ionicons 
          name={typeIcon} 
          size={16} 
          color={theme.colors.text.secondary} 
        />
        <Text style={styles.metaText}>
          {spot.tipo.charAt(0).toUpperCase() + spot.tipo.slice(1)}
        </Text>
        <Text style={styles.metaText}>•</Text>
        <Ionicons 
          name="location" 
          size={16} 
          color={theme.colors.text.secondary} 
        />
        <Text style={styles.metaText}>
          {spot.ciudad}
        </Text>
      </View>

      {!compact && (
        <Text style={styles.description} numberOfLines={3}>
          {spot.descripcion}
        </Text>
      )}

      <View style={[styles.footer, compact && styles.compactFooter]}>
        <View style={styles.locationInfo}>
          <Ionicons 
            name="compass" 
            size={16} 
            color={theme.colors.text.secondary} 
          />
          <Text style={styles.locationText}>
            {spot.lat && spot.lng ? 
              `${spot.lat.toFixed(4)}, ${spot.lng.toFixed(4)}` : 
              'Ubicación no disponible'
            }
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.mapButton}
          onPress={onMapPress ? handleMapPress : openExternalMap}
          activeOpacity={0.8}
        >
          <Ionicons name="map" size={18} color="#000" />
          <Text style={styles.mapButtonText}>
            {onMapPress ? 'Ver aquí' : 'Google Maps'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}