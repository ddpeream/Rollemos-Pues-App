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
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('❌ upsert tracking_live error:', error.message, error.code, error.details);
    return { ok: false, error: error.message };
  }

  console.log('✅ upsert tracking_live result:', data);
  return { ok: true, data };
};

export const fetchTrackingLive = async () => {
  console.log('📡 fetchTrackingLive: fetching active skaters...');
  const { data, error } = await supabase
    .from('tracking_live')
    .select('user_id, lat, lng, speed, heading, is_active, updated_at, usuarios ( * )')
    .eq('is_active', true);

  if (error) {
    console.error('❌ fetchTrackingLive error:', error.message);
    return { ok: false, error: error.message, data: [] };
  }

  console.log('✅ fetchTrackingLive result:', data?.length || 0, 'skaters');
  if (data?.length > 0) {
    data.forEach(s => console.log('  - skater:', s.user_id, 'active:', s.is_active, 'lat:', s.lat, 'lng:', s.lng));
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
        console.log('📡 tracking_live realtime:', payload.eventType, payload.new?.user_id);

        // 📡 Si viene del realtime, necesitamos enriquecer con los datos del usuario
        if (payload.new) {
          const { data: userdata, error } = await supabase
            .from('tracking_live')
            .select('user_id, lat, lng, speed, heading, is_active, updated_at, usuarios ( * )')
            .eq('user_id', payload.new.user_id)
            .single();

          if (error) {
            console.error('❌ tracking_live refetch error:', error.message);
          }

          if (!error && userdata) {
            console.log('✅ tracking_live enriched:', userdata.user_id, 'is_active:', userdata.is_active);
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
