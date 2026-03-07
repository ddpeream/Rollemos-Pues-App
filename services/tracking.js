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

  return { ok: true, data };
};

export const fetchTrackingLive = async () => {
  const { data, error } = await supabase
    .from('tracking_live')
    .select('user_id, lat, lng, speed, heading, is_active, updated_at, usuarios ( * )')
    .eq('is_active', true);

  if (error) {
    console.error('❌ fetchTrackingLive error:', error.message);
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
        try {
          // Si viene del realtime, necesitamos enriquecer con los datos del usuario
          if (payload.new) {
            try {
              const { data: userdata, error } = await supabase
                .from('tracking_live')
                .select('user_id, lat, lng, speed, heading, is_active, updated_at, usuarios ( * )')
                .eq('user_id', payload.new.user_id)
                .single();

              if (error) {
                console.warn('⚠️ tracking_live refetch warning:', error.message);
                // No forzar que falle, usar datos básicos del payload
              } else if (userdata) {
                // Enriquecer con datos del usuario
                payload.new = userdata;
              }
            } catch (enrichError) {
              console.warn('⚠️ Error enriqueciendo datos de tracking_live:', enrichError);
              // Continuar con datos básicos del payload
            }
          }

          // Siempre pasar el payload al callback, con o sin enriquecimiento
          if (typeof onChange === 'function') {
            try {
              onChange(payload);
            } catch (callbackError) {
              console.error('❌ Error en callback de tracking_live:', callbackError);
            }
          }
        } catch (handleError) {
          console.error('❌ Error crítico en manejo de tracking_live payload:', handleError);
        }
      }
    )
    .subscribe();
};

export const unsubscribeTrackingLive = (channel) => {
  if (channel) {
    try {
      supabase.removeChannel(channel);
    } catch (unsubError) {
      console.warn('⚠️ Error desinscribiendo de tracking_live:', unsubError);
    }
  }
};
