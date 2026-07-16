import React from 'react';
import { View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { TRACKING_INITIAL_REGION } from '../../constants/tracking.constants';
import SkateMarker from '../SkateMarker/SkateMarker.logic';
import { styles } from './TrackingMap.style';

function StartFlagMarker({ color, coordinate, iconColor }) {
  if (!coordinate) return null;

  return (
    <Marker
      anchor={{ x: 0.5, y: 1 }}
      coordinate={coordinate}
      zIndex={90}
    >
      <View style={[styles.startFlagMarker, { backgroundColor: color }]}>
        <Ionicons name="flag-outline" size={18} color={iconColor} />
      </View>
    </Marker>
  );
}

function LiveSkaterMarker({ color, iconColor, skater }) {
  if (!skater?.coordinate) return null;

  return (
    <Marker
      anchor={{ x: 0.5, y: 0.5 }}
      coordinate={skater.coordinate}
      rotation={skater.heading || 0}
      zIndex={80}
    >
      <View style={[styles.liveSkaterMarker, { backgroundColor: color }]}>
        <MaterialCommunityIcons name="roller-skate" size={16} color={iconColor} />
      </View>
    </Marker>
  );
}

export default function TrackingMapView({
  customMapStyle,
  livePathColor,
  liveSkaterIconColor,
  livePaths,
  liveSkaters,
  mapRef,
  mapType,
  markerColor,
  routeColor,
  routeSegments,
  startFlag,
  startFlagColor,
  startFlagIconColor,
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
    >
      {(routeSegments || []).map((segment, index) => (
        segment?.coordinates?.length > 1 ? (
          <Polyline
            key={`route-segment-${segment.startedAt}-${index}`}
            coordinates={segment.coordinates}
            lineCap="round"
            lineJoin="round"
            strokeColor={routeColor}
            strokeWidth={4}
          />
        ) : null
      ))}

      {Object.entries(livePaths || {}).map(([userId, coordinates]) => (
        coordinates?.length > 1 ? (
          <Polyline
            key={`live-path-${userId}`}
            coordinates={coordinates}
            lineCap="round"
            lineJoin="round"
            strokeColor={livePathColor}
            strokeWidth={3}
          />
        ) : null
      ))}

      <StartFlagMarker
        color={startFlagColor}
        coordinate={startFlag}
        iconColor={startFlagIconColor}
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
        />
      ))}
    </MapView>
  );
}
