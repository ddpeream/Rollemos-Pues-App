import React from 'react';

import TrackingMapView from './TrackingMap.ui';
import { darkMapStyle } from './TrackingMap.style';

export default function TrackingMap({
  isDark,
  livePaths,
  liveSkaters,
  mapRef,
  mapType,
  routeCoordinates,
  startFlag,
  theme,
  userCoordinate,
}) {
  return (
    <TrackingMapView
      customMapStyle={isDark && mapType === 'standard' ? darkMapStyle : undefined}
      livePathColor={theme.colors.secondary}
      liveSkaterIconColor={theme.colors.onPrimary}
      livePaths={livePaths}
      liveSkaters={liveSkaters}
      mapRef={mapRef}
      mapType={mapType}
      markerColor={theme.colors.primary}
      routeColor={theme.colors.primary}
      routeCoordinates={routeCoordinates}
      startFlag={startFlag}
      startFlagColor={theme.colors.success}
      startFlagIconColor={theme.colors.onPrimary}
      userCoordinate={userCoordinate}
    />
  );
}
