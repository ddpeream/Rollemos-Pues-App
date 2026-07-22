import { supabase } from '../../../config/supabase';
import { TRACKING_LIVE } from '../constants/trackingLive.constants';
import {
  normalizeTrackingLiveCoordinate,
  normalizeTrackingLiveProfile,
  normalizeTrackingLiveSkater,
} from '../normalizers/trackingLive.normalizer';

const LIVE_PROFILE_COLUMNS = 'id, nombre, avatar_url, ciudad, nivel, disciplina';
const LIVE_ROW_SELECT = 'user_id, lat, lng, speed, heading, is_active, updated_at';

export { normalizeTrackingLiveSkater };

export const upsertTrackingLive = async ({
  coordinate,
  isActive = true,
  userId,
}) => {
  const normalizedCoordinate = normalizeTrackingLiveCoordinate(
    coordinate,
    coordinate?.timestamp || Date.now(),
  );

  if (!userId || !normalizedCoordinate) {
    return { data: null, error: 'missing_tracking_live_data', ok: false };
  }

  const payload = {
    heading: normalizedCoordinate.heading,
    is_active: isActive,
    lat: normalizedCoordinate.latitude,
    lng: normalizedCoordinate.longitude,
    speed: normalizedCoordinate.speed,
    user_id: userId,
  };

  const { data, error } = await supabase
    .from(TRACKING_LIVE.TABLE_NAME)
    .upsert(payload, { onConflict: 'user_id' })
    .select(LIVE_ROW_SELECT)
    .single();

  if (error) {
    return { data: null, error: error.message, ok: false };
  }

  return {
    data: normalizeTrackingLiveSkater(data),
    error: null,
    ok: true,
  };
};

export const setTrackingLiveActive = async ({ isActive, userId }) => {
  if (!userId) return { error: 'missing_tracking_live_user', ok: false };

  const { error } = await supabase
    .from(TRACKING_LIVE.TABLE_NAME)
    .update({ is_active: isActive })
    .eq('user_id', userId);

  if (error) return { error: error.message, ok: false };
  return { error: null, ok: true };
};

export const fetchTrackingLive = async ({ excludeUserId = null } = {}) => {
  const { data, error } = await supabase.rpc(
    TRACKING_LIVE.ACTIVE_FUNCTION_NAME,
    {
      p_exclude_user_id: excludeUserId,
      p_stale_after_seconds: Math.ceil(TRACKING_LIVE.STALE_TIMEOUT_MS / 1000),
    },
  );

  if (error) {
    return { data: [], error: error.message, ok: false };
  }

  return {
    data: (data || [])
      .map(normalizeTrackingLiveSkater)
      .filter(Boolean),
    error: null,
    ok: true,
  };
};

export const fetchTrackingLiveProfile = async (userId) => {
  if (!userId) return { data: null, error: null, ok: true };

  const { data, error } = await supabase
    .from('usuarios')
    .select(LIVE_PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();

  if (error) return { data: null, error: error.message, ok: false };
  return { data: normalizeTrackingLiveProfile(data), error: null, ok: true };
};

export const subscribeTrackingLive = ({
  channelKey = 'default',
  onChange,
  onStatus,
}) => (
  supabase
    .channel(`${TRACKING_LIVE.CHANNEL_NAME}:${channelKey}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TRACKING_LIVE.TABLE_NAME },
      (payload) => {
        const isDelete = payload.eventType === 'DELETE';
        const record = isDelete ? payload.old : payload.new;
        const userId = record?.user_id || null;
        if (!userId) return;

        onChange?.({
          eventType: payload.eventType,
          skater: isDelete ? null : normalizeTrackingLiveSkater(record),
          userId,
        });
      },
    )
    .subscribe((status, error) => onStatus?.({ error, status }))
);

export const unsubscribeTrackingLive = (channel) => (
  channel ? supabase.removeChannel(channel) : Promise.resolve(null)
);
