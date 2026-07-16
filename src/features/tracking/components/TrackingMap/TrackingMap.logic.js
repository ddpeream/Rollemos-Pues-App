import React, { memo } from 'react';

import TrackingMapView from './TrackingMap.ui';
import { darkMapStyle } from './TrackingMap.style';

function TrackingMap({
  isDark,
  livePaths,
  liveSkaters,
  mapRef,
  mapType,
  onMapReady,
  routeSegments,
  startFlag,
  theme,
  userCoordinate,
}) {
  return (
    <TrackingMapView
      customMapStyle={isDark && mapType === 'standard' ? darkMapStyle : undefined}
      livePathColor={theme.colors.secondary}
      livePathStrokeWidth={theme.tracking.map.livePathStrokeWidth}
      livePathZIndex={theme.tracking.map.livePathZIndex}
      liveSkaterIconColor={theme.colors.onPrimary}
      liveSkaterZIndex={theme.tracking.map.liveSkaterZIndex}
      livePaths={livePaths}
      liveSkaters={liveSkaters}
      mapRef={mapRef}
      mapType={mapType}
      onMapReady={onMapReady}
      markerColor={theme.colors.primary}
      routeColor={theme.colors.primary}
      routeStrokeWidth={theme.tracking.map.localRouteStrokeWidth}
      routeZIndex={theme.tracking.map.localRouteZIndex}
      routeSegments={routeSegments}
      startFlag={startFlag}
      startFlagColor={theme.colors.success}
      startFlagIconColor={theme.colors.onPrimary}
      startFlagZIndex={theme.tracking.map.startFlagZIndex}
      userCoordinate={userCoordinate}
    />
  );
}

export default memo(TrackingMap);
