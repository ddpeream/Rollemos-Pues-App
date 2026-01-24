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

  // Replicando lógica original: solo un setState, sin liveDistances
  const appendLivePath = useCallback(
    (skaterId, lat, lng) => {
      if (!skaterId) return;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      if (userId && skaterId === userId) return;
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
    },
    [userId]
  );

  const visibleLiveSkaters = useMemo(() => {
    console.log('👥 visibleLiveSkaters filter:', liveSkaters.length, 'total, userId:', userId);
    return liveSkaters.filter((skater) => {
      if (!skater.isActive) {
        console.log('  ❌ filtered (inactive):', skater.userId);
        return false;
      }
      if (!Number.isFinite(skater.lat) || !Number.isFinite(skater.lng)) {
        console.log('  ❌ filtered (invalid coords):', skater.userId, skater.lat, skater.lng);
        return false;
      }
      if (userId && skater.userId === userId) {
        console.log('  ❌ filtered (self):', skater.userId);
        return false;
      }
      console.log('  ✅ visible:', skater.userId, 'lat:', skater.lat, 'lng:', skater.lng);
      return true;
    });
  }, [liveSkaters, userId]);

  useEffect(() => {
    let isMounted = true;

    const loadLiveSkaters = async () => {
      console.log('Cargando patinadores en vivo...');
      const { data } = await fetchTrackingLive();
      if (!isMounted) return;
      const normalized = (data || []).map(normalizeLiveRecord).filter(Boolean);
      setLiveSkaters(normalized);
      normalized.forEach((skater) => {
        appendLivePath(skater.userId, skater.lat, skater.lng);
      });
    };

    loadLiveSkaters();

    const channel = subscribeTrackingLive((payload) => {
      if (!isMounted) return;
      const record = payload.new || payload.old;
      const normalized = normalizeLiveRecord(record);
      if (!normalized) return;

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
        const index = prev.findIndex((item) => item.userId === normalized.userId);
        if (index === -1) {
          return [...prev, normalized];
        }
        const next = [...prev];
        next[index] = { ...next[index], ...normalized };
        return next;
      });
      appendLivePath(normalized.userId, normalized.lat, normalized.lng);
    });

    return () => {
      isMounted = false;
      unsubscribeTrackingLive(channel);
    };
  }, [appendLivePath]);

  return {
    livePaths,
    visibleLiveSkaters,
  };
};
