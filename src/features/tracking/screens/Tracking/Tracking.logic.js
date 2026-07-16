import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { APP_ROUTES } from '../../../../navigation/navigation.constants';
import { useTheme } from '../../../../hooks/useTheme';
import { TRACKING_FOCUS_DELTA, TRACKING_STATUS } from '../../constants/tracking.constants';
import { useTrackingLiveSkaters } from '../../hooks/useTrackingLiveSkaters';
import { useTrackingMetrics } from '../../hooks/useTrackingMetrics';
import { useTrackingPrivacy } from '../../hooks/useTrackingPrivacy';
import { useTrackingRoute } from '../../hooks/useTrackingRoute';
import { useTrackingSession } from '../../hooks/useTrackingSession';
import { createReactNativeMapsController } from '../../platform/map/reactNativeMaps.controller';
import { useTrackingStore } from '../../store/trackingStore';
import {
  formatCalories,
  formatDistance,
  formatDuration,
  formatSpeed,
} from '../../utils/format.utils';
import TrackingView from './Tracking.ui';

export default function Tracking({ navigation }) {
  const mapRef = useRef(null);
  const shouldCenterOnStartRef = useRef(false);
  const [mapType, setMapType] = useState(Platform.OS === 'android' ? 'standard' : 'hybrid');
  const { isDark, theme } = useTheme();
  const {
    currentLocation,
    isPausing,
    isResuming,
    isStarting,
    isStopping,
    pauseTracking,
    resumeTracking,
    startTracking,
    status,
    stopTracking,
  } = useTrackingSession();
  const metrics = useTrackingStore((state) => state.metrics);
  const routeCoordinates = useTrackingStore((state) => state.routeCoordinates);
  const startFlag = useTrackingStore((state) => state.startFlag);
  const { isLivePrivate, toggleLivePrivacy } = useTrackingPrivacy();
  const mapController = useMemo(() => createReactNativeMapsController(mapRef), []);
  const focusRegion = useMemo(() => (
    currentLocation
      ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        ...TRACKING_FOCUS_DELTA,
      }
      : null
  ), [currentLocation]);
  const centerMapOnUser = useCallback(() => (
    focusRegion ? mapController.animateToRegion(focusRegion, 500) : false
  ), [focusRegion, mapController]);

  useTrackingRoute();
  useTrackingMetrics();
  const { livePaths, liveSkaters } = useTrackingLiveSkaters();

  const buttonConfig = useMemo(() => ({
    [TRACKING_STATUS.IDLE]: {
      color: theme.colors.primary,
      glow: theme.colors.primary,
      icon: 'play',
    },
    [TRACKING_STATUS.TRACKING]: {
      color: theme.colors.warning,
      glow: theme.colors.warning,
      icon: 'pause',
    },
    [TRACKING_STATUS.PAUSED]: {
      color: theme.colors.primary,
      glow: theme.colors.primary,
      icon: 'play',
    },
  }), [theme.colors.primary, theme.colors.warning]);

  const statsContainerStyle = useMemo(() => ({
    backgroundColor: theme.colors.tracking.panelBackground,
    borderColor: theme.colors.tracking.panelBorder,
  }), [
    theme.colors.tracking.panelBackground,
    theme.colors.tracking.panelBorder,
  ]);

  const handleToggleMapType = () => {
    setMapType((current) => (current === 'standard' ? 'hybrid' : 'standard'));
  };

  const handleCenterMap = () => {
    centerMapOnUser();
  };

  const handleOpenHistory = () => {
    const parentNavigation = navigation.getParent?.();
    (parentNavigation || navigation).navigate(APP_ROUTES.TRACKING_HISTORY);
  };

  const handleMainButton = async () => {
    if (status === TRACKING_STATUS.IDLE) {
      const didStart = await startTracking();
      shouldCenterOnStartRef.current = didStart;
      return;
    }

    if (status === TRACKING_STATUS.TRACKING) {
      await pauseTracking();
      return;
    }

    if (status === TRACKING_STATUS.PAUSED) {
      await resumeTracking();
    }
  };

  const handleStopTracking = async () => {
    await stopTracking();
  };

  useEffect(() => {
    if (status === TRACKING_STATUS.TRACKING && shouldCenterOnStartRef.current && currentLocation) {
      shouldCenterOnStartRef.current = false;
      centerMapOnUser();
    }
  }, [centerMapOnUser, currentLocation, status]);

  return (
    <TrackingView
      buttonConfig={buttonConfig[status]}
      isDark={isDark}
      isLivePrivate={isLivePrivate}
      isMainActionLoading={isStarting || isPausing || isResuming}
      isStopping={isStopping}
      mapRef={mapRef}
      mapType={mapType}
      livePaths={livePaths}
      liveSkaters={liveSkaters}
      onCenterMap={handleCenterMap}
      onOpenHistory={handleOpenHistory}
      onMainButtonPress={handleMainButton}
      onToggleLivePrivacy={toggleLivePrivacy}
      onStopTracking={handleStopTracking}
      onToggleMapType={handleToggleMapType}
      routeCoordinates={routeCoordinates}
      showStop={status !== TRACKING_STATUS.IDLE}
      startFlag={startFlag}
      statsContainerStyle={statsContainerStyle}
      theme={theme}
      trackingStats={{
        avgSpeed: formatSpeed(metrics.avgSpeed),
        calories: formatCalories(metrics.calories),
        distance: formatDistance(metrics.distance),
        duration: formatDuration(metrics.duration),
        maxSpeed: formatSpeed(metrics.maxSpeed),
        speed: formatSpeed(metrics.speed),
      }}
      userCoordinate={currentLocation}
    />
  );
}
