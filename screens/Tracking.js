/**
 * 🗺️ Tracking Screen - GPS Route Tracker + Live Skaters + Spots Map
 * 
 * Pantalla unificada que combina:
 * - Seguimiento de rutas en tiempo real con GPS
 * - Visualización de otros patinadores en vivo
 * - Mapa de lugares especiales para patinar
 * 
 * Características:
 * - Mapa a pantalla completa con ubicación en vivo
 * - Polyline que se dibuja en tiempo real
 * - Visualización de skaters en tiempo real
 * - Markers de spots (lugares especiales)
 * - Botón flotante animado (Start/Pause/Stop)
 * - Stats overlay con glassmorphism
 * - Toggle para mostrar/ocultar spots
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  ScrollView,
  Modal,
  Image,
} from 'react-native';
import MapView, { Polyline, Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { useRouteTracker, TRACKER_STATUS } from '../hooks/useRouteTracker';
import { useRodadas } from '../hooks/useRodadas';
import { useSpots } from '../hooks/useSpots';
import { useAuth } from '../hooks/useAuth';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { fetchTrackingLive, subscribeTrackingLive, unsubscribeTrackingLive } from '../services/tracking';
import CreateRodadaModal from '../components/CreateRodadaModal';

const { width, height } = Dimensions.get('window');

export default function Tracking() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDark } = useAppStore();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // 🛼 Rodadas
  const { 
    rodadas, 
    fetchRodadas, 
    isLoading: isLoadingRodadas,
    getRodadasProximas,
    getRodadasEnCurso,
    unirseARodada,
    salirDeRodada,
    eliminarRodada,
    verificarParticipacion,
  } = useRodadas();
  
  // 🛹 Spots (Lugares especiales para patinar)
  const { 
    spots, 
    loading: loadingSpots,
    loadSpots,
  } = useSpots();
  
  const [deletingRodada, setDeletingRodada] = useState(false);
  const [showCreateRodadaModal, setShowCreateRodadaModal] = useState(false);
  const [showRodadasList, setShowRodadasList] = useState(false);
  const [showRodadaDetail, setShowRodadaDetail] = useState(false);
  const [selectedRodada, setSelectedRodada] = useState(null);
  const [showRodadaBadge, setShowRodadaBadge] = useState(true);
  const [joiningRodada, setJoiningRodada] = useState(null); // ID de rodada que se está uniendo
  const [isUserJoined, setIsUserJoined] = useState(false); // Si el usuario está unido a la rodada seleccionada
  const [checkingJoin, setCheckingJoin] = useState(false); // Verificando participación
  const [ mapType, setMapType ] = useState('hybrid');
  const [isMapAutoCenter, setIsMapAutoCenter] = useState(true);

  // 👥 Live Skaters (Otros patinadores en tiempo real)
  const [liveSkaters, setLiveSkaters] = useState([]);
  const [livePaths, setLivePaths] = useState({});
  const [showSpotsOnMap, setShowSpotsOnMap] = useState(true); // Toggle para mostrar spots

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

  useEffect(() => {
    if (route.params?.historicalRoute) return;
    if (!historicalRoute?.coordinates?.length || !mapRef.current) return;

    mapRef.current.fitToCoordinates(historicalRoute.coordinates, {
      edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
      animated: true,
    });
  }, [historicalRoute, route.params?.historicalRoute]);

  useEffect(() => {
    const rodadaId = route.params?.rodadaId;
    if (!rodadaId) return;

    const found = rodadas.find((rodada) => rodada.id === rodadaId);
    if (!found) return;

    setSelectedRodada(found);
    setShowRodadasList(false);
    setShowRodadaDetail(true);
    setShowRodadaBadge(false);

    navigation.setParams({ rodadaId: undefined });
  }, [route.params?.rodadaId, rodadas, navigation]);

  // 🛼 Cargar rodadas al entrar a la pantalla
  useFocusEffect(
    React.useCallback(() => {
      console.log('🛼 Cargando rodadas...');
      fetchRodadas({ soloProximas: false });
      loadSpots(); // 🛹 Cargar spots también
    }, [])
  );

  // 👥 Normalizar datos de patinador en vivo
  const normalizeLiveRecord = (record) => {
    if (!record) return null;
    return {
      userId: record.user_id,
      lat: Number(record.lat),
      lng: Number(record.lng),
      speed: record.speed,
      heading: record.heading,
      isActive: record.is_active,
      updatedAt: record.updated_at,
      usuario: record.usuarios || null,
    };
  };

  // 👥 Obtener género del patinador
  const getSkaterGender = (skater) => {
    const raw =
      skater?.usuario?.genero ||
      skater?.usuario?.gender ||
      skater?.usuario?.sexo ||
      '';
    const value = String(raw).toLowerCase();
    if (value.startsWith('f') || value.includes('mujer')) return 'female';
    if (value.startsWith('m') || value.includes('hombre')) return 'male';
    return 'male';
  };

  // 👥 Obtener color del patinador según género
  const getSkaterColor = (skater) => {
    return getSkaterGender(skater) === 'female' ? '#FF4FA3' : '#19C37D';
  };

  // 👥 Filtrar patinadores visibles
  const visibleLiveSkaters = useMemo(() => {
    const visible = liveSkaters.filter((skater) => {
      if (!skater.isActive) return false;
      if (!Number.isFinite(skater.lat) || !Number.isFinite(skater.lng)) return false;
      if (user?.id && skater.userId === user.id) return false;
      return true;
    });
    return visible;
  }, [liveSkaters, user]);

  // ?? Agregar punto a la ruta de un patinador
  const appendLivePath = (userId, lat, lng) => {
    if (!userId) return;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (user?.id && userId === user.id) return;
    setLivePaths((prev) => {
      const prevPoints = prev[userId]?.points || [];
      const last = prevPoints[prevPoints.length - 1];
      if (last && last.latitude === lat && last.longitude === lng) {
        return prev;
      }
      const nextPoints = [...prevPoints, { latitude: lat, longitude: lng }];
      const maxPoints = 200;
      if (nextPoints.length > maxPoints) {
        nextPoints.splice(0, nextPoints.length - maxPoints);
      }
      return {
        ...prev,
        [userId]: { points: nextPoints },
      };
    });
  };

  // ?? Cargar patinadores en vivo inicial
  useEffect(() => {
    let isMounted = true;

    const loadLiveSkaters = async () => {
      console.log('?? Cargando patinadores en vivo...');
      const { data } = await fetchTrackingLive();
      if (!isMounted) return;
      const normalized = (data || []).map(normalizeLiveRecord).filter(Boolean);
      console.log('?? Patinadores normalizados:', normalized);
      setLiveSkaters(normalized);
      normalized.forEach((skater) => {
        appendLivePath(skater.userId, skater.lat, skater.lng);
      });
    };

    loadLiveSkaters();

    // ?? Suscribirse a cambios en tiempo real
    const channel = subscribeTrackingLive((payload) => {
      if (!isMounted) return;
      const record = payload.new || payload.old;
      const normalized = normalizeLiveRecord(record);
      if (!normalized) return;

      if (payload.eventType === 'DELETE' || normalized.isActive === false) {
        setLiveSkaters((prev) => prev.filter((item) => item.userId !== normalized.userId));
        setLivePaths((prev) => {
          const next = { ...prev };
          delete next[normalized.userId];
          return next;
        });
        return;
      }

      setLiveSkaters((prev) => {
        const index = prev.findIndex((item) => item.userId === normalized.userId);
        if (index === -1) {
          return [...prev, normalized];
        }
        const next = [...prev];
        next[index] = { ...next[index], ...normalized };
        return next;
      });
      appendLivePath(normalized.userId, normalized.lat, normalized.lng);
    });

    return () => {
      isMounted = false;
      unsubscribeTrackingLive(channel);
    };
  }, []);

  // 📡 Suscribirse a cambios en tiempo real de rodadas (solo cuando se muestre el mapa)
  useRealtimeSubscription('rodadas', (payload) => {
    console.log('🏃 Nueva rodada o cambio detectado');
    fetchRodadas({ soloProximas: false });
  }, showRodadasList);

  // 📡 Suscribirse a cambios en participantes de rodadas
  useRealtimeSubscription('rodadas_participantes', (payload) => {
    console.log('👥 Participantes de rodada actualizados');
    fetchRodadas({ soloProximas: false });
  }, showRodadasList);

  // 🛼 Función para unirse a una rodada
  const handleJoinRodada = async (rodada) => {
    if (!user?.id) {
      Alert.alert('Iniciar sesión', 'Debes iniciar sesión para unirte a una rodada');
      return;
    }
    
    // El creador no puede unirse a su propia rodada
    if (rodada.organizador_id === user.id) {
      Alert.alert('Eres el organizador', 'No puedes unirte a tu propia rodada');
      return;
    }

    setJoiningRodada(rodada.id);
    try {
      const result = await unirseARodada(rodada.id, user.id);
      if (result.success) {
        if (result.alreadyJoined) {
          Alert.alert('Ya estás unido', `Ya eres parte de "${rodada.nombre}"`);
        } else {
          Alert.alert('¡Te uniste!', `Te has unido a "${rodada.nombre}"`);
        }
        fetchRodadas({ soloProximas: false }); // Refrescar lista
      } else {
        Alert.alert('Error', result.error || 'No se pudo unir a la rodada');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al unirse');
    } finally {
      setJoiningRodada(null);
    }
  };

  // 🛼 Función para salir de una rodada
  const handleLeaveRodada = async (rodada) => {
    if (!user?.id) return;

    Alert.alert(
      'Abandonar rodada',
      `¿Seguro que quieres abandonar "${rodada.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Abandonar',
          style: 'destructive',
          onPress: async () => {
            setJoiningRodada(rodada.id);
            try {
              const result = await salirDeRodada(rodada.id, user.id);
              if (result.success) {
                setIsUserJoined(false);
                Alert.alert('👋', `Has abandonado "${rodada.nombre}"`);
                fetchRodadas({ soloProximas: false });
              } else {
                Alert.alert('Error', result.error || 'No se pudo abandonar la rodada');
              }
            } catch (error) {
              Alert.alert('Error', 'Ocurrió un error al abandonar');
            } finally {
              setJoiningRodada(null);
            }
          }
        }
      ]
    );
  };

  // 🛼 Abrir detalle de rodada
  const handleOpenRodadaDetail = async (rodada) => {
    setSelectedRodada(rodada);
    setShowRodadasList(false);
    setShowRodadaDetail(true);
    setShowRodadaBadge(true);
    
    // Verificar si el usuario está unido
    if (user?.id && rodada.organizador_id !== user.id) {
      setCheckingJoin(true);
      const joined = await verificarParticipacion(rodada.id, user.id);
      setIsUserJoined(joined);
      setCheckingJoin(false);
    } else {
      setIsUserJoined(false);
    }
  };

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

  // 📍 Centrar mapa en ubicación del usuario al entrar a la pantalla
  useFocusEffect(
    React.useCallback(() => {
      const centerOnUserLocation = async () => {
        try {
          console.log('📍 Centrando mapa en ubicación del usuario...');
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          
          if (location && mapRef.current) {
            mapRef.current.animateToRegion(
              {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.05, // Vista más amplia para ver la ciudad
                longitudeDelta: 0.05,
              },
              1000
            );
                setIsMapAutoCenter(true);
            console.log('✅ Mapa centrado en:', location.coords.latitude, location.coords.longitude);
          }
        } catch (error) {
          console.error('❌ Error obteniendo ubicación inicial:', error);
                setIsMapAutoCenter(true);
        }
      };

      // Solo centrar si no hay ruta histórica
      if (!route.params?.historicalRoute) {
        centerOnUserLocation();
      }
    }, [route.params?.historicalRoute])
  );

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
    if (currentLocation && mapRef.current && isMapAutoCenter) {
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
  }, [currentLocation, isMapAutoCenter]);

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
  
  // 📏 Función helper para calcular distancia entre dos puntos (en metros)
  const getDistanceBetweenPoints = (coord1, coord2) => {
    if (!coord1 || !coord2) return 0;
    const R = 6371000; // Radio de la Tierra en metros
    const lat1 = coord1.latitude * Math.PI / 180;
    const lat2 = coord2.latitude * Math.PI / 180;
    const deltaLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const deltaLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
    
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  
  // 🚩 Mostrar bandera solo si estamos a más de 10 metros del inicio
  const lastCoord = routeCoordinates.length > 0 ? routeCoordinates[routeCoordinates.length - 1] : null;
  const firstCoord = routeCoordinates.length > 0 ? routeCoordinates[0] : null;
  const distanceFromStart = (firstCoord && lastCoord && routeCoordinates.length > 2)
    ? getDistanceBetweenPoints(firstCoord, lastCoord)
    : 0;
  // La bandera aparece solo cuando hay distancia suficiente (10m) para verse separada del patín
  // y cuando hay más de 5 puntos de ruta (evitar falsos positivos por GPS impreciso)
  const showStartFlag = routeCoordinates.length > 5 && distanceFromStart > 10;
  
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
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.colors.background.primary },
      ]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />




      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        mapType={mapType}
        onPanDrag={() => setIsMapAutoCenter(false)}
      >
        {/* Ruta actual */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={theme.colors.primary}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Rutas en vivo de otros usuarios */}
        {Object.keys(livePaths).map((userId) => {
          const pathData = livePaths[userId];
          if (!pathData?.points || pathData.points.length < 2) return null;

          return (
            <Polyline
              key={`path-${userId}`}
              coordinates={pathData.points}
              strokeColor="#19C37D"
              strokeWidth={3}
              lineCap="round"
              lineJoin="round"
            />
          );
        })}

        {/* Tu posicion */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[styles.currentPositionMarker, { backgroundColor: theme.colors.primary }]}>
              <MaterialCommunityIcons name="roller-skate" size={18} color="#FFFFFF" />
            </View>
          </Marker>
        )}
        {/* 👥 Patinadores en vivo (con icono de patín con ruedas) */}
        {visibleLiveSkaters.map((skater) => (
          <Marker
            key={skater.userId}
            coordinate={{
              latitude: skater.lat,
              longitude: skater.lng,
            }}
            rotation={skater.heading || 0}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[styles.currentPositionMarker, { backgroundColor: getSkaterColor(skater) }]}>
              <MaterialCommunityIcons
                name="roller-skate"
                size={18}
                color="#FFFFFF"
              />
            </View>
          </Marker>
        ))}

        {/* 🛼 Marcadores de Rodadas (salida) */}
        {rodadas.map((rodada) => {
          const isEnCurso = rodada.estado === "en_curso";
          // Colores más intensos para mejor visibilidad en tema claro
          const markerColor = isEnCurso ? "#D32F2F" : "#2E7D32"; // Rojo oscuro en curso, Verde oscuro programada
          const calloutColor = isEnCurso ? "#B71C1C" : "#1B5E20"; // Aún más oscuro para el callout

          return (
            <React.Fragment key={rodada.id}>
              {/* Marcador de punto de salida */}
              <Marker
                coordinate={{
                  latitude: parseFloat(rodada.punto_salida_lat),
                  longitude: parseFloat(rodada.punto_salida_lng),
                }}
                onPress={() => {
                  setSelectedRodada(rodada);
                  setShowRodadaBadge(true);
                }}
              >
                <View style={styles.rodadaMarkerContainer}>
                  {/* Flecha/Callout con nombre */}
                  <View
                    style={[
                      styles.rodadaCallout,
                      { backgroundColor: calloutColor },
                    ]}
                  >
                    <Text style={styles.rodadaCalloutText} numberOfLines={1}>
                      {rodada.nombre?.substring(0, 20)}
                      {rodada.nombre?.length > 20 ? "..." : ""}
                    </Text>
                    <View
                      style={[
                        styles.rodadaCalloutArrow,
                        { borderTopColor: calloutColor },
                      ]}
                    />
                  </View>
                  {/* Marcador circular */}
                  <View
                    style={[
                      styles.rodadaMarker,
                      { backgroundColor: markerColor },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="account-group"
                      size={18}
                      color="#FFFFFF"
                    />
                  </View>
                </View>
              </Marker>

              {/* Marcador de punto de llegada (si existe) */}
              {rodada.punto_llegada_lat && rodada.punto_llegada_lng && (
                <Marker
                  coordinate={{
                    latitude: parseFloat(rodada.punto_llegada_lat),
                    longitude: parseFloat(rodada.punto_llegada_lng),
                  }}
                  onPress={() => {
                    setSelectedRodada(rodada);
                    setShowRodadaBadge(true);
                  }}
                >
                  <View style={styles.rodadaMarkerContainer}>
                    {/* Flecha/Callout de llegada */}
                    <View
                      style={[
                        styles.rodadaCallout,
                        { backgroundColor: "#FFD700" },
                      ]}
                    >
                      <Text
                        style={[styles.rodadaCalloutText, { color: "#000" }]}
                        numberOfLines={1}
                      >
                        🏁 Llegada
                      </Text>
                      <View
                        style={[
                          styles.rodadaCalloutArrow,
                          { borderTopColor: "#FFD700" },
                        ]}
                      />
                    </View>
                    {/* Marcador de llegada */}
                    <View
                      style={[
                        styles.rodadaMarker,
                        { backgroundColor: "#FFD700" },
                      ]}
                    >
                      <Ionicons name="flag-outline" size={18} color="#000" />
                    </View>
                  </View>
                </Marker>
              )}
            </React.Fragment>
          );
        })}

        {/*  Markers de spots (lugares especiales para patinar) */}
        {showSpotsOnMap && spots.map((spot) => (
          <Marker
            key={`spot-${spot.id}`}
            coordinate={{
              latitude: parseFloat(spot.latitud),
              longitude: parseFloat(spot.longitud),
            }}
            title={spot.nombre}
            description={spot.ciudad || 'Spot'}
          >
            <View
              style={[
                styles.spotMarker,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <MaterialCommunityIcons
                name="skateboard-mountain"
                size={16}
                color="#FFFFFF"
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* 📜 Badge de ruta histórica */}
      {historicalRoute && (
        <View
          style={[
            styles.historicalBadge,
            {
              backgroundColor: isDark
                ? "rgba(136, 136, 136, 0.95)"
                : "rgba(100, 100, 100, 0.95)",
            },
          ]}
        >
          <View style={styles.historicalBadgeContent}>
            <Ionicons name="time-outline" size={18} color="#FFFFFF" />
            <View style={styles.historicalBadgeText}>
              <Text style={styles.historicalBadgeTitle} numberOfLines={1}>
                {historicalRoute.name || "Ruta guardada"}
              </Text>
              <Text style={styles.historicalBadgeStats}>
                {(historicalRoute.distance / 1000).toFixed(1)} km •{" "}
                {Math.floor(historicalRoute.duration / 60)} min
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
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark
              ? "rgba(11, 15, 20, 0.85)"
              : "rgba(255, 255, 255, 0.9)",
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            console.log("🔙 Volviendo a rutinas...");
            navigation.navigate("RoutesHistoryScreen");
          }}
          style={[
            styles.headerButton,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.08)",
            },
          ]}
        >
          <Ionicons
            name="list-outline"
            size={24}
            color={theme.colors.primary}
          />
        </TouchableOpacity>

        {/* Botón listar rodadas */}
        <TouchableOpacity
          onPress={() => setShowRodadasList(!showRodadasList)}
          style={[
            styles.headerButton,
            {
              backgroundColor: showRodadasList
                ? theme.colors.primary
                : isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.08)",
            },
          ]}
        >
          <MaterialCommunityIcons
            name="calendar-clock"
            size={24}
            color={showRodadasList ? "#FFFFFF" : theme.colors.primary}
          />
        </TouchableOpacity>

        {/* Botón crear rodada */}
        <TouchableOpacity
          onPress={() => setShowCreateRodadaModal(true)}
          style={[
            styles.headerButton,
            styles.createRodadaButton,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <MaterialCommunityIcons
            name="account-group"
            size={16}
            color="#FFFFFF"
            style={{ marginLeft: 2 }}
          />
        </TouchableOpacity>

        {/* Botón para cambiar tipo de mapa */}
        {/* Botón cambiar tipo de mapa */}
        <TouchableOpacity
          onPress={() =>
            setMapType((prev) => (prev === "standard" ? "hybrid" : "standard"))
          }
          style={[
            styles.headerButton,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.08)",
            },
          ]}
        >
          <Ionicons
            name={mapType === "hybrid" ? "map-outline" : "earth-outline"}
            size={24}
            color={theme.colors.primary}
          />
        </TouchableOpacity>

        {/* Botón toggle spots */}
        <TouchableOpacity
          onPress={() => setShowSpotsOnMap(!showSpotsOnMap)}
          style={[
            styles.headerButton,
            {
              backgroundColor: showSpotsOnMap
                ? theme.colors.primary
                : isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.08)",
            },
          ]}
        >
          <MaterialCommunityIcons
            name="skateboard-mountain"
            size={24}
            color={showSpotsOnMap ? "#FFFFFF" : theme.colors.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            try {
              // Obtener ubicación actual directamente
              const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
              });
              if (mapRef.current && location?.coords) {
                mapRef.current.animateToRegion(
                  {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  },
                  500
                );
                setIsMapAutoCenter(true);
              }
            } catch (err) {
              console.log("Error obteniendo ubicación:", err);
              // Fallback a currentLocation del hook
              if (mapRef.current && currentLocation) {
                mapRef.current.animateToRegion(
                  {
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  },
                  500
                );
                setIsMapAutoCenter(true);
              }
            }
          }}
          style={[
            styles.headerButton,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.08)",
            },
          ]}
        >
          <Ionicons name="locate" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 🛼 Panel de lista de rodadas */}
      {showRodadasList && (
        <TouchableOpacity
          style={styles.rodadasListOverlay}
          onPress={() => setShowRodadasList(false)}
          activeOpacity={1}
        >
          <TouchableOpacity
          style={[
            styles.rodadasListPanel,
            {
              backgroundColor: isDark
                ? "rgba(12, 16, 24, 0.95)"
                : "rgba(255, 255, 255, 0.98)",
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.08)",
            },
          ]}
          onPress={() => {}}
          activeOpacity={1}
        >
          <View style={styles.rodadasListHeader}>
            <Text
              style={[
                styles.rodadasListTitle,
                { color: theme.colors.text.primary },
              ]}
            >
              🛼 Rodadas Programadas
            </Text>
            <TouchableOpacity onPress={() => setShowRodadasList(false)}>
              <Ionicons
                name="close"
                size={24}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>
          </View>

          {isLoadingRodadas ? (
            <View style={styles.rodadasListEmpty}>
              <Text style={{ color: theme.colors.text.secondary }}>
                Cargando rodadas...
              </Text>
            </View>
          ) : rodadas.length === 0 ? (
            <View style={styles.rodadasListEmpty}>
              <MaterialCommunityIcons
                name="calendar-blank"
                size={48}
                color={theme.colors.text.disabled}
              />
              <Text
                style={[
                  styles.rodadasListEmptyText,
                  { color: theme.colors.text.secondary },
                ]}
              >
                No hay rodadas programadas
              </Text>
              <Text
                style={[
                  styles.rodadasListEmptySubtext,
                  { color: theme.colors.text.disabled },
                ]}
              >
                ¡Crea la primera rodada!
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.rodadasListScroll}
              showsVerticalScrollIndicator={false}
            >
              {rodadas.map((rodada) => {
                const isOrganizer = rodada.organizador_id === user?.id;
                const isJoining = joiningRodada === rodada.id;

                return (
                  <View
                    key={rodada.id}
                    style={[
                      styles.rodadaListItem,
                      {
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.03)",
                        borderColor: isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.06)",
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.rodadaListItemMain}
                      onPress={() => {
                        setSelectedRodada(rodada);
                        setShowRodadaBadge(true);
                        setShowRodadasList(false);
                        // Centrar mapa en la rodada
                        if (mapRef.current && rodada.punto_salida_lat) {
                          mapRef.current.animateToRegion({
                            latitude: rodada.punto_salida_lat,
                            longitude: rodada.punto_salida_lng,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                          });
                        }
                      }}
                    >
                      <View
                        style={[
                          styles.rodadaListItemStatus,
                          {
                            backgroundColor:
                              rodada.estado === "en_curso"
                                ? "#FF3B30"
                                : "#34C759",
                          },
                        ]}
                      />
                      <View style={styles.rodadaListItemContent}>
                        <Text
                          style={[
                            styles.rodadaListItemName,
                            { color: theme.colors.text.primary },
                          ]}
                          numberOfLines={1}
                        >
                          {rodada.nombre}
                          {isOrganizer && (
                            <Text style={{ color: theme.colors.primary }}>
                              {" "}
                              (tuya)
                            </Text>
                          )}
                        </Text>
                        <Text
                          style={[
                            styles.rodadaListItemDetails,
                            { color: theme.colors.text.secondary },
                          ]}
                        >
                          📅{" "}
                          {new Date(rodada.fecha_inicio).toLocaleDateString(
                            "es-CO",
                            { weekday: "short", day: "numeric", month: "short" }
                          )}
                          {" • "}🕐 {rodada.hora_encuentro || "---"}
                        </Text>
                        <Text
                          style={[
                            styles.rodadaListItemDetails,
                            { color: theme.colors.text.disabled },
                          ]}
                          numberOfLines={1}
                        >
                          📍 {rodada.punto_salida_nombre}
                        </Text>
                      </View>
                      <View style={styles.rodadaListItemParticipants}>
                        <MaterialCommunityIcons
                          name="account-group"
                          size={16}
                          color={theme.colors.primary}
                        />
                        <Text
                          style={[
                            styles.rodadaListItemCount,
                            { color: theme.colors.primary },
                          ]}
                        >
                          {rodada.participantes_count || 0}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Botón de acción - Ver detalle */}
                    <TouchableOpacity
                      style={[
                        styles.rodadaActionButton,
                        { backgroundColor: theme.colors.primary },
                      ]}
                      onPress={() => handleOpenRodadaDetail(rodada)}
                    >
                      <Ionicons name="eye" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          )}
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* 🛼 Badge de rodada seleccionada */}
      {selectedRodada && showRodadaBadge && (
        <TouchableOpacity
          style={styles.rodadaBadgeOverlay}
          onPress={() => {
            setShowRodadaBadge(false);
            if (!showRodadaDetail) {
              setSelectedRodada(null);
            }
          }}
          activeOpacity={1}
        >
          <TouchableOpacity
            style={[
              styles.rodadaBadge,
              {
                backgroundColor: isDark
                  ? "rgba(52, 199, 89, 0.95)"
                  : "rgba(52, 199, 89, 0.95)",
              },
            ]}
            onPress={() => {}}
            activeOpacity={1}
          >
            <View style={styles.rodadaBadgeContent}>
              <MaterialCommunityIcons
                name="account-group"
                size={20}
                color="#FFFFFF"
              />
              <View style={styles.rodadaBadgeText}>
                <Text style={styles.rodadaBadgeTitle} numberOfLines={1}>
                  {selectedRodada.nombre}
                </Text>
                <Text style={styles.rodadaBadgeStats}>
                  ?? {selectedRodada.punto_salida_nombre?.substring(0, 30)}...
                </Text>
                <Text style={styles.rodadaBadgeStats}>
                  ??{" "}
                  {new Date(selectedRodada.fecha_inicio).toLocaleDateString(
                    "es-CO"
                  )}{" "}
                  - {selectedRodada.hora_encuentro || "---"}
                </Text>
                <Text style={styles.rodadaBadgeStats}>
                  ?? {selectedRodada.participantes_count || 0} participantes -{" "}
                  {selectedRodada.nivel_requerido || "Todos"}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                setShowRodadaBadge(false);
                if (!showRodadaDetail) {
                  setSelectedRodada(null);
                }
              }}
              style={styles.rodadaBadgeClose}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
      {/* Stats Overlay - Diseño compacto horizontal */}
      {status !== TRACKER_STATUS.IDLE && (
        <Animated.View
          style={[
            styles.statsContainer,
            statsContainerStyle,
            { opacity: statsOpacity },
          ]}
          pointerEvents={showStats ? "auto" : "none"}
        >
          {/* Fila principal de stats */}
          <View style={styles.mainStatsRow}>
            <View style={styles.mainStatItem}>
              <Text
                style={[styles.mainStatValue, { color: theme.colors.primary }]}
              >
                {formatDistance(distance)}
              </Text>
              <Text
                style={[styles.mainStatLabel, { color: statsTextSecondary }]}
              >
                {t("screens.tracking.distance")}
              </Text>
            </View>

            <View
              style={[
                styles.statDividerVertical,
                { backgroundColor: theme.colors.border },
              ]}
            />

            <View style={styles.mainStatItem}>
              <Text style={[styles.mainStatValue, { color: statsTextPrimary }]}>
                {formatDuration(duration)}
              </Text>
              <Text
                style={[styles.mainStatLabel, { color: statsTextSecondary }]}
              >
                {t("screens.tracking.time")}
              </Text>
            </View>

            <View
              style={[
                styles.statDividerVertical,
                { backgroundColor: theme.colors.border },
              ]}
            />

            <View style={styles.mainStatItem}>
              <Text style={[styles.mainStatValue, { color: statsTextPrimary }]}>
                {speed.toFixed(1)}
              </Text>
              <Text
                style={[styles.mainStatLabel, { color: statsTextSecondary }]}
              >
                km/h
              </Text>
            </View>
          </View>

          {/* Fila secundaria compacta */}
          <View style={styles.secondaryStatsRow}>
            <View style={styles.miniStatItem}>
              <Ionicons
                name="trending-up"
                size={12}
                color={theme.colors.primary}
              />
              <Text
                style={[styles.miniStatValue, { color: statsTextSecondary }]}
              >
                {avgSpeed.toFixed(1)}
              </Text>
            </View>
            <View style={styles.miniStatItem}>
              <Ionicons name="flash" size={12} color="#FF9500" />
              <Text
                style={[styles.miniStatValue, { color: statsTextSecondary }]}
              >
                {maxSpeed.toFixed(1)}
              </Text>
            </View>
            <View style={styles.miniStatItem}>
              <Ionicons name="flame" size={12} color="#FF3B30" />
              <Text
                style={[styles.miniStatValue, { color: statsTextSecondary }]}
              >
                {calories}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Control Buttons - Diseño elegante */}
      <View style={styles.controlsContainer}>
        <View
          style={[
            styles.controlsWrapper,
            {
              backgroundColor: isDark
                ? "rgba(12, 16, 24, 0.85)"
                : "rgba(255, 255, 255, 0.9)",
            },
          ]}
        >
          {/* Botón de Stop */}
          {status !== TRACKER_STATUS.IDLE && (
            <TouchableOpacity
              onPress={handleStopTracking}
              style={styles.stopButton}
              activeOpacity={0.7}
            >
              <View style={styles.stopButtonInner}>
                <Ionicons
                  name="stop"
                  size={20}
                  color={theme.colors.onSecondary}
                />
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
        <View
          style={[
            styles.errorContainer,
            {
              backgroundColor: isDark
                ? "rgba(11, 15, 20, 0.9)"
                : "rgba(255, 255, 255, 0.95)",
            },
          ]}
        >
          <Ionicons name="alert-circle" size={20} color="#FF3B30" />
          <Text
            style={[styles.errorText, { color: theme.colors.text.primary }]}
          >
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => {
              console.log("🔄 Reintentando permisos...");
              requestLocationPermission();
            }}
            style={{ paddingLeft: 12 }}
          >
            <Ionicons name="refresh" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* 🛼 Modal para crear rodada */}
      <CreateRodadaModal
        visible={showCreateRodadaModal}
        onClose={() => setShowCreateRodadaModal(false)}
        onSuccess={(rodada) => {
          console.log("✅ Rodada creada:", rodada);
          Alert.alert(
            "🛼 ¡Rodada creada!",
            `"${rodada.nombre}" ha sido programada. Los patinadores podrán verla en el mapa.`,
            [{ text: "Genial!" }]
          );
                setIsMapAutoCenter(true);
          fetchRodadas(); // Recargar lista
        }}
      />

      {/* 🛼 Modal de detalle de rodada */}
      <Modal
        visible={showRodadaDetail}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRodadaDetail(false)}
      >
        <View style={styles.rodadaDetailOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowRodadaDetail(false)}
          />
          <View
            style={[
              styles.rodadaDetailPanel,
              {
                backgroundColor: isDark
                  ? "rgba(12, 16, 24, 0.98)"
                  : "rgba(255, 255, 255, 0.98)",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.08)",
              },
            ]}
          >
            {/* Header */}
            <View style={styles.rodadaDetailHeader}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.rodadaDetailTitle,
                    { color: theme.colors.text.primary },
                  ]}
                  numberOfLines={2}
                >
                  {selectedRodada?.nombre || "Rodada"}
                </Text>
                {/* Badge organizador en header */}
                {user && selectedRodada?.organizador_id === user.id && (
                  <View style={styles.organizerBadgeHeader}>
                    <MaterialCommunityIcons
                      name="crown"
                      size={14}
                      color="#34C759"
                    />
                    <Text style={styles.organizerBadgeText}>
                      Eres el organizador
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => setShowRodadaDetail(false)}>
                <Ionicons
                  name="close-circle"
                  size={28}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.rodadaDetailContent}>
              {/* Estado */}
              <View style={styles.rodadaDetailSection}>
                <Text
                  style={[
                    styles.rodadaDetailLabel,
                    { color: theme.colors.text.secondary },
                  ]}
                >
                  Estado
                </Text>
                <View style={styles.rodadaDetailRow}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor:
                        selectedRodada?.estado === "en_curso"
                          ? "#FF3B30"
                          : "#34C759",
                    }}
                  />
                  <Text
                    style={[
                      styles.rodadaDetailValue,
                      { color: theme.colors.text.primary },
                    ]}
                  >
                    {selectedRodada?.estado === "en_curso"
                      ? "🔴 En curso"
                      : "🟢 Programada"}
                  </Text>
                </View>
              </View>

              {/* Punto de salida */}
              <View style={styles.rodadaDetailSection}>
                <Text
                  style={[
                    styles.rodadaDetailLabel,
                    { color: theme.colors.text.secondary },
                  ]}
                >
                  Punto de salida
                </Text>
                <View style={styles.rodadaDetailRow}>
                  <Ionicons
                    name="location"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.rodadaDetailValue,
                      { color: theme.colors.text.primary, flex: 1 },
                    ]}
                  >
                    {selectedRodada?.punto_salida_nombre || "No especificado"}
                  </Text>
                </View>
              </View>

              {/* Fecha y hora */}
              <View style={styles.rodadaDetailSection}>
                <Text
                  style={[
                    styles.rodadaDetailLabel,
                    { color: theme.colors.text.secondary },
                  ]}
                >
                  Fecha y hora
                </Text>
                <View style={styles.rodadaDetailRow}>
                  <Ionicons
                    name="calendar"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.rodadaDetailValue,
                      { color: theme.colors.text.primary },
                    ]}
                  >
                    {selectedRodada?.fecha_inicio
                      ? new Date(
                          selectedRodada.fecha_inicio
                        ).toLocaleDateString("es-CO", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })
                      : "No especificada"}
                  </Text>
                </View>
                <View style={[styles.rodadaDetailRow, { marginTop: 4 }]}>
                  <Ionicons
                    name="time"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.rodadaDetailValue,
                      { color: theme.colors.text.primary },
                    ]}
                  >
                    {selectedRodada?.hora_encuentro || "No especificada"}
                  </Text>
                </View>
              </View>

              {/* Nivel requerido */}
              <View style={styles.rodadaDetailSection}>
                <Text
                  style={[
                    styles.rodadaDetailLabel,
                    { color: theme.colors.text.secondary },
                  ]}
                >
                  Nivel requerido
                </Text>
                <View style={styles.rodadaDetailRow}>
                  <MaterialCommunityIcons
                    name="medal"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.rodadaDetailValue,
                      { color: theme.colors.text.primary },
                    ]}
                  >
                    {selectedRodada?.nivel_requerido || "Todos los niveles"}
                  </Text>
                </View>
              </View>

              {/* Participantes */}
              <View style={styles.rodadaDetailSection}>
                <Text
                  style={[
                    styles.rodadaDetailLabel,
                    { color: theme.colors.text.secondary },
                  ]}
                >
                  Participantes
                </Text>
                <View style={styles.rodadaDetailRow}>
                  <Ionicons
                    name="people"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.rodadaDetailValue,
                      { color: theme.colors.text.primary },
                    ]}
                  >
                    {selectedRodada?.participantes_count || 0} personas se han
                    unido
                  </Text>
                </View>
              </View>

              {/* Descripción */}
              {selectedRodada?.descripcion && (
                <View style={styles.rodadaDetailSection}>
                  <Text
                    style={[
                      styles.rodadaDetailLabel,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    Descripción
                  </Text>
                  <Text
                    style={[
                      styles.rodadaDetailValue,
                      { color: theme.colors.text.primary },
                    ]}
                  >
                    {selectedRodada.descripcion}
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Actions */}
            <View style={styles.rodadaDetailActions}>
              {/* Botón para centrar en mapa */}
              <TouchableOpacity
                style={[
                  styles.rodadaDetailButton,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.06)",
                  },
                ]}
                onPress={() => {
                  if (
                    selectedRodada?.punto_salida_lat &&
                    selectedRodada?.punto_salida_lng &&
                    mapRef.current
                  ) {
                    mapRef.current.animateToRegion(
                      {
                        latitude: selectedRodada.punto_salida_lat,
                        longitude: selectedRodada.punto_salida_lng,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      },
                      500
                    );
                  }
                  setShowRodadaDetail(false);
                }}
              >
                <Ionicons
                  name="locate"
                  size={20}
                  color={theme.colors.text.primary}
                />
                <Text
                  style={[
                    styles.rodadaDetailButtonText,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  Ver en mapa
                </Text>
              </TouchableOpacity>

              {/* Botón de unirse/abandonar (solo si no es organizador) */}
              {user &&
                selectedRodada?.organizador_id !== user.id &&
                (checkingJoin ? (
                  <View
                    style={[
                      styles.rodadaDetailButton,
                      {
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.06)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rodadaDetailButtonText,
                        { color: theme.colors.text.secondary },
                      ]}
                    >
                      Verificando...
                    </Text>
                  </View>
                ) : isUserJoined ? (
                  <TouchableOpacity
                    style={[
                      styles.rodadaDetailButton,
                      {
                        backgroundColor: "transparent",
                        borderWidth: 2,
                        borderColor: "#FF3B30",
                      },
                    ]}
                    onPress={() => handleLeaveRodada(selectedRodada)}
                    disabled={joiningRodada === selectedRodada?.id}
                  >
                    {joiningRodada === selectedRodada?.id ? (
                      <Text
                        style={[
                          styles.rodadaDetailButtonText,
                          { color: "#FF3B30" },
                        ]}
                      >
                        Abandonando...
                      </Text>
                    ) : (
                      <>
                        <Ionicons
                          name="exit-outline"
                          size={20}
                          color="#FF3B30"
                        />
                        <Text
                          style={[
                            styles.rodadaDetailButtonText,
                            { color: "#FF3B30" },
                          ]}
                        >
                          Abandonar
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.rodadaDetailButton,
                      { backgroundColor: theme.colors.primary },
                    ]}
                    onPress={async () => {
                      await handleJoinRodada(selectedRodada);
                      setIsUserJoined(true);
                    }}
                    disabled={joiningRodada === selectedRodada?.id}
                  >
                    {joiningRodada === selectedRodada?.id ? (
                      <Text style={styles.rodadaDetailButtonText}>
                        Uniéndote...
                      </Text>
                    ) : (
                      <>
                        <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.rodadaDetailButtonText}>
                          Unirme
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                ))}

              {/* Si es organizador, mostrar botón eliminar */}
              {user && selectedRodada?.organizador_id === user.id && (
                <TouchableOpacity
                  style={[
                    styles.rodadaDetailButton,
                    { backgroundColor: "#FF3B30" },
                  ]}
                  onPress={() => {
                    Alert.alert(
                      "Eliminar rodada",
                      `¿Seguro que quieres eliminar "${selectedRodada?.nombre}"?`,
                      [
                        { text: "Cancelar", style: "cancel" },
                        {
                          text: "Eliminar",
                          style: "destructive",
                          onPress: async () => {
                            setDeletingRodada(true);
                            const result = await eliminarRodada(
                              selectedRodada.id
                            );
                            setDeletingRodada(false);
                            if (result.success) {
                              setShowRodadaDetail(false);
                              Alert.alert("✅", "Rodada eliminada");
                            } else {
                              Alert.alert(
                                "Error",
                                result.error || "No se pudo eliminar"
                              );
                            }
                          },
                        },
                      ]
                    );
                  }}
                  disabled={deletingRodada}
                >
                  {deletingRodada ? (
                    <Text style={styles.rodadaDetailButtonText}>
                      Eliminando...
                    </Text>
                  ) : (
                    <>
                      <Ionicons name="trash" size={20} color="#FFFFFF" />
                      <Text style={styles.rodadaDetailButtonText}>
                        Eliminar rodada
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
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

  // 🛼 Botón crear rodada
  createRodadaButton: {
    flexDirection: 'row',
    width: 'auto',
    paddingHorizontal: 12,
    borderRadius: 20,
  },

  // 🛼 Marcador de posición actual (patín)
  currentPositionMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },

  // 🛼 Contenedor de marcador de rodada con callout
  rodadaMarkerContainer: {
    alignItems: 'center',
  },
  
  // 🛼 Callout/flecha con nombre de rodada
  rodadaCallout: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
    maxWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  rodadaCalloutText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  rodadaCalloutArrow: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },

  // 🛼 Marcador de rodada
  rodadaMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },

  // 🛼 Badge de rodada seleccionada
  rodadaBadgeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    elevation: 20,
  },
  rodadaBadge: {
    position: 'absolute',
    top: 130,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 21,
  },
  rodadaBadgeContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rodadaBadgeText: {
    flex: 1,
  },
  rodadaBadgeTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  rodadaBadgeStats: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    marginTop: 2,
  },
  rodadaBadgeClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  // 🛼 Panel de lista de rodadas
  rodadasListOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  rodadasListPanel: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    maxHeight: 350,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  rodadasListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  rodadasListTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  rodadasListScroll: {
    maxHeight: 280,
  },
  rodadasListEmpty: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rodadasListEmptyText: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 12,
  },
  rodadasListEmptySubtext: {
    fontSize: 13,
    marginTop: 4,
  },
  rodadaListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  rodadaListItemStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  rodadaListItemContent: {
    flex: 1,
  },
  rodadaListItemName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  rodadaListItemDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  rodadaListItemParticipants: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  rodadaListItemCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // 🛼 Botones de acción en lista
  rodadaListItemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rodadaListItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  rodadaActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // 🛼 Modal de detalle de rodada
  rodadaDetailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  rodadaDetailPanel: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '80%',
  },
  rodadaDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  organizerBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  organizerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
  },
  rodadaDetailTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 12,
  },
  rodadaDetailContent: {
    padding: 20,
  },
  rodadaDetailSection: {
    marginBottom: 20,
  },
  rodadaDetailLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    opacity: 0.6,
  },
  rodadaDetailValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  rodadaDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  rodadaDetailActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 8,
  },
  rodadaDetailButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  rodadaDetailButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 👥 Estilos para patinadores en vivo
  liveSkaterMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  // 🛹 Estilos para spots
  spotMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
});











