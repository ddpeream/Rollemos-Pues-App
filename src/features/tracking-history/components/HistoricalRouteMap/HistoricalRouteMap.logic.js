import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { useTheme } from '../../../../hooks/useTheme';
import TrackingMap from '../../../tracking/components/TrackingMap/TrackingMap.logic';
import { flattenRouteSegments } from '../../../tracking/store/trackingRoute.logic';
import {
  TRACKING_HISTORY_MAP_EDGE_PADDING,
  TRACKING_HISTORY_MAP_FIT_DELAY_MS,
} from '../../constants/trackingHistory.constants';
import HistoricalRouteBadge from '../HistoricalRouteBadge/HistoricalRouteBadge';
import HistoricalRouteMapView from './HistoricalRouteMap.ui';

export default function HistoricalRouteMap({ badgeCopy, onClose, route }) {
  const mapRef = useRef(null);
  const [mapType] = useState(Platform.OS === 'android' ? 'standard' : 'hybrid');
  const { isDark, theme } = useTheme();
  const routeSegments = useMemo(() => route?.routeSegments || [], [route?.routeSegments]);
  const routeCoordinates = useMemo(() => flattenRouteSegments(routeSegments), [routeSegments]);

  useEffect(() => {
    if (!mapRef.current || routeCoordinates.length < 2) return undefined;

    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(routeCoordinates, {
        animated: true,
        edgePadding: TRACKING_HISTORY_MAP_EDGE_PADDING,
      });
    }, TRACKING_HISTORY_MAP_FIT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [routeCoordinates]);

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
          livePaths={{}}
          liveSkaters={[]}
          mapRef={mapRef}
          mapType={mapType}
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
