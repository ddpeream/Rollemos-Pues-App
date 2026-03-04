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

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Animated, StatusBar, Alert, Platform, InteractionManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import { useRouteTracker, TRACKER_STATUS } from '../../hooks/useRouteTracker';
import { useSpots } from '../../hooks/useSpots';
import { useAuth } from '../../hooks/useAuth';
import { useTrackingLiveSkaters, getSkaterColor } from '../../hooks/useTrackingLiveSkaters';
import { useTrackingRodadas } from '../../hooks/useTrackingRodadas';
import { useTrackingHistory } from '../../hooks/useTrackingHistory';
import { useSnapToRoads } from '../../hooks/useSnapToRoads';
import CreateRodadaModal from '../../components/tracking/CreateRodadaModal';
import TrackingHeader from '../../components/tracking/TrackingHeader';
import TrackingMap from '../../components/tracking/TrackingMap';
import TrackingStatsTop from '../../components/tracking/TrackingStatsTop';
import TrackingStatsSide from '../../components/tracking/TrackingStatsSide';
import TrackingControls from '../../components/tracking/TrackingControls';
import RodadasListPanel from '../../components/tracking/RodadasListPanel';
import RodadaBadge from '../../components/tracking/RodadaBadge';
import RodadaDetailModal from '../../components/tracking/RodadaDetailModal';
import HistoricalRouteBadge from '../../components/tracking/HistoricalRouteBadge';
import TrackingErrorBanner from '../../components/tracking/TrackingErrorBanner';
import LiveSkaterBadge from '../../components/tracking/LiveSkaterBadge';
import { styles } from './tracking.style';
import { formatDuration, formatDistance } from '../../utils/tracking';

const INITIAL_REGION_MEDELLIN = {
  latitude: 6.2442,
  longitude: -75.5812,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function Tracking() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDark } = useAppStore();
  const { t } = useTranslation();
  const { user } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const prevStatusRef = useRef(TRACKER_STATUS.IDLE);
  const stopActionInProgressRef = useRef(false);
  const startActionInProgressRef = useRef(false);
  
  // 🛼 Rodadas
  const {
    rodadas,
    fetchRodadas,
    isLoadingRodadas,
    showRodadasList,
    setShowRodadasList,
    showRodadaDetail,
    setShowRodadaDetail,
    selectedRodada,
    setSelectedRodada,
    showRodadaBadge,
    setShowRodadaBadge,
    showRodadasOnMap,
    toggleRodadasVisibility,
    ensureRodadasVisible,
    fetchRodadaById,
    joiningRodada,
    isUserJoined,
    setIsUserJoined,
    checkingJoin,
    deletingRodada,
    setDeletingRodada,
    handleJoinRodada,
    handleLeaveRodada,
    handleOpenRodadaDetail,
    eliminarRodada,
  } = useTrackingRodadas({ user, navigation, route });

  // 🛼 Spots (Lugares especiales para patinar)
  const { spots, loadSpots } = useSpots();

  const [showCreateRodadaModal, setShowCreateRodadaModal] = useState(false);
  const [mapType, setMapType] = useState(
    Platform.OS === 'android' ? 'standard' : 'hybrid'
  );
  const [isMapAutoCenter, setIsMapAutoCenter] = useState(true);
  const [showSpotsOnMap] = useState(true);
  const [selectedLiveSkaterId, setSelectedLiveSkaterId] = useState(null);
  const [showLiveSkaterBadge, setShowLiveSkaterBadge] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const getRodadaType = React.useCallback((rodada) => {
    const tipo = String(rodada?.tipo || '').toLowerCase();
    if (rodada?.comunidad_id) return 'comunidad';
    if (tipo.includes('entreno')) return 'entreno';
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

  // 👥 Live Skaters (Otros patinadores en tiempo real)
  const { livePaths, visibleLiveSkaters } = useTrackingLiveSkaters({
    userId: user?.id,
  });

  const selectedLiveSkater = React.useMemo(() => {
    if (!selectedLiveSkaterId) return null;
    return (
      visibleLiveSkaters.find((skater) => skater.userId === selectedLiveSkaterId) ||
      null
    );
  }, [selectedLiveSkaterId, visibleLiveSkaters]);

  useEffect(() => {
    if (showLiveSkaterBadge && selectedLiveSkaterId && !selectedLiveSkater) {
      setShowLiveSkaterBadge(false);
      setSelectedLiveSkaterId(null);
    }
  }, [selectedLiveSkater, selectedLiveSkaterId, showLiveSkaterBadge]);

  const [isPrivateTracking, setIsPrivateTracking] = useState(false);
  const [skipRestoring, setSkipRestoring] = useState(false);
  const {
    status,
    currentLocation,
    routeCoordinates,
    routePointCount,
    distance,
    duration,
    speed,
    avgSpeed,
    maxSpeed,
    calories,
    startFlag,
    hasPermission,
    error,
    requestLocationPermission,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
  } = useRouteTracker({ isPrivateTracking, skipRestore: skipRestoring });

  // Snap-to-roads solo fuera del tracking activo.
  // En tracking activo usamos coordenadas raw para máxima fidelidad visual.
  const snappedRouteCoordinates = useSnapToRoads(
    routeCoordinates,
    status !== TRACKER_STATUS.TRACKING,
  );
  const displayRouteCoordinates =
    status === TRACKER_STATUS.TRACKING ? routeCoordinates : snappedRouteCoordinates;
  const mapMarkerLocation = React.useMemo(() => {
    if (displayRouteCoordinates.length > 0) {
      return displayRouteCoordinates[displayRouteCoordinates.length - 1];
    }
    return currentLocation || userLocation || null;
  }, [displayRouteCoordinates, currentLocation, userLocation]);

  const mapRef = useRef(null);

  const { historicalRoute, clearHistoricalRoute } = useTrackingHistory({
    route,
    mapRef,
    navigation,
  });

  const [showStats, setShowStats] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef(null);
  const statsOpacity = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    React.useCallback(() => {
      console.log('🛼 Cargando rodadas...');
      fetchRodadas({ soloProximas: false });
      loadSpots(); // 🛹 Cargar spots también
    }, [])
  );

  useEffect(() => {
    const initPermissions = async () => {
      if (!hasPermission) {
        try {
          console.log('Solicitando permisos en Tracking...');
          await requestLocationPermission();
        } catch (err) {
          console.error('Error en inicializacion de permisos:', err);
        }
      }
    };
    initPermissions();
  }, [hasPermission, requestLocationPermission]);


  useFocusEffect(
    React.useCallback(() => {
      const centerOnUserLocation = async () => {
        try {
          // Posición rápida (cache) para mostrar el marker de inmediato
          const lastKnown = await Location.getLastKnownPositionAsync({
            maxAge: 120000,
            requiredAccuracy: 200,
          });
          if (lastKnown?.coords) {
            setUserLocation({
              latitude: lastKnown.coords.latitude,
              longitude: lastKnown.coords.longitude,
            });
          }
        } catch (_) {}

        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          if (location?.coords) {
            const loc = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            setUserLocation(loc);
            if (mapRef.current) {
              mapRef.current.animateToRegion(
                {
                  ...loc,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                },
                1000
              );
              setIsMapAutoCenter(true);
            }
          }
        } catch (error) {
          console.error('Error obteniendo ubicacion inicial:', error);
          setIsMapAutoCenter(true);
        }
      };

      if (!route.params?.historicalRoute) {
        centerOnUserLocation();
      }
    }, [route.params?.historicalRoute])
  );

  // Sincronizar userLocation con currentLocation durante tracking
  // para que al detener, el marker quede en la última posición conocida
  useEffect(() => {
    if (currentLocation) {
      setUserLocation(currentLocation);
    }
  }, [currentLocation]);

  useEffect(() => {
    if (status === TRACKER_STATUS.TRACKING) {
      if (pulseLoopRef.current) {
        pulseLoopRef.current.stop();
      }
      pulseLoopRef.current = Animated.loop(
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
      );
      pulseLoopRef.current.start();
    } else {
      pulseLoopRef.current?.stop();
      pulseLoopRef.current = null;
      pulseAnim.setValue(1);
    }
    return () => {
      pulseLoopRef.current?.stop();
    };
  }, [status, pulseAnim]);

  useEffect(() => {
    prevStatusRef.current = status;
  }, [status]);

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

  const handleMainButton = async () => {
    console.log('[Tracking] mainButton', { status });
    if (stopActionInProgressRef.current || startActionInProgressRef.current) {
      console.log('[Tracking] mainButton blocked', {
        stopActionInProgress: stopActionInProgressRef.current,
        startActionInProgress: startActionInProgressRef.current,
      });
      return;
    }
    if (status === TRACKER_STATUS.IDLE) {
      console.log('[Tracking] mainButton -> start');
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
      startActionInProgressRef.current = true;
      try {
        const startResult = await startTracking();
        console.log('[Tracking] startTracking result', startResult);
        if (startResult?.success) {
          // Diferir el Alert hasta que el render del marker esté completo
          // Esto evita que Alert.alert() bloquee el JS thread antes de que
          // el marker del usuario se renderice correctamente en Android
          InteractionManager.runAfterInteractions(() => {
            Alert.alert(
              t('screens.tracking.startingTitle'),
              t('screens.tracking.startingMessage')
            );
          });
        } else {
          Alert.alert(
            t('screens.tracking.errorTitle'),
            startResult?.error || t('screens.tracking.permissionsMessage'),
            [{ text: t('common.ok') }]
          );
        }
      } finally {
        startActionInProgressRef.current = false;
      }
    } else if (status === TRACKER_STATUS.TRACKING) {
      console.log('[Tracking] mainButton -> pause');
      pauseTracking();
    } else if (status === TRACKER_STATUS.PAUSED) {
      console.log('[Tracking] mainButton -> resume');
      resumeTracking();
    }
  };

  const handleStopTracking = () => {
    console.log('[Tracking] stopButton', { status, coords: routePointCount });
    if (status === TRACKER_STATUS.IDLE) {
      console.log('[Tracking] stopButton ignored: idle');
      return;
    }
    const runStopTracking = async () => {
      if (stopActionInProgressRef.current) return;
      stopActionInProgressRef.current = true;
      setSkipRestoring(true);
      console.log('[Tracking] stopTracking begin');
      let result = null;
      try {
        result = await stopTracking();
        console.log('[Tracking] stopTracking done');
      } finally {
        stopActionInProgressRef.current = false;
        setTimeout(() => setSkipRestoring(false), 500);
      }
      return result;
    };
    if (routePointCount < 10) {
      Alert.alert(
        t('screens.tracking.discardTitle'),
        t('screens.tracking.discardMessage'),
        [
          { text: t('screens.tracking.cancel'), style: 'cancel' },
          {
            text: t('screens.tracking.discard'),
            style: 'destructive',
            onPress: async () => {
              const result = await runStopTracking();
              if (!result) {
                Alert.alert(
                  t('screens.tracking.discardedTitle'),
                  t('screens.tracking.discardedMessage')
                );
              }
            },
          },
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
              const result = await runStopTracking();
              if (result) {
                Alert.alert(t('screens.tracking.savedTitle'), t('screens.tracking.savedMessage'));
              } else {
                Alert.alert(
                  t('screens.tracking.saveFailedTitle'),
                  t('screens.tracking.saveFailedMessage')
                );
              }
            },
          },
        ]
      );
    }
  };

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
  const statsVisible = status !== TRACKER_STATUS.IDLE;
  const isIdle = status === TRACKER_STATUS.IDLE;
  const showStop = status !== TRACKER_STATUS.IDLE;
  const controlsBottomOffset = Math.max(4, tabBarHeight - insets.bottom - 50);

  const handleNavigateRoutesHistory = () => {
    console.log('Volviendo a rutinas...');
    navigation.navigate('RoutesHistoryScreen');
  };

  const handleToggleRodadasList = () => {
    setShowRodadasList(!showRodadasList);
  };

  const handleOpenCreateRodada = () => {
    setShowCreateRodadaModal(true);
  };

  const handleToggleMapType = () => {
    setMapType((prev) => (prev === 'standard' ? 'hybrid' : 'standard'));
  };

  const handleCenterMap = async () => {
    try {
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
      console.log('Error obteniendo ubicacion:', err);
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
  };

  const handleSelectRodadaFromMap = useCallback((rodada) => {
    setSelectedRodada(rodada);
    setShowRodadaBadge(true);
    setSelectedLiveSkaterId(null);
    setShowLiveSkaterBadge(false);
  }, []);

  const handleSelectLiveSkater = useCallback((skater) => {
    setSelectedLiveSkaterId(skater.userId);
    setShowLiveSkaterBadge(true);
    setShowRodadaBadge(false);
    setSelectedRodada(null);
  }, []);

  const handleOpenRodadaDetailFromMap = useCallback(async (rodada) => {
    const detail = await fetchRodadaById(rodada.id);
    const target = detail || rodada;
    await handleOpenRodadaDetail(target);
    setShowRodadaBadge(false);
  }, [fetchRodadaById, handleOpenRodadaDetail]);

  const handleSelectRodadaFromList = async (rodada) => {
    await ensureRodadasVisible();
    setSelectedRodada(rodada);
    setShowRodadaBadge(true);
    setShowRodadasList(false);
    if (mapRef.current && rodada.punto_salida_lat) {
      mapRef.current.animateToRegion(
        {
          latitude: rodada.punto_salida_lat,
          longitude: rodada.punto_salida_lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    }
  };

  const handleOpenRodadaDetailFromList = async (rodada) => {
    await ensureRodadasVisible();
    handleOpenRodadaDetail(rodada);
  };

  const handleDismissRodadaBadge = () => {
    setShowRodadaBadge(false);
    if (!showRodadaDetail) {
      setSelectedRodada(null);
    }
  };

  const handleDismissLiveSkaterBadge = () => {
    setShowLiveSkaterBadge(false);
    setSelectedLiveSkaterId(null);
  };

  const handleCenterOnRodada = (rodada) => {
    if (
      rodada?.punto_salida_lat &&
      rodada?.punto_salida_lng &&
      mapRef.current
    ) {
      mapRef.current.animateToRegion(
        {
          latitude: rodada.punto_salida_lat,
          longitude: rodada.punto_salida_lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    }
    setShowRodadaDetail(false);
  };

  const handleJoinRodadaFromDetail = async (rodada) => {
    await handleJoinRodada(rodada);
    setIsUserJoined(true);
  };

  const handleDeleteRodada = (rodada) => {
    Alert.alert(
      t('rodadas.deleteTitle'),
      t('rodadas.deleteMessage', { nombre: rodada?.nombre }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            setDeletingRodada(true);
            const result = await eliminarRodada(rodada.id);
            setDeletingRodada(false);
            if (result.success) {
              setShowRodadaDetail(false);
              Alert.alert(t('common.success'), t('rodadas.deleteSuccess'));
            } else {
              Alert.alert(
                t('common.error'),
                result.error || t('rodadas.deleteError')
              );
            }
          },
        },
      ]
    );
  };

  const handleRetryPermissions = () => {
    console.log('Reintentando permisos...');
    requestLocationPermission();
  };

  // Callback para cuando el usuario mueve el mapa manualmente
  const handleMapPan = useCallback(() => {
    setIsMapAutoCenter(false);
  }, []);

const statsContainerStyle = {
    backgroundColor: isDark ? 'rgba(12, 16, 24, 0.7)' : 'rgba(255, 255, 255, 0.75)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
  };
  const statsTextPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const statsTextSecondary = isDark ? '#E2E8F0' : '#1E293B';

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[
        styles.container,
        { backgroundColor: theme.colors.background.primary },
      ]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />




      <TrackingMap
        mapRef={mapRef}
        mapType={mapType}
        onMapPan={handleMapPan}
        initialRegion={INITIAL_REGION_MEDELLIN}
        routeCoordinates={displayRouteCoordinates}
        theme={theme}
        isDark={isDark}
        livePaths={livePaths}
        currentLocation={mapMarkerLocation}
        visibleLiveSkaters={visibleLiveSkaters}
        getSkaterColor={getSkaterColor}
        showRodadasOnMap={showRodadasOnMap}
        filteredRodadas={filteredRodadas}
        getRodadaVisuals={getRodadaVisuals}
        onSelectRodada={handleSelectRodadaFromMap}
        onDoublePressRodada={handleOpenRodadaDetailFromMap}
        onSelectSkater={handleSelectLiveSkater}
        spots={spots}
        showSpotsOnMap={showSpotsOnMap}
        startFlag={startFlag}
      />

      <HistoricalRouteBadge
        historicalRoute={historicalRoute}
        isDark={isDark}
        onClose={clearHistoricalRoute}
      />

      <TrackingHeader
        isDark={isDark}
        theme={theme}
        showRodadasList={showRodadasList}
        showRodadasOnMap={showRodadasOnMap}
        mapType={mapType}
        onNavigateRoutesHistory={handleNavigateRoutesHistory}
        onToggleRodadasList={handleToggleRodadasList}
        onOpenCreateRodada={handleOpenCreateRodada}
        onToggleMapType={handleToggleMapType}
        onToggleRodadasVisibility={toggleRodadasVisibility}
      />

      <RodadasListPanel
        visible={showRodadasList}
        isDark={isDark}
        theme={theme}
        isLoadingRodadas={isLoadingRodadas}
        filteredRodadas={filteredRodadas}
        user={user}
        getRodadaVisuals={getRodadaVisuals}
        onClose={() => setShowRodadasList(false)}
        onSelectRodada={handleSelectRodadaFromList}
        onOpenRodadaDetail={handleOpenRodadaDetailFromList}
      />

      <RodadaBadge
        visible={selectedRodada && showRodadaBadge}
        selectedRodada={selectedRodada}
        getRodadaVisuals={getRodadaVisuals}
        onDismiss={handleDismissRodadaBadge}
      />

      <LiveSkaterBadge
        visible={showLiveSkaterBadge && selectedLiveSkater}
        skater={selectedLiveSkater}
        distanceMeters={0}
        getSkaterColor={getSkaterColor}
        onDismiss={handleDismissLiveSkaterBadge}
      />

      <TrackingStatsTop
        visible={statsVisible}
        statsOpacity={statsOpacity}
        showStats={showStats}
        statsContainerStyle={statsContainerStyle}
        statsTextSecondary={statsTextSecondary}
        statsTextPrimary={statsTextPrimary}
        theme={theme}
        t={t}
        formatDistance={formatDistance}
        formatDuration={formatDuration}
        distance={distance}
        duration={duration}
        speed={speed}
      />

      <TrackingStatsSide
        visible={statsVisible}
        statsOpacity={statsOpacity}
        showStats={showStats}
        statsContainerStyle={statsContainerStyle}
        statsTextSecondary={statsTextSecondary}
        theme={theme}
        avgSpeed={avgSpeed}
        maxSpeed={maxSpeed}
        calories={calories}
      />

      <TrackingControls
        isIdle={isIdle}
        showStop={showStop}
        handleStopTracking={handleStopTracking}
        handleMainButton={handleMainButton}
        buttonConfig={buttonConfig}
        pulseAnim={pulseAnim}
        isDark={isDark}
        theme={theme}
        bottomOffset={controlsBottomOffset}
        onCenterMap={handleCenterMap}
        isPrivateTracking={isPrivateTracking}
        onToggleTrackingPrivacy={() => setIsPrivateTracking((prev) => !prev)}
      />

      <TrackingErrorBanner
        error={error}
        isDark={isDark}
        theme={theme}
        onRetry={handleRetryPermissions}
      />

      {/* 🛼 Modal para crear rodada */}
      <CreateRodadaModal
        visible={showCreateRodadaModal}
        onClose={() => setShowCreateRodadaModal(false)}
        onSuccess={(rodada) => {
          console.log("✅ Rodada creada:", rodada);
          Alert.alert(
            t('rodadas.created'),
            t('rodadas.createdMessage', { nombre: rodada.nombre }),
            [{ text: t('rodadas.great') }]
          );
                setIsMapAutoCenter(true);
          fetchRodadas(); // Recargar lista
        }}
      />

      <RodadaDetailModal
        visible={showRodadaDetail}
        selectedRodada={selectedRodada}
        user={user}
        isDark={isDark}
        theme={theme}
        checkingJoin={checkingJoin}
        isUserJoined={isUserJoined}
        joiningRodada={joiningRodada}
        deletingRodada={deletingRodada}
        onClose={() => setShowRodadaDetail(false)}
        onCenterOnRodada={handleCenterOnRodada}
        onJoinRodada={handleJoinRodadaFromDetail}
        onLeaveRodada={handleLeaveRodada}
        onDeleteRodada={handleDeleteRodada}
      />
    </SafeAreaView>
  );
}
