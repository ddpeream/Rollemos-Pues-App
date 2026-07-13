import { useCallback, useEffect, useMemo, useRef } from 'react';

import {
  loadTrackingPrivacy,
  saveTrackingPrivacy,
} from '../services/trackingPrivacy.service';
import { useTrackingStore } from '../store/trackingStore';

export function useTrackingPrivacy() {
  const hasLoadedPrivacyRef = useRef(false);

  const isLivePrivate = useTrackingStore((state) => state.isLivePrivate);
  const privacyError = useTrackingStore((state) => state.privacyError);
  const setLivePrivacy = useTrackingStore((state) => state.setLivePrivacy);
  const setPrivacyError = useTrackingStore((state) => state.setPrivacyError);

  useEffect(() => {
    if (hasLoadedPrivacyRef.current) return;
    hasLoadedPrivacyRef.current = true;

    loadTrackingPrivacy()
      .then(setLivePrivacy)
      .catch((error) => {
        setPrivacyError(error?.message || 'tracking_privacy_load_failed');
      });
  }, [setLivePrivacy, setPrivacyError]);

  const toggleLivePrivacy = useCallback(async () => {
    const nextPrivacy = !useTrackingStore.getState().isLivePrivate;

    try {
      await saveTrackingPrivacy(nextPrivacy);
      setLivePrivacy(nextPrivacy);
      return nextPrivacy;
    } catch (error) {
      setPrivacyError(error?.message || 'tracking_privacy_save_failed');
      return useTrackingStore.getState().isLivePrivate;
    }
  }, [setLivePrivacy, setPrivacyError]);

  return useMemo(() => ({
    isLivePrivate,
    privacyError,
    toggleLivePrivacy,
  }), [isLivePrivate, privacyError, toggleLivePrivacy]);
}

export default useTrackingPrivacy;
