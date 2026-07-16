import { useCallback, useRef } from 'react';

import {
  TRACKING_BACKGROUND_RESULT,
} from '../constants/trackingBackground.constants';
import { TRACKING_ERROR } from '../constants/tracking.constants';
import {
  startBackgroundTracking,
  stopBackgroundTracking,
} from '../services/backgroundTracking.service';
import { reconcileTrackingBackgroundPoints } from '../services/trackingBackgroundReconciliation.logic';
import { useTrackingStore } from '../store/trackingStore';

export function useTrackingBackgroundSession({ persistSession }) {
  const setError = useTrackingStore((state) => state.setError);
  const reconciliationPromiseRef = useRef(null);

  const reconcileBackgroundPoints = useCallback(() => {
    if (!reconciliationPromiseRef.current) {
      reconciliationPromiseRef.current = (async () => {
        try {
          await reconcileTrackingBackgroundPoints({ persistSession });
          return true;
        } catch {
          setError(TRACKING_ERROR.BACKGROUND_RECONCILIATION_FAILED);
          return false;
        }
      })().finally(() => {
        reconciliationPromiseRef.current = null;
      });
    }

    return reconciliationPromiseRef.current;
  }, [persistSession, setError]);

  const startBackgroundSession = useCallback(async () => {
    try {
      const result = await startBackgroundTracking();

      if (result.reason === TRACKING_BACKGROUND_RESULT.PERMISSION_DENIED) {
        setError(TRACKING_ERROR.BACKGROUND_PERMISSION_DENIED);
      } else if (result.reason === TRACKING_BACKGROUND_RESULT.NOT_AVAILABLE) {
        setError(TRACKING_ERROR.BACKGROUND_UNAVAILABLE);
      }

      return result.started;
    } catch {
      setError(TRACKING_ERROR.BACKGROUND_START_FAILED);
      return false;
    }
  }, [setError]);

  const stopAndReconcileBackgroundSession = useCallback(async () => {
    try {
      await stopBackgroundTracking();
    } catch {
      setError(TRACKING_ERROR.BACKGROUND_STOP_FAILED);
      return false;
    }

    return reconcileBackgroundPoints();
  }, [reconcileBackgroundPoints, setError]);

  return {
    reconcileBackgroundPoints,
    startBackgroundSession,
    stopAndReconcileBackgroundSession,
  };
}

export default useTrackingBackgroundSession;
