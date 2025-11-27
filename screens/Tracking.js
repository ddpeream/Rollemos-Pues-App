/**
 * 🗺️ Tracking Screen - GPS Route Tracker
 * 
 * Pantalla de tracking de rutas en tiempo real con diseño moderno.
 * 
 * Características:
 * - Mapa a pantalla completa con ubicación en vivo
 * - Polyline que se dibuja en tiempo real
 * - Botón flotante animado (Start/Pause/Stop)
 * - Stats overlay con glassmorphism
 * - Animaciones fluidas
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Animated,
  StatusBar,
  Alert,
  SafeAreaView,
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import { useRouteTracker, TRACKER_STATUS } from '../hooks/useRouteTracker';

const { width, height } = Dimensions.get('window');

export default function Tracking() {
  const navigation = useNavigation();
  const { theme } = useAppStore();
  const {
    status,
    currentLocation,
    routeCoordinates,
    distance,
    duration,
    speed,
    avgSpeed,
    maxSpeed,
    calories,
    hasPermission,
    error,
    requestLocationPermission,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
  } = useRouteTracker();

  const mapRef = useRef(null);
  const [showStats, setShowStats] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const statsOpacity = useRef(new Animated.Value(1)).current;

  // Pedir permisos al montar la pantalla
  useEffect(() => {
    const initPermissions = async () => {
      if (!hasPermission) {
        try {
          console.log('🔐 Solicitando permisos en Tracking...');
          await requestLocationPermission();
        } catch (err) {
          console.error('❌ Error en inicialización de permisos:', err);
        }
      }
    };
    initPermissions();
  }, [hasPermission, requestLocationPermission]);

  // Animación de pulso para botón de tracking
  useEffect(() => {
    if (status === TRACKER_STATUS.TRACKING) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status]);

  // Centrar mapa en ubicación actual
  useEffect(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }
  }, [currentLocation]);

  // Formatear tiempo (segundos -> HH:MM:SS)
  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
      .toString()
      .padStart(2, '0')}`;
  };

  // Formatear distancia (metros -> km)
  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${meters.toFixed(0)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  };

  // Manejar botón principal
  const handleMainButton = async () => {
    if (status === TRACKER_STATUS.IDLE) {
      // Solicitar permisos si no los tiene
      if (!hasPermission) {
        const granted = await requestLocationPermission();
        if (!granted) {
          Alert.alert(
            'Permisos requeridos',
            'Necesitamos acceso a tu ubicación para rastrear tu ruta.',
            [{ text: 'OK' }]
          );
          return;
        }
      }
      await startTracking();
    } else if (status === TRACKER_STATUS.TRACKING) {
      pauseTracking();
    } else if (status === TRACKER_STATUS.PAUSED) {
      resumeTracking();
    }
  };

  // Manejar detener tracking
  const handleStopTracking = () => {
    if (routeCoordinates.length < 10) {
      Alert.alert(
        '¿Descartar ruta?',
        'La ruta es muy corta. ¿Deseas descartarla?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Descartar', style: 'destructive', onPress: stopTracking },
        ]
      );
    } else {
      Alert.alert(
        '¿Finalizar ruta?',
        `Has recorrido ${formatDistance(distance)} en ${formatDuration(duration)}. ¿Deseas guardar esta ruta?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Guardar',
            onPress: async () => {
              await stopTracking();
              Alert.alert('✅ Ruta guardada', 'Tu ruta se ha guardado exitosamente');
            },
          },
        ]
      );
    }
  };

  // Toggle stats visibility
  const toggleStats = () => {
    const toValue = showStats ? 0 : 1;
    Animated.timing(statsOpacity, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setShowStats(!showStats);
  };

  // Configuración de colores según estado
  const getButtonConfig = () => {
    switch (status) {
      case TRACKER_STATUS.TRACKING:
        return {
          icon: 'pause',
          color: '#FF9500',
          label: 'Pausar',
        };
      case TRACKER_STATUS.PAUSED:
        return {
          icon: 'play',
          color: '#4DD7D0',
          label: 'Reanudar',
        };
      default:
        return {
          icon: 'play',
          color: '#34C759',
          label: 'Iniciar',
        };
    }
  };

  const buttonConfig = getButtonConfig();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Mapa */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={theme.isDark ? darkMapStyle : []}
        showsUserLocation
        showsMyLocationButton={false}
        followsUserLocation={status === TRACKER_STATUS.TRACKING}
        initialRegion={{
          latitude: currentLocation?.latitude || 4.7110,
          longitude: currentLocation?.longitude || -74.0055,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
        onError={(err) => {
          console.error('❌ Error en MapView:', err);
          Alert.alert('Error del Mapa', 'Hubo un problema al cargar el mapa. Intenta reiniciar la app.');
        }}
      >
        {/* Polyline de la ruta */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={theme.colors.primary}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Marcador de inicio */}
        {routeCoordinates.length > 0 && (
          <Marker coordinate={routeCoordinates[0]}>
            <View style={[styles.startMarker, { backgroundColor: '#34C759' }]}>
              <Ionicons name="flag" size={16} color="#FFFFFF" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.background.overlay }]}>
        <TouchableOpacity 
          onPress={() => {
            console.log('🔙 Volviendo a rutinas...');
            navigation.navigate('RoutesHistoryScreen');
          }}
          style={styles.headerButton}
        >
          <Ionicons name="list-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          {status === TRACKER_STATUS.IDLE && 'Listo para grabar'}
          {status === TRACKER_STATUS.TRACKING && '🔴 Grabando...'}
          {status === TRACKER_STATUS.PAUSED && '⏸️ Pausado'}
        </Text>
        <TouchableOpacity
          onPress={() => {
            if (mapRef.current && currentLocation) {
              mapRef.current.animateToRegion({
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              });
            }
          }}
          style={styles.headerButton}
        >
          <Ionicons name="locate" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Overlay */}
      <Animated.View
        style={[
          styles.statsContainer,
          { backgroundColor: theme.colors.background.overlay, opacity: statsOpacity },
        ]}
        pointerEvents={showStats ? 'auto' : 'none'}
      >
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="speedometer-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
              {speed.toFixed(1)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>
              km/h
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: theme.colors.border.primary }]} />

          <View style={styles.statItem}>
            <Ionicons name="navigate-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
              {formatDistance(distance)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>
              Distancia
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: theme.colors.border.primary }]} />

          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
              {formatDuration(duration)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>
              Tiempo
            </Text>
          </View>
        </View>

        <View style={[styles.secondaryStatsRow, { marginTop: 16 }]}>
          <View style={styles.secondaryStatItem}>
            <Text style={[styles.secondaryStatLabel, { color: theme.colors.text.tertiary }]}>
              Velocidad promedio
            </Text>
            <Text style={[styles.secondaryStatValue, { color: theme.colors.text.primary }]}>
              {avgSpeed.toFixed(1)} km/h
            </Text>
          </View>

          <View style={styles.secondaryStatItem}>
            <Text style={[styles.secondaryStatLabel, { color: theme.colors.text.tertiary }]}>
              Velocidad máxima
            </Text>
            <Text style={[styles.secondaryStatValue, { color: theme.colors.text.primary }]}>
              {maxSpeed.toFixed(1)} km/h
            </Text>
          </View>

          <View style={styles.secondaryStatItem}>
            <Text style={[styles.secondaryStatLabel, { color: theme.colors.text.tertiary }]}>
              Calorías
            </Text>
            <Text style={[styles.secondaryStatValue, { color: theme.colors.text.primary }]}>
              {calories} kcal
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        {/* Botón de Stop (solo visible cuando está tracking o pausado) */}
        {status !== TRACKER_STATUS.IDLE && (
          <TouchableOpacity
            onPress={handleStopTracking}
            style={[styles.stopButton, { backgroundColor: theme.colors.background.overlay }]}
          >
            <Ionicons name="stop" size={28} color="#FF3B30" />
          </TouchableOpacity>
        )}

        {/* Botón Principal (Start/Pause/Resume) */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            onPress={handleMainButton}
            style={[styles.mainButton, { backgroundColor: buttonConfig.color }]}
            activeOpacity={0.8}
          >
            <Ionicons name={buttonConfig.icon} size={40} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Error Message */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: theme.colors.background.overlay }]}>
          <Ionicons name="alert-circle" size={20} color="#FF3B30" />
          <Text style={[styles.errorText, { color: '#FF3B30' }]}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => {
              console.log('🔄 Reintentando permisos...');
              requestLocationPermission();
            }}
            style={{ paddingLeft: 12 }}
          >
            <Ionicons name="refresh" size={18} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// Dark map style
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },

  // Stats Overlay
  statsContainer: {
    position: 'absolute',
    top: 140,
    left: 16,
    right: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 60,
    marginHorizontal: 12,
  },
  secondaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  secondaryStatLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  secondaryStatValue: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Controls
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  mainButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stopButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // Marker
  startMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },

  // Error
  errorContainer: {
    position: 'absolute',
    top: 300,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
});
