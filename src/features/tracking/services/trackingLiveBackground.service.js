import { getAuthSession } from '../../auth/services/auth.service';
import {
  TRACKING_LIVE_ERROR,
  TRACKING_LIVE_PUBLISH_REASON,
} from '../constants/trackingLive.constants';
import { loadTrackingPrivacy } from './trackingPrivacy.service';
import { publishTrackingLiveLocation } from './trackingLivePublisher.service';

export const publishTrackingLiveBackgroundLocation = async ({
  coordinate,
  routeId,
}) => {
  try {
    if (await loadTrackingPrivacy()) {
      return {
        error: null,
        ok: true,
        published: false,
        reason: TRACKING_LIVE_PUBLISH_REASON.PRIVATE,
      };
    }

    const authResult = await getAuthSession();
    const userId = authResult.data?.user?.id || null;
    if (!authResult.ok || !userId) {
      return {
        error: authResult.error,
        ok: authResult.ok,
        published: false,
        reason: TRACKING_LIVE_PUBLISH_REASON.MISSING_USER,
      };
    }

    return publishTrackingLiveLocation({
      coordinate,
      force: false,
      routeId,
      userId,
    });
  } catch (error) {
    return {
      error: error?.message || TRACKING_LIVE_ERROR.BACKGROUND_PUBLISH_FAILED,
      ok: false,
      published: false,
    };
  }
};
