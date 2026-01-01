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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { useRouteTracker, TRACKER_STATUS } from '../hooks/useRouteTracker';

const { width, height } = Dimensions.get('window');

export default function Tracking() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDark } = useAppStore();
  const { t } = useTranslation();
  
  // 📜 Ruta histórica recibida desde RoutesHistory
  const [historicalRoute, setHistoricalRoute] = useState(null);
  
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

  // 📜 Recibir ruta histórica desde params
  useEffect(() => {
    if (route.params?.historicalRoute) {
      console.log('📜 Ruta histórica recibida:', route.params.historicalRoute.id);
      setHistoricalRoute(route.params.historicalRoute);
      
      // Ajustar mapa para mostrar toda la ruta histórica
      if (mapRef.current && route.params.historicalRoute.coordinates?.length > 0) {
        setTimeout(() => {
          mapRef.current.fitToCoordinates(route.params.historicalRoute.coordinates, {
            edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
            animated: true,
          });
        }, 500);
      }
    }
  }, [route.params?.historicalRoute]);

  // Función para cerrar/ocultar la ruta histórica
  const clearHistoricalRoute = () => {
    setHistoricalRoute(null);
    // Limpiar el param para evitar que vuelva a aparecer
    navigation.setParams({ historicalRoute: undefined });
  };

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
            t('screens.tracking.permissionsTitle'),
            t('screens.tracking.permissionsMessage'),
            [{ text: t('common.ok') }]
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
        t('screens.tracking.discardTitle'),
        t('screens.tracking.discardMessage'),
        [
          { text: t('screens.tracking.cancel'), style: 'cancel' },
          { text: t('screens.tracking.discard'), style: 'destructive', onPress: stopTracking },
        ]
      );
    } else {
      Alert.alert(
        t('screens.tracking.finishTitle'),
        t('screens.tracking.finishMessage', {
          distance: formatDistance(distance),
          duration: formatDuration(duration),
        }),
        [
          { text: t('screens.tracking.cancel'), style: 'cancel' },
          {
            text: t('screens.tracking.save'),
            onPress: async () => {
              await stopTracking();
              Alert.alert(t('screens.tracking.savedTitle'), t('screens.tracking.savedMessage'));
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
          label: t('screens.tracking.pause'),
        };
      case TRACKER_STATUS.PAUSED:
        return {
          icon: 'play',
          color: '#4DD7D0',
          label: t('screens.tracking.resume'),
        };
      default:
        return {
          icon: 'play',
          color: '#34C759',
          label: t('screens.tracking.start'),
        };
    }
  };

  const buttonConfig = getButtonConfig();
  const statsCardStyle = {
    backgroundColor: isDark ? 'rgba(77, 215, 208, 0.08)' : 'rgba(15, 23, 42, 0.04)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
  };
  const statsContainerStyle = {
    backgroundColor: isDark ? 'rgba(12, 16, 24, 0.7)' : 'rgba(255, 255, 255, 0.75)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
  };
  const statsTextPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const statsTextSecondary = isDark ? '#E2E8F0' : '#1E293B';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Mapa */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={isDark ? darkMapStyle : []}
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
          Alert.alert(t('screens.tracking.mapErrorTitle'), t('screens.tracking.mapErrorMessage'));
        }}
      >
        {/* 📜 Polyline de la ruta HISTÓRICA (gris) */}
        {historicalRoute?.coordinates?.length > 1 && (
          <Polyline
            coordinates={historicalRoute.coordinates}
            strokeColor="#888888"
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
            lineDashPattern={[0]} // Línea sólida
          />
        )}

        {/* 📜 Marcador de inicio de ruta histórica */}
        {historicalRoute?.coordinates?.length > 0 && (
          <Marker coordinate={historicalRoute.coordinates[0]}>
            <View style={[styles.historicalMarker, { backgroundColor: '#888888' }]}>
              <Ionicons name="flag" size={16} color="#FFFFFF" />
            </View>
          </Marker>
        )}

        {/* 📜 Marcador de fin de ruta histórica */}
        {historicalRoute?.coordinates?.length > 1 && (
          <Marker coordinate={historicalRoute.coordinates[historicalRoute.coordinates.length - 1]}>
            <View style={[styles.historicalMarker, { backgroundColor: '#666666' }]}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
          </Marker>
        )}

        {/* Polyline de la ruta ACTUAL (color primario) */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={theme.colors.primary}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Marcador de inicio de ruta actual */}
        {routeCoordinates.length > 0 && (
          <Marker coordinate={routeCoordinates[0]}>
            <View style={[styles.startMarker, { backgroundColor: theme.colors.primary }]}> 
              <MaterialCommunityIcons name="roller-skate" size={20} color={theme.colors.onPrimary} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* 📜 Badge de ruta histórica */}
      {historicalRoute && (
        <View style={[styles.historicalBadge, { backgroundColor: isDark ? 'rgba(136, 136, 136, 0.95)' : 'rgba(100, 100, 100, 0.95)' }]}>
          <View style={styles.historicalBadgeContent}>
            <Ionicons name="time-outline" size={18} color="#FFFFFF" />
            <View style={styles.historicalBadgeText}>
              <Text style={styles.historicalBadgeTitle} numberOfLines={1}>
                {historicalRoute.name || 'Ruta guardada'}
              </Text>
              <Text style={styles.historicalBadgeStats}>
                {(historicalRoute.distance / 1000).toFixed(1)} km • {Math.floor(historicalRoute.duration / 60)} min
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={clearHistoricalRoute}
            style={styles.historicalBadgeClose}
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? 'rgba(11, 15, 20, 0.85)' : 'rgba(255, 255, 255, 0.9)' }]}>
        <TouchableOpacity 
          onPress={() => {
            console.log('🔙 Volviendo a rutinas...');
            navigation.navigate('RoutesHistoryScreen');
          }}
          style={[styles.headerButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}
        >
          <Ionicons name="list-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          {status === TRACKER_STATUS.IDLE && t('screens.tracking.statusIdle')}
          {status === TRACKER_STATUS.TRACKING && t('screens.tracking.statusTracking')}
          {status === TRACKER_STATUS.PAUSED && t('screens.tracking.statusPaused')}
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
          style={[styles.headerButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}
        >
          <Ionicons name="locate" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Overlay - Diseño compacto horizontal */}
      {status !== TRACKER_STATUS.IDLE && (
        <Animated.View
          style={[
            styles.statsContainer,
            statsContainerStyle,
            { opacity: statsOpacity },
          ]}
          pointerEvents={showStats ? 'auto' : 'none'}
        >
          {/* Fila principal de stats */}
          <View style={styles.mainStatsRow}>
            <View style={styles.mainStatItem}>
              <Text style={[styles.mainStatValue, { color: theme.colors.primary }]}>
                {formatDistance(distance)}
              </Text>
              <Text style={[styles.mainStatLabel, { color: statsTextSecondary }]}>
                {t('screens.tracking.distance')}
              </Text>
            </View>

            <View style={[styles.statDividerVertical, { backgroundColor: theme.colors.border }]} />

            <View style={styles.mainStatItem}>
              <Text style={[styles.mainStatValue, { color: statsTextPrimary }]}>
                {formatDuration(duration)}
              </Text>
              <Text style={[styles.mainStatLabel, { color: statsTextSecondary }]}>
                {t('screens.tracking.time')}
              </Text>
            </View>

            <View style={[styles.statDividerVertical, { backgroundColor: theme.colors.border }]} />

            <View style={styles.mainStatItem}>
              <Text style={[styles.mainStatValue, { color: statsTextPrimary }]}>
                {speed.toFixed(1)}
              </Text>
              <Text style={[styles.mainStatLabel, { color: statsTextSecondary }]}>
                km/h
              </Text>
            </View>
          </View>

          {/* Fila secundaria compacta */}
          <View style={styles.secondaryStatsRow}>
            <View style={styles.miniStatItem}>
              <Ionicons name="trending-up" size={12} color={theme.colors.primary} />
              <Text style={[styles.miniStatValue, { color: statsTextSecondary }]}>
                {avgSpeed.toFixed(1)}
              </Text>
            </View>
            <View style={styles.miniStatItem}>
              <Ionicons name="flash" size={12} color="#FF9500" />
              <Text style={[styles.miniStatValue, { color: statsTextSecondary }]}>
                {maxSpeed.toFixed(1)}
              </Text>
            </View>
            <View style={styles.miniStatItem}>
              <Ionicons name="flame" size={12} color="#FF3B30" />
              <Text style={[styles.miniStatValue, { color: statsTextSecondary }]}>
                {calories}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Control Buttons - Diseño elegante */}
      <View style={styles.controlsContainer}>
        <View style={[styles.controlsWrapper, { backgroundColor: isDark ? 'rgba(12, 16, 24, 0.85)' : 'rgba(255, 255, 255, 0.9)' }]}>
          {/* Botón de Stop */}
          {status !== TRACKER_STATUS.IDLE && (
            <TouchableOpacity
              onPress={handleStopTracking}
              style={styles.stopButton}
              activeOpacity={0.7}
            >
              <View style={styles.stopButtonInner}>
                <Ionicons name="stop" size={20} color={theme.colors.onSecondary} />
              </View>
            </TouchableOpacity>
          )}

          {/* Botón Principal (Start/Pause/Resume) */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              onPress={handleMainButton}
              style={[
                styles.mainButton,
                { backgroundColor: buttonConfig.color },
                status === TRACKER_STATUS.IDLE && styles.mainButtonLarge,
              ]}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={buttonConfig.icon} 
                size={status === TRACKER_STATUS.IDLE ? 32 : 28} 
                color={theme.colors.onPrimary} 
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Placeholder para balance cuando hay botón stop */}
          {status !== TRACKER_STATUS.IDLE && (
            <View style={styles.placeholderButton} />
          )}
        </View>
      </View>

      {/* Error Message */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: isDark ? 'rgba(11, 15, 20, 0.9)' : 'rgba(255, 255, 255, 0.95)' }]}>
          <Ionicons name="alert-circle" size={20} color="#FF3B30" />
          <Text style={[styles.errorText, { color: theme.colors.text.primary }]}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => {
              console.log('🔄 Reintentando permisos...');
              requestLocationPermission();
            }}
            style={{ paddingLeft: 12 }}
          >
            <Ionicons name="refresh" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// Dark map style - Same as Spots.js
const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#1d2c4d" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#8ec3b9" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#1a3646" }]
  },
  {
    "featureType": "administrative.country",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#4b6878" }]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#64779e" }]
  },
  {
    "featureType": "administrative.province",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#4b6878" }]
  },
  {
    "featureType": "landscape.man_made",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#334e87" }]
  },
  {
    "featureType": "landscape.natural",
    "elementType": "geometry",
    "stylers": [{ "color": "#023e58" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#283d6a" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#6f9ba5" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#1d2c4d" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#023e58" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#3C7680" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#304a7d" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#98a5be" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#1d2c4d" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#2c6675" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#255763" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#b0d5ce" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#023e58" }]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#98a5be" }]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#1d2c4d" }]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#283d6a" }]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [{ "color": "#3a4762" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#0e1626" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#4e6d70" }]
  }
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
    paddingTop: 50,
    paddingBottom: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Stats Overlay - Nuevo diseño compacto
  statsContainer: {
    position: 'absolute',
    bottom: 140,
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  mainStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  mainStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  mainStatValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  mainStatLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDividerVertical: {
    width: 1,
    height: 36,
    opacity: 0.3,
  },
  secondaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.15)',
    gap: 24,
  },
  miniStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniStatValue: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Controls - Nuevo diseño elegante
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  controlsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 40,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  mainButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  mainButtonLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  stopButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderButton: {
    width: 44,
    height: 44,
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

  // 📜 Marcador de ruta histórica
  historicalMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // 📜 Badge de ruta histórica
  historicalBadge: {
    position: 'absolute',
    top: 130,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  historicalBadgeContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historicalBadgeText: {
    flex: 1,
  },
  historicalBadgeTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  historicalBadgeStats: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  historicalBadgeClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  // Error
  errorContainer: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
});
