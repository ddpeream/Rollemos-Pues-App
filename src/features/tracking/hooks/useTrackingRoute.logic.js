import { useEffect, useRef } from 'react';

import { TRACKING_STATUS } from '../constants/tracking.constants';
import { useTrackingStore } from '../store/trackingStore';

export function useTrackingRoute() {
  const appendRoutePoint = useTrackingStore((state) => state.appendRoutePoint);
  const currentLocation = useTrackingStore((state) => state.currentLocation);
  const status = useTrackingStore((state) => state.status);
  const lastAppendedTimestampRef = useRef(null);

  useEffect(() => {
    if (status !== TRACKING_STATUS.TRACKING || !currentLocation) return;
    if (lastAppendedTimestampRef.current === currentLocation.timestamp) return;

    lastAppendedTimestampRef.current = currentLocation.timestamp;
    appendRoutePoint(currentLocation);
  }, [appendRoutePoint, currentLocation, status]);
}

export default useTrackingRoute;
