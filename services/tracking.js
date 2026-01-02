import { supabase } from '../config/supabase';

export const upsertTrackingLive = async ({
  userId,
  latitude,
  longitude,
  speed = null,
  heading = null,
  isActive = true,
}) => {
  if (!userId || latitude == null || longitude == null) {
    return { ok: false, error: 'Missing tracking_live data' };
  }

  const payload = {
    user_id: userId,
    lat: latitude,
    lng: longitude,
    speed,
    heading,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('tracking_live')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
};

export const fetchTrackingLive = async () => {
  const { data, error } = await supabase
    .from('tracking_live')
    .select('user_id, lat, lng, speed, heading, is_active, updated_at, usuarios ( * )')
    .eq('is_active', true);

  if (error) {
    return { ok: false, error: error.message, data: [] };
  }

  return { ok: true, data: data || [] };
};

export const subscribeTrackingLive = (onChange) => {
  return supabase
    .channel('tracking_live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tracking_live' },
      async (payload) => {
        // 📡 Si viene del realtime, necesitamos enriquecer con los datos del usuario
        if (payload.new) {
          const { data: userdata, error } = await supabase
            .from('tracking_live')
            .select('user_id, lat, lng, speed, heading, is_active, updated_at, usuarios ( * )')
            .eq('user_id', payload.new.user_id)
            .single();
          
          if (!error && userdata) {
            payload.new = userdata;
          }
        }
        
        if (typeof onChange === 'function') {
          onChange(payload);
        }
      }
    )
    .subscribe();
};

export const unsubscribeTrackingLive = (channel) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};
