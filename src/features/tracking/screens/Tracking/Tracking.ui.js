import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TrackingControls from '../../components/TrackingControls/TrackingControls.logic';
import TrackingHeader from '../../components/TrackingHeader/TrackingHeader.logic';
import TrackingMap from '../../components/TrackingMap/TrackingMap.logic';
import TrackingStatsSide from '../../components/TrackingStatsSide/TrackingStatsSide.logic';
import TrackingStatsTop from '../../components/TrackingStatsTop/TrackingStatsTop.logic';
import { styles } from './tracking.style';

export default function TrackingView({
  buttonConfig,
  isDark,
  isLivePrivate,
  isMainActionLoading,
  isStopping,
  livePaths,
  liveSkaters,
  mapRef,
  mapType,
  onCenterMap,
  onOpenHistory,
  onMainButtonPress,
  onStopTracking,
  onToggleLivePrivacy,
  onToggleMapType,
  routeSegments,
  showStop,
  startFlag,
  statsContainerStyle,
  theme,
  trackingStats,
  userCoordinate,
}) {
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
    >
      <StatusBar barStyle="light-content" />

      <TrackingMap
        isDark={isDark}
        livePaths={livePaths}
        liveSkaters={liveSkaters}
        mapRef={mapRef}
        mapType={mapType}
        routeSegments={routeSegments}
        startFlag={startFlag}
        theme={theme}
        userCoordinate={userCoordinate}
      />

      <TrackingStatsTop
        statsContainerStyle={statsContainerStyle}
        statsTextSecondary={theme.colors.tracking.statsTextSecondary}
        statsTextPrimary={theme.colors.tracking.statsTextPrimary}
        theme={theme}
        distance={trackingStats.distance}
        duration={trackingStats.duration}
        speed={trackingStats.speed}
      />

      <TrackingStatsSide
        statsContainerStyle={statsContainerStyle}
        statsTextSecondary={theme.colors.tracking.statsTextSecondary}
        theme={theme}
        avgSpeed={trackingStats.avgSpeed}
        maxSpeed={trackingStats.maxSpeed}
        calories={trackingStats.calories}
      />

      <TrackingHeader
        theme={theme}
        mapType={mapType}
        onOpenHistory={onOpenHistory}
        onToggleMapType={onToggleMapType}
      />

      <TrackingControls
        buttonConfig={buttonConfig}
        isMainActionLoading={isMainActionLoading}
        isLivePrivate={isLivePrivate}
        isStopping={isStopping}
        theme={theme}
        bottomOffset={theme.tracking.controls.bottomOffset}
        onCenterMap={onCenterMap}
        onMainButtonPress={onMainButtonPress}
        onToggleLivePrivacy={onToggleLivePrivacy}
        onStopTracking={onStopTracking}
        showStop={showStop}
      />
    </SafeAreaView>
  );
}
