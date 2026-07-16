import { useCallback } from 'react';

import { useAuthStore } from '../../features/auth';
import { deactivateTrackingLivePresence } from '../../features/tracking/services/trackingLivePublisher.service';

export function useAppLogout() {
  const logout = useAuthStore((state) => state.logout);
  const userId = useAuthStore((state) => state.authUser?.id || null);

  return useCallback(async () => {
    try {
      if (userId) {
        await deactivateTrackingLivePresence(userId);
      }
    } catch {
      // Presence cleanup is best-effort and must not block local sign-out.
    }

    return logout();
  }, [logout, userId]);
}

export default useAppLogout;
