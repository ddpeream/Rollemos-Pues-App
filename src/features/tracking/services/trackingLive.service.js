import { supabase } from '../../../config/supabase';
import {
  normalizeTrackingLiveCoordinate,
  normalizeTrackingLiveSkater,
} from '../normalizers/trackingLive.normalizer';

const LIVE_SELECT = 'user_id, lat, lng, speed, heading, is_active, updated_at, usuarios ( * )';

export { normalizeTrackingLiveSkater };

export const upsertTrackingLive = async ({
  coordinate,
  heading = null,
  isActive = true,
  speed = null,
  userId,
}) => {
  const normalizedCoordinate = normalizeTrackingLiveCoordinate({
    ...coordinate,
    heading,
    speed,
  }, coordinate?.timestamp || Date.now());

  if (!userId || !normalizedCoordinate) {
    return { data: null, error: 'missing_tracking_live_data', ok: false };
  }

  const payload = {
    heading: normalizedCoordinate.heading,
    is_active: isActive,
    lat: normalizedCoordinate.latitude,
    lng: normalizedCoordinate.longitude,
    speed: normalizedCoordinate.speed,
    updated_at: new Date().toISOString(),
    user_id: userId,
  };

  const { data, error } = await supabase
    .from('tracking_live')
    .upsert(payload, { onConflict: 'user_id' })
    .select(LIVE_SELECT)
    .single();

  if (error) {
    return { data: null, error: error.message, ok: false };
  }

  return { data: normalizeTrackingLiveSkater(data), error: null, ok: true };
};

export const setTrackingLiveActive = async ({ isActive, userId }) => {
  if (!userId) return { error: 'missing_tracking_live_user', ok: false };

  const { error } = await supabase
    .from('tracking_live')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) return { error: error.message, ok: false };
  return { error: null, ok: true };
};

export const fetchTrackingLive = async () => {
  const { data, error } = await supabase
    .from('tracking_live')
    .select(LIVE_SELECT)
    .eq('is_active', true);

  if (error) {
    return { data: [], error: error.message, ok: false };
  }

  return {
    data: (data || []).map(normalizeTrackingLiveSkater).filter(Boolean),
    error: null,
    ok: true,
  };
};

export const subscribeTrackingLive = (onChange) => (
  supabase
    .channel('tracking_live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tracking_live' },
      async (payload) => {
        if (payload.eventType === 'DELETE') {
          onChange?.({ eventType: payload.eventType, skater: null, userId: payload.old?.user_id });
          return;
        }

        if (!payload.new?.user_id) return;

        const { data, error } = await supabase
          .from('tracking_live')
          .select(LIVE_SELECT)
          .eq('user_id', payload.new.user_id)
          .maybeSingle();

        const skater = normalizeTrackingLiveSkater(data || payload.new);
        if (!error && skater) {
          onChange?.({ eventType: payload.eventType, skater, userId: skater.userId });
        }
      },
    )
    .subscribe()
);

export const unsubscribeTrackingLive = (channel) => {
  if (!channel) return;
  supabase.removeChannel(channel);
};