import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../store/useAppStore';
import { spacing, borderRadius, typography } from '../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Medellín centro como punto inicial
const MEDELLIN_CENTER = {
  latitude: 6.2442,
  longitude: -75.5812,
};

/**
 * Componente de vista de mapa simplificada para spots de patinaje
 * Versión compatible con Expo sin módulos nativos
 */
export default function SpotMap({ 
  spots = [], 
  selectedSpot = null, 
  onSpotPress = null,
  style = null,
}) {
  const { theme } = useTheme();
  const [mapReady, setMapReady] = useState(false);

  // Iconos para diferentes tipos de spots
  const getSpotIcon = (tipo) => {
    switch (tipo) {
      case 'park':
        return 'basketball';
      case 'street':
        return 'car';
      case 'pumptrack':
        return 'refresh-circle';
      default:
        return 'location';
    }
  };

  // Color para diferentes dificultades
  const getDifficultyColor = (dificultad) => {
    switch (dificultad) {
      case 'baja':
        return '#10B981'; // Verde
      case 'media':
        return '#F59E0B'; // Amarillo
      case 'alta':
        return '#EF4444'; // Rojo
      default:
        return theme.colors.primary;
    }
  };

  // Abrir en Google Maps
  const openExternalMap = (spot) => {
    if (!spot.lat || !spot.lng) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`;
    Linking.openURL(url);
  };

  // Calcular el área que cubre todos los spots
  const getMapBounds = useMemo(() => {
    if (spots.length === 0) return null;
    
    const validSpots = spots.filter(spot => spot.lat && spot.lng);
    if (validSpots.length === 0) return null;

    const latitudes = validSpots.map(spot => spot.lat);
    const longitudes = validSpots.map(spot => spot.lng);
    
    return {
      minLat: Math.min(...latitudes),
      maxLat: Math.max(...latitudes),
      minLng: Math.min(...longitudes),
      maxLng: Math.max(...longitudes),
      centerLat: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
      centerLng: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    };
  }, [spots]);

  // Calcular posición relativa de un spot en el área visible
  const getSpotPosition = (spot) => {
    if (!getMapBounds || !spot.lat || !spot.lng) return { left: '50%', top: '50%' };
    
    const bounds = getMapBounds;
    const latRange = bounds.maxLat - bounds.minLat || 0.01;
    const lngRange = bounds.maxLng - bounds.minLng || 0.01;
    
    // Agregar padding para que los marcadores no queden en los bordes
    const padding = 0.1; // 10% de padding
    const paddedLatRange = latRange * (1 + padding * 2);
    const paddedLngRange = lngRange * (1 + padding * 2);
    
    const left = ((spot.lng - bounds.minLng + latRange * padding) / paddedLngRange) * 100;
    const top = ((bounds.maxLat - spot.lat + latRange * padding) / paddedLatRange) * 100;
    
    return {
      left: `${Math.max(5, Math.min(95, left))}%`,
      top: `${Math.max(5, Math.min(95, top))}%`,
    };
  };

  useEffect(() => {
    // Simular carga del mapa
    const timer = setTimeout(() => {
      setMapReady(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.surface,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      ...style,
    },
    mapContainer: {
      flex: 1,
      position: 'relative',
      backgroundColor: theme.isDark ? '#2a2a2a' : '#e8f4f8',
    },
    mapBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    mapGrid: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.1,
    },
    mapLine: {
      position: 'absolute',
      backgroundColor: theme.colors.text.secondary,
    },
    mapTitle: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.text.secondary,
      opacity: 0.3,
      textAlign: 'center',
    },
    mapSubtitle: {
      fontSize: typography.fontSize.md,
      color: theme.colors.text.secondary,
      opacity: 0.5,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    markersContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    marker: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      transform: [{ translateX: -16 }, { translateY: -16 }],
    },
    markerIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    selectedMarkerIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 3,
      transform: [{ translateX: -4 }, { translateY: -4 }],
    },
    mapControls: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      flexDirection: 'column',
      gap: spacing.sm,
    },
    mapButton: {
      backgroundColor: theme.colors.background.surface,
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.isDark ? '#2a2a2a' : '#e8f4f8',
    },
    loadingText: {
      color: theme.colors.text.secondary,
      fontSize: typography.fontSize.md,
      marginTop: spacing.md,
    },
    infoContainer: {
      position: 'absolute',
      bottom: spacing.md,
      left: spacing.md,
      right: spacing.md,
      backgroundColor: theme.colors.background.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    infoTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginBottom: spacing.xs,
    },
    infoSubtitle: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginBottom: spacing.sm,
    },
    infoActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    infoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      gap: spacing.xs,
    },
    infoButtonText: {
      color: '#000',
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
    },
  });

  if (!mapReady) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons 
            name="map" 
            size={64} 
            color={theme.colors.text.secondary} 
          />
          <Text style={styles.loadingText}>Cargando mapa...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        {/* Fondo del mapa con grid */}
        <View style={styles.mapBackground}>
          <Text style={styles.mapTitle}>MAPA INTERACTIVO</Text>
          <Text style={styles.mapSubtitle}>
            {spots.length} spots en Medellín
          </Text>
        </View>

        {/* Grid de fondo */}
        <View style={styles.mapGrid}>
          {Array.from({ length: 10 }).map((_, i) => (
            <View key={`v-${i}`} style={[
              styles.mapLine,
              {
                left: `${i * 10}%`,
                top: 0,
                bottom: 0,
                width: 1,
              }
            ]} />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <View key={`h-${i}`} style={[
              styles.mapLine,
              {
                top: `${i * 10}%`,
                left: 0,
                right: 0,
                height: 1,
              }
            ]} />
          ))}
        </View>

        {/* Marcadores */}
        <View style={styles.markersContainer}>
          {spots.map((spot) => {
            if (!spot.lat || !spot.lng) return null;

            const isSelected = selectedSpot?.id === spot.id;
            const iconColor = getDifficultyColor(spot.dificultad);
            const position = getSpotPosition(spot);

            return (
              <TouchableOpacity
                key={spot.id}
                style={[
                  styles.marker,
                  { left: position.left, top: position.top }
                ]}
                onPress={() => onSpotPress?.(spot)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.markerIcon,
                    isSelected && styles.selectedMarkerIcon,
                    { backgroundColor: iconColor },
                  ]}
                >
                  <Ionicons
                    name={getSpotIcon(spot.tipo)}
                    size={isSelected ? 20 : 16}
                    color="#FFFFFF"
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Controles del mapa */}
        <View style={styles.mapControls}>
          <TouchableOpacity 
            style={styles.mapButton}
            onPress={() => {
              // Abrir todos los spots en Google Maps
              if (getMapBounds) {
                const center = getMapBounds;
                const url = `https://www.google.com/maps/search/?api=1&query=${center.centerLat},${center.centerLng}`;
                Linking.openURL(url);
              }
            }}
          >
            <Ionicons 
              name="navigate" 
              size={24} 
              color={theme.colors.text.primary} 
            />
          </TouchableOpacity>
        </View>

        {/* Información del spot seleccionado */}
        {selectedSpot && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>{selectedSpot.nombre}</Text>
            <Text style={styles.infoSubtitle}>
              {selectedSpot.ciudad} • {selectedSpot.tipo} • {selectedSpot.dificultad}
            </Text>
            <View style={styles.infoActions}>
              <TouchableOpacity
                onPress={() => onSpotPress?.(null)}
              >
                <Ionicons 
                  name="close-circle" 
                  size={24} 
                  color={theme.colors.text.secondary} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.infoButton}
                onPress={() => openExternalMap(selectedSpot)}
              >
                <Ionicons name="map" size={18} color="#000" />
                <Text style={styles.infoButtonText}>Abrir en Maps</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}