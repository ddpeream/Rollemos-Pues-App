import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { useTheme } from '../../../../hooks/useTheme';
import TrackingMap from '../../../tracking/components/TrackingMap/TrackingMap.logic';
import { createReactNativeMapsController } from '../../../tracking/platform/map/reactNativeMaps.controller';
import { flattenRouteSegments } from '../../../tracking/store/trackingRoute.logic';
import { TRACKING_HISTORY_MAP_EDGE_PADDING } from '../../constants/trackingHistory.constants';
import HistoricalRouteBadge from '../HistoricalRouteBadge/HistoricalRouteBadge';
import HistoricalRouteMapView from './HistoricalRouteMap.ui';

export default function HistoricalRouteMap({ badgeCopy, onClose, route }) {
  const mapRef = useRef(null);
  const fittedRouteKeyRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapType] = useState(Platform.OS === 'android' ? 'standard' : 'hybrid');
  const { isDark, theme } = useTheme();
  const routeSegments = useMemo(() => route?.routeSegments || [], [route?.routeSegments]);
  const routeCoordinates = useMemo(() => flattenRouteSegments(routeSegments), [routeSegments]);
  const mapController = useMemo(() => createReactNativeMapsController(mapRef), []);
  const routeFitKey = useMemo(() => {
    const firstCoordinate = routeCoordinates[0];
    const lastCoordinate = routeCoordinates[routeCoordinates.length - 1];

    return [
      route?.id || 'historical-route',
      routeCoordinates.length,
      firstCoordinate?.timestamp || `${firstCoordinate?.latitude}:${firstCoordinate?.longitude}`,
      lastCoordinate?.timestamp || `${lastCoordinate?.latitude}:${lastCoordinate?.longitude}`,
    ].join(':');
  }, [route?.id, routeCoordinates]);
  const handleMapReady = useCallback(() => setIsMapReady(true), []);

  useEffect(() => {
    if (!isMapReady || routeCoordinates.length < 2) return;
    if (fittedRouteKeyRef.current === routeFitKey) return;

    const didFitRoute = mapController.fitToCoordinates(routeCoordinates, {
      animated: true,
      edgePadding: TRACKING_HISTORY_MAP_EDGE_PADDING,
    });
    if (didFitRoute) fittedRouteKeyRef.current = routeFitKey;
  }, [isMapReady, mapController, routeCoordinates, routeFitKey]);

  return (
    <HistoricalRouteMapView
      badge={(
        <HistoricalRouteBadge
          copy={badgeCopy}
          onClose={onClose}
          route={route}
        />
      )}
      map={(
        <TrackingMap
          isDark={isDark}
          mapRef={mapRef}
          mapType={mapType}
          onMapReady={handleMapReady}
          routeSegments={routeSegments}
          startFlag={route?.startCoordinate || routeCoordinates[0]}
          theme={theme}
          userCoordinate={null}
        />
      )}
      styles={null}
    />
  );
}
