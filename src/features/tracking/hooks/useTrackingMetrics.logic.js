import { useEffect } from 'react';

import { TRACKING_STATUS } from '../constants/tracking.constants';
import { useTrackingStore } from '../store/trackingStore';
import { getCaloriesEstimate } from '../utils/calories.utils';
import { getRouteDistance } from '../utils/distance.utils';
import {
  getAverageSpeedKmh,
  getCurrentSpeedKmh,
  getMaxSpeedKmh,
} from '../utils/speed.utils';

const getDurationSeconds = ({ pausedAt, startedAt, status, totalPausedMs }) => {
  if (!startedAt) return 0;

  const now = Date.now();
  const currentPausedMs = status === TRACKING_STATUS.PAUSED && pausedAt
    ? now - pausedAt
    : 0;

  return Math.max(0, Math.floor((now - startedAt - totalPausedMs - currentPausedMs) / 1000));
};

export function useTrackingMetrics() {
  const pausedAt = useTrackingStore((state) => state.pausedAt);
  const routeCoordinates = useTrackingStore((state) => state.routeCoordinates);
  const setMetrics = useTrackingStore((state) => state.setMetrics);
  const startedAt = useTrackingStore((state) => state.startedAt);
  const status = useTrackingStore((state) => state.status);
  const totalPausedMs = useTrackingStore((state) => state.totalPausedMs);

  useEffect(() => {
    if (!startedAt) return undefined;

    const updateMetrics = () => {
      const duration = getDurationSeconds({
        pausedAt,
        startedAt,
        status,
        totalPausedMs,
      });
      const distance = getRouteDistance(routeCoordinates);
      const avgSpeed = getAverageSpeedKmh(distance, duration);
      const speed = status === TRACKING_STATUS.TRACKING ? getCurrentSpeedKmh(routeCoordinates) : 0;
      const maxSpeed = getMaxSpeedKmh(routeCoordinates);
      const calories = getCaloriesEstimate({ avgSpeedKmh: avgSpeed, durationSeconds: duration });

      setMetrics({
        avgSpeed,
        calories,
        distance,
        duration,
        maxSpeed,
        speed,
      });
    };

    updateMetrics();

    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, [pausedAt, routeCoordinates, setMetrics, startedAt, status, totalPausedMs]);
}

export default useTrackingMetrics;
