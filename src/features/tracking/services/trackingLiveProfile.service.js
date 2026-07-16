import { fetchTrackingLiveProfile } from './trackingLive.service';

const profileCache = new Map();
const profileRequests = new Map();

export const primeTrackingLiveProfiles = (skaters) => {
  (Array.isArray(skaters) ? skaters : []).forEach((skater) => {
    if (skater?.userId && skater.user) {
      profileCache.set(skater.userId, skater.user);
    }
  });
};

export const getCachedTrackingLiveProfile = (userId) => (
  profileCache.has(userId) ? profileCache.get(userId) : null
);

export const resolveTrackingLiveProfile = async (userId) => {
  if (!userId) return { error: null, ok: true, profile: null };
  if (profileCache.has(userId)) {
    return { error: null, ok: true, profile: profileCache.get(userId) };
  }

  if (!profileRequests.has(userId)) {
    profileRequests.set(userId, fetchTrackingLiveProfile(userId)
      .then((result) => {
        if (result.ok) profileCache.set(userId, result.data);
        return { ...result, profile: result.data };
      })
      .catch((error) => ({
        error: error?.message || 'tracking_live_profile_fetch_failed',
        ok: false,
        profile: null,
      }))
      .finally(() => {
        profileRequests.delete(userId);
      }));
  }

  return profileRequests.get(userId);
};
