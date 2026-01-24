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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../../store/useAppStore';
import { useRouteTracker, TRACKER_STATUS } from '../../hooks/useRouteTracker';
import { useRodadas } from '../../hooks/useRodadas';
import { useSpots } from '../../hooks/useSpots';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import { fetchTrackingLive, subscribeTrackingLive, unsubscribeTrackingLive } from '../../services/tracking';
import CreateRodadaModal from '../../components/tracking/CreateRodadaModal';
import { styles } from './tracking.style';

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
  const [showRodadasOnMap, setShowRodadasOnMap] = useState(true);
  const [joiningRodada, setJoiningRodada] = useState(null); // ID de rodada que se está uniendo
  const [isUserJoined, setIsUserJoined] = useState(false); // Si el usuario está unido a la rodada seleccionada
  const [checkingJoin, setCheckingJoin] = useState(false); // Verificando participación
  const [ mapType, setMapType ] = useState('hybrid');
  const [isMapAutoCenter, setIsMapAutoCenter] = useState(true);
  const SHOW_RODADAS_KEY = '@tracking_show_rodadas';

  const getRodadaType = React.useCallback((rodada) => {
    if (rodada?.comunidad_id) return 'comunidad';
    if (rodada?.tipo === 'entreno') return 'entreno';
    return 'normal';
  }, []);

  const getRodadaVisuals = React.useCallback((rodada) => {
    const type = getRodadaType(rodada);
    if (type === 'comunidad') {
      return {
        markerColor: theme.colors.primary,
        calloutColor: theme.colors.primary,
        icon: 'account-multiple',
      };
    }
    if (type === 'entreno') {
      return {
        markerColor: theme.colors.warning,
        calloutColor: theme.colors.warning,
        icon: 'traffic-cone',
      };
    }
    return {
      markerColor: theme.colors.secondary,
      calloutColor: theme.colors.secondary,
      icon: 'account-group',
    };
  }, [getRodadaType, theme.colors]);

  const filteredRodadas = React.useMemo(() => {
    const now = new Date();
    return rodadas.filter((rodada) => {
      if (rodada?.estado === 'en_curso') return true;
      if (rodada?.estado !== 'programada') return false;
      if (!rodada?.fecha_inicio) return false;
      const fecha = new Date(rodada.fecha_inicio);
      return fecha >= now;
    });
  }, [rodadas]);

  useEffect(() => {
    const loadRodadasVisibility = async () => {
      try {
        const stored = await AsyncStorage.getItem(SHOW_RODADAS_KEY);
        if (stored !== null) {
          setShowRodadasOnMap(stored === 'true');
        }
      } catch (error) {
        console.error('Error cargando preferencia de rodadas:', error);
      }
    };

    loadRodadasVisibility();
  }, []);

  const toggleRodadasVisibility = async () => {
    try {
      const nextValue = !showRodadasOnMap;
      setShowRodadasOnMap(nextValue);
      await AsyncStorage.setItem(SHOW_RODADAS_KEY, String(nextValue));

      if (!nextValue) {
        setShowRodadasList(false);
        setSelectedRodada(null);
        setShowRodadaBadge(false);
      }
    } catch (error) {
      console.error('Error guardando preferencia de rodadas:', error);
    }
  };

  const ensureRodadasVisible = async () => {
    if (showRodadasOnMap) return;
    try {
      setShowRodadasOnMap(true);
      await AsyncStorage.setItem(SHOW_RODADAS_KEY, 'true');
    } catch (error) {
      console.error('Error guardando preferencia de rodadas:', error);
    }
  };


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
          color: theme.colors.warning,
          glow: theme.colors.warning,
          label: t('screens.tracking.pause'),
        };
      case TRACKER_STATUS.PAUSED:
        return {
          icon: 'play',
          color: theme.colors.primary,
          glow: theme.colors.primary,
          label: t('screens.tracking.resume'),
        };
      default:
        return {
          icon: 'play',
          color: theme.colors.primary,
          glow: theme.colors.primary,
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
        {showRodadasOnMap && filteredRodadas.map((rodada) => {
          const visuals = getRodadaVisuals(rodada);
          const markerColor = visuals.markerColor;
          const calloutColor = visuals.calloutColor;

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
                      name={visuals.icon}
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

        {/* Botón toggle rodadas */}
        <TouchableOpacity
          onPress={toggleRodadasVisibility}
          style={[
            styles.headerButton,
            {
              backgroundColor: showRodadasOnMap
                ? theme.colors.primary
                : isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.08)",
            },
          ]}
        >
          <Ionicons
            name={showRodadasOnMap ? "eye" : "eye-off"}
            size={24}
            color={showRodadasOnMap ? "#FFFFFF" : theme.colors.primary}
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
          ) : filteredRodadas.length === 0 ? (
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
              {filteredRodadas.map((rodada) => {
                const isOrganizer = rodada.organizador_id === user?.id;
                const isJoining = joiningRodada === rodada.id;
                const visuals = getRodadaVisuals(rodada);

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
                      onPress={async () => {
                        await ensureRodadasVisible();
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
                            backgroundColor: visuals.markerColor,
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
                      onPress={async () => {
                        await ensureRodadasVisible();
                        handleOpenRodadaDetail(rodada);
                      }}
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
                backgroundColor: getRodadaVisuals(selectedRodada).markerColor,
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
                  Punto:{" "}
                  {selectedRodada.punto_salida_nombre
                    ? `${selectedRodada.punto_salida_nombre.substring(0, 30)}${
                        selectedRodada.punto_salida_nombre.length > 30
                          ? "..."
                          : ""
                      }`
                    : "Sin definir"}
                </Text>
                <Text style={styles.rodadaBadgeStats}>
                  Fecha:{" "}
                  {selectedRodada.fecha_inicio
                    ? new Date(selectedRodada.fecha_inicio).toLocaleDateString(
                        "es-CO"
                      )
                    : "Sin fecha"}{" "}
                  - {selectedRodada.hora_encuentro || "Sin hora"}
                </Text>
                <Text style={styles.rodadaBadgeStats}>
                  Participantes: {selectedRodada.participantes_count || 0} -
                  Nivel: {selectedRodada.nivel_requerido || "Todos"}
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
      {/* Stats Overlay - Secciones separadas */}
      {status !== TRACKER_STATUS.IDLE && (
        <Animated.View
          style={[
            styles.statsTopContainer,
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
        </Animated.View>
      )}

      {status !== TRACKER_STATUS.IDLE && (
        <Animated.View
          style={[
            styles.statsSideContainer,
            statsContainerStyle,
            { opacity: statsOpacity },
          ]}
          pointerEvents={showStats ? "auto" : "none"}
        >
          {/* Columna secundaria */}
          <View style={styles.secondaryStatsColumn}>
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
              <Ionicons name="flash" size={12} color={theme.colors.warning} />
              <Text
                style={[styles.miniStatValue, { color: statsTextSecondary }]}
              >
                {maxSpeed.toFixed(1)}
              </Text>
            </View>
            <View style={styles.miniStatItem}>
              <Ionicons name="flame" size={12} color={theme.colors.error} />
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
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.12)"
                : "rgba(15, 23, 42, 0.12)",
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
              <View
                style={[
                  styles.stopButtonInner,
                  {
                    borderColor: theme.colors.error,
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.04)"
                      : "rgba(255, 255, 255, 0.6)",
                  },
                ]}
              >
                <Ionicons
                  name="stop"
                  size={16}
                  color={theme.colors.error}
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
                {
                  backgroundColor: buttonConfig.color,
                  shadowColor: buttonConfig.glow,
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.18)"
                    : "rgba(15, 23, 42, 0.12)",
                },
                status === TRACKER_STATUS.IDLE && styles.mainButtonLarge,
              ]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={buttonConfig.icon}
                size={status === TRACKER_STATUS.IDLE ? 28 : 24}
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
                      ? "En curso"
                      : "Programada"}
                  </Text>
                </View>
              </View>

              {/* Organiza */}
              <View style={styles.rodadaDetailSection}>
                <Text
                  style={[
                    styles.rodadaDetailLabel,
                    { color: theme.colors.text.secondary },
                  ]}
                >
                  Organiza
                </Text>
                <View style={styles.rodadaDetailRow}>
                  <MaterialCommunityIcons
                    name="account"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.rodadaDetailValue,
                      { color: theme.colors.text.primary, flex: 1 },
                    ]}
                  >
                    {selectedRodada?.organizador?.nombre || "Usuario"}
                  </Text>
                </View>
              </View>

              {/* Tipo */}
              <View style={styles.rodadaDetailSection}>
                <Text
                  style={[
                    styles.rodadaDetailLabel,
                    { color: theme.colors.text.secondary },
                  ]}
                >
                  Tipo
                </Text>
                <View style={styles.rodadaDetailRow}>
                  <MaterialCommunityIcons
                    name={
                      selectedRodada?.tipo === "entreno"
                        ? "traffic-cone"
                        : selectedRodada?.comunidad_id
                        ? "account-multiple"
                        : "account-group"
                    }
                    size={18}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.rodadaDetailValue,
                      { color: theme.colors.text.primary },
                    ]}
                  >
                    {selectedRodada?.tipo === "entreno"
                      ? "Entreno"
                      : selectedRodada?.comunidad_id
                      ? "Comunidad"
                      : "Rodada"}
                  </Text>
                </View>
              </View>

              {/* Comunidad */}
              {(selectedRodada?.comunidad_id || selectedRodada?.comunidad) && (
                <View style={styles.rodadaDetailSection}>
                  <Text
                    style={[
                      styles.rodadaDetailLabel,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    Comunidad
                  </Text>
                  <View style={styles.rodadaDetailRow}>
                    <MaterialCommunityIcons
                      name="account-multiple"
                      size={18}
                      color={theme.colors.primary}
                    />
                    <Text
                      style={[
                        styles.rodadaDetailValue,
                        { color: theme.colors.text.primary, flex: 1 },
                      ]}
                    >
                      {selectedRodada?.comunidad?.nombre || "No especificada"}
                    </Text>
                  </View>
                </View>
              )}

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