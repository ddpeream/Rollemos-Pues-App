import { useEffect } from 'react';

import {
  TRACKING_METRICS_FILTER,
  TRACKING_STATUS,
} from '../constants/tracking.constants';
import { useTrackingStore } from '../store/trackingStore';

export function useTrackingMetrics() {
  const status = useTrackingStore((state) => state.status);
  const tickTrackingMetrics = useTrackingStore((state) => state.tickTrackingMetrics);

  useEffect(() => {
    if (status === TRACKING_STATUS.IDLE) return undefined;

    tickTrackingMetrics();

    if (status !== TRACKING_STATUS.TRACKING) return undefined;

    const interval = setInterval(
      tickTrackingMetrics,
      TRACKING_METRICS_FILTER.TICK_INTERVAL_MS,
    );
    return () => clearInterval(interval);
  }, [status, tickTrackingMetrics]);
}

export default useTrackingMetrics;
