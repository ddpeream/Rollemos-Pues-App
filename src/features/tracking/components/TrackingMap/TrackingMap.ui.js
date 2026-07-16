import React, { memo } from 'react';
import { View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { TRACKING_INITIAL_REGION } from '../../constants/tracking.constants';
import SkateMarker from '../SkateMarker/SkateMarker.logic';
import { styles } from './TrackingMap.style';

const RouteSegmentPolyline = memo(function RouteSegmentPolyline({
  color,
  coordinates,
  strokeWidth,
  zIndex,
}) {
  if (!coordinates || coordinates.length < 2) return null;

  return (
    <Polyline
      coordinates={coordinates}
      lineCap="round"
      lineJoin="round"
      strokeColor={color}
      strokeWidth={strokeWidth}
      zIndex={zIndex}
    />
  );
});

const StartFlagMarker = memo(function StartFlagMarker({
  color,
  coordinate,
  iconColor,
  zIndex,
}) {
  if (!coordinate) return null;

  return (
    <Marker
      key={`start-flag-${color}-${iconColor}`}
      anchor={{ x: 0.5, y: 1 }}
      coordinate={coordinate}
      tracksViewChanges={false}
      zIndex={zIndex}
    >
      <View style={[styles.startFlagMarker, { backgroundColor: color }]}>
        <Ionicons name="flag-outline" size={18} color={iconColor} />
      </View>
    </Marker>
  );
});

const LiveSkaterMarker = memo(function LiveSkaterMarker({
  color,
  iconColor,
  skater,
  zIndex,
}) {
  if (!skater?.coordinate) return null;

  return (
    <Marker
      key={`live-skater-${color}-${iconColor}`}
      anchor={{ x: 0.5, y: 0.5 }}
      coordinate={skater.coordinate}
      rotation={skater.heading || 0}
      tracksViewChanges={false}
      zIndex={zIndex}
    >
      <View style={[styles.liveSkaterMarker, { backgroundColor: color }]}>
        <MaterialCommunityIcons name="roller-skate" size={16} color={iconColor} />
      </View>
    </Marker>
  );
});

function TrackingMapView({
  customMapStyle,
  livePathColor,
  livePathStrokeWidth,
  livePathZIndex,
  liveSkaterIconColor,
  liveSkaterZIndex,
  livePaths,
  liveSkaters,
  mapRef,
  mapType,
  markerColor,
  onMapReady,
  routeColor,
  routeSegments,
  routeStrokeWidth,
  routeZIndex,
  startFlag,
  startFlagColor,
  startFlagIconColor,
  startFlagZIndex,
  userCoordinate,
}) {
  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      initialRegion={TRACKING_INITIAL_REGION}
      mapType={mapType}
      customMapStyle={customMapStyle}
      showsUserLocation={false}
      showsMyLocationButton={false}
      moveOnMarkerPress={false}
      onMapReady={onMapReady}
    >
      {(routeSegments || []).map((segment, index) => (
        <RouteSegmentPolyline
          key={`route-segment-${segment.startedAt}-${index}`}
          color={routeColor}
          coordinates={segment?.coordinates}
          strokeWidth={routeStrokeWidth}
          zIndex={routeZIndex}
        />
      ))}

      {Object.entries(livePaths || {}).map(([userId, coordinates]) => (
        <RouteSegmentPolyline
          key={`live-path-${userId}`}
          color={livePathColor}
          coordinates={coordinates}
          strokeWidth={livePathStrokeWidth}
          zIndex={livePathZIndex}
        />
      ))}

      <StartFlagMarker
        color={startFlagColor}
        coordinate={startFlag}
        iconColor={startFlagIconColor}
        zIndex={startFlagZIndex}
      />

      <SkateMarker
        coordinate={userCoordinate}
        color={markerColor}
        heading={userCoordinate?.heading}
      />

      {(liveSkaters || []).map((skater) => (
        <LiveSkaterMarker
          key={skater.userId}
          color={livePathColor}
          iconColor={liveSkaterIconColor}
          skater={skater}
          zIndex={liveSkaterZIndex}
        />
      ))}
    </MapView>
  );
}

export default memo(TrackingMapView);
