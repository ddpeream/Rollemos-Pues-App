import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  fetchTrackingLive,
  subscribeTrackingLive,
  unsubscribeTrackingLive,
} from '../services/tracking';

const normalizeLiveRecord = (record) => {
  if (!record) return null;
  return {
    userId: record.user_id,
    lat: Number(record.lat),
    lng: Number(record.lng),
    speed: record.speed,
    heading: record.heading,
    isActive: record.is_active,
    updatedAt: record.updated_at,
    usuario: record.usuarios || null,
  };
};

const getSkaterGender = (skater) => {
  const raw =
    skater?.usuario?.genero ||
    skater?.usuario?.gender ||
    skater?.usuario?.sexo ||
    '';
  const value = String(raw).toLowerCase();
  if (value.startsWith('f') || value.includes('mujer')) return 'female';
  if (value.startsWith('m') || value.includes('hombre')) return 'male';
  return 'male';
};

export const getSkaterColor = (skater) => {
  return getSkaterGender(skater) === 'female' ? '#FF4FA3' : '#19C37D';
};

export const useTrackingLiveSkaters = ({ userId }) => {
  const [liveSkaters, setLiveSkaters] = useState([]);
  const [livePaths, setLivePaths] = useState({});
  const [isLoadingLiveSkaters, setIsLoadingLiveSkaters] = useState(true);

  // Replicando lógica original: solo un setState, sin liveDistances
  const appendLivePath = useCallback(
    (skaterId, lat, lng) => {
      if (!skaterId) return;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        console.warn('⚠️ Invalid coordinates for live path:', { lat, lng, skaterId });
        return;
      }
      if (userId && skaterId === userId) return;
      
      try {
        setLivePaths((prev) => {
          const prevPoints = prev[skaterId]?.points || [];
          const last = prevPoints[prevPoints.length - 1];
          if (last && last.latitude === lat && last.longitude === lng) {
            return prev;
          }
          const nextPoints = [...prevPoints, { latitude: lat, longitude: lng }];
          const maxPoints = 200;
          if (nextPoints.length > maxPoints) {
            nextPoints.splice(0, nextPoints.length - maxPoints);
          }
          return {
            ...prev,
            [skaterId]: { points: nextPoints },
          };
        });
      } catch (pathError) {
        console.error('❌ Error appending live path:', pathError);
      }
    },
    [userId]
  );

  const visibleLiveSkaters = useMemo(() => {
    try {
      return liveSkaters.filter((skater) => {
        if (!skater) return false;
        if (!skater.isActive) return false;
        if (!Number.isFinite(skater.lat) || !Number.isFinite(skater.lng)) return false;
        if (userId && skater.userId === userId) return false;
        return true;
      });
    } catch (filterError) {
      console.error('❌ Error filtering live skaters:', filterError);
      return [];
    }
  }, [liveSkaters, userId]);

  useEffect(() => {
    let isMounted = true;
    let channel = null;

    const loadLiveSkaters = async () => {
      try {
        setIsLoadingLiveSkaters(true);
        console.log('📍 Cargando patinadores en vivo...');
        
        const { ok, data, error } = await fetchTrackingLive();
        
        if (!isMounted) return;
        
        if (!ok || error) {
          console.warn('⚠️ Error cargando patinadores en vivo:', error);
          setLiveSkaters([]);
          setIsLoadingLiveSkaters(false);
          return;
        }
        
        const normalized = (data || [])
          .map(normalizeLiveRecord)
          .filter((record) => {
            if (!record) {
              console.warn('⚠️ Skipped invalid live record');
              return false;
            }
            return true;
          });
        
        if (!isMounted) return;
        
        setLiveSkaters(normalized);
        
        // Agregar puntos iniciales a las paths
        normalized.forEach((skater) => {
          if (skater?.lat && skater?.lng) {
            appendLivePath(skater.userId, skater.lat, skater.lng);
          }
        });
        
        setIsLoadingLiveSkaters(false);
      } catch (loadError) {
        console.error('❌ Error crítico cargando patinadores en vivo:', loadError);
        if (isMounted) {
          setLiveSkaters([]);
          setIsLoadingLiveSkaters(false);
        }
      }
    };

    // Cargar datos iniciales
    loadLiveSkaters();

    // Suscribirse a cambios realtime
    try {
      channel = subscribeTrackingLive((payload) => {
        if (!isMounted) return;
        
        try {
          const record = payload.new || payload.old;
          const normalized = normalizeLiveRecord(record);
          
          if (!normalized) {
            console.warn('⚠️ Skipped invalid normalized record in realtime');
            return;
          }

          if (payload.eventType === 'DELETE' || normalized.isActive === false) {
            setLiveSkaters((prev) =>
              prev.filter((item) => item.userId !== normalized.userId)
            );
            setLivePaths((prev) => {
              const next = { ...prev };
              delete next[normalized.userId];
              return next;
            });
            return;
          }

          setLiveSkaters((prev) => {
            if (!Array.isArray(prev)) {
              console.warn('⚠️ liveSkaters state corruption detected');
              return [normalized];
            }
            
            const index = prev.findIndex((item) => item?.userId === normalized.userId);
            if (index === -1) {
              return [...prev, normalized];
            }
            const next = [...prev];
            next[index] = { ...next[index], ...normalized };
            return next;
          });
          
          if (normalized?.lat && normalized?.lng) {
            appendLivePath(normalized.userId, normalized.lat, normalized.lng);
          }
        } catch (realtimeError) {
          console.error('❌ Error procesando realtime payload:', realtimeError);
        }
      });
    } catch (subscribeError) {
      console.error('❌ Error suscribiéndose a tracking_live realtime:', subscribeError);
    }

    return () => {
      isMounted = false;
      if (channel) {
        try {
          unsubscribeTrackingLive(channel);
        } catch (unsubError) {
          console.warn('⚠️ Error desinscribiendo de tracking_live:', unsubError);
        }
      }
    };
  }, [appendLivePath]);

  return {
    livePaths,
    visibleLiveSkaters,
    isLoadingLiveSkaters,
  };
};
