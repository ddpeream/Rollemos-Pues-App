import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { AnimatedRegion } from 'react-native-maps';

import { trackingTokens } from '../../../../theme';
import { createReactNativeMapsMarkerController } from '../../platform/map/reactNativeMaps.markerController';
import SkateMarkerView from './SkateMarker.ui';

function SkateMarker({ coordinate, color, heading = 0 }) {
  const markerRef = useRef(null);
  const animatedCoordinateRef = useRef(null);
  const previousCoordinateRef = useRef(null);
  const hasCoordinate = Boolean(coordinate);
  const [tracksViewChanges, setTracksViewChanges] = useState(Platform.OS === 'android');
  const markerController = useMemo(
    () => createReactNativeMapsMarkerController(markerRef, animatedCoordinateRef),
    [],
  );

  if (!animatedCoordinateRef.current && coordinate) {
    animatedCoordinateRef.current = new AnimatedRegion({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    });
  }

  useEffect(() => {
    if (Platform.OS !== 'android' || !hasCoordinate) return undefined;

    setTracksViewChanges(true);

    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, trackingTokens.map.markerRenderSettleDurationMs);

    return () => clearTimeout(timer);
  }, [color, hasCoordinate]);

  useEffect(() => {
    if (!coordinate) {
      animatedCoordinateRef.current = null;
      previousCoordinateRef.current = null;
      return;
    }

    const previousCoordinate = previousCoordinateRef.current;
    previousCoordinateRef.current = coordinate;

    if (!previousCoordinate) {
      markerController.setCoordinate(coordinate);
      return;
    }

    const didMove = previousCoordinate.latitude !== coordinate.latitude
      || previousCoordinate.longitude !== coordinate.longitude;
    if (!didMove) return;

    markerController.animateToCoordinate(
      coordinate,
      trackingTokens.map.markerAnimationDurationMs,
    );
  }, [coordinate, markerController]);

  if (!coordinate || !animatedCoordinateRef.current) return null;

  return (
    <SkateMarkerView
      animatedCoordinate={animatedCoordinateRef.current}
      color={color}
      flat={Platform.OS === 'android'}
      heading={heading}
      markerRef={markerRef}
      tracksViewChanges={tracksViewChanges}
    />
  );
}

export default memo(SkateMarker);
