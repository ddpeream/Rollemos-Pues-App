import { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRodadas } from './useRodadas';
import { useRealtimeSubscription } from './useRealtimeSubscription';

const SHOW_RODADAS_KEY = '@tracking_show_rodadas';

export const useTrackingRodadas = ({ user, navigation, route }) => {
  const {
    rodadas,
    fetchRodadas,
    isLoading: isLoadingRodadas,
    fetchRodadaById,
    unirseARodada,
    salirDeRodada,
    eliminarRodada,
    verificarParticipacion,
  } = useRodadas();

  const [deletingRodada, setDeletingRodada] = useState(false);
  const [showRodadasList, setShowRodadasList] = useState(false);
  const [showRodadaDetail, setShowRodadaDetail] = useState(false);
  const [selectedRodada, setSelectedRodada] = useState(null);
  const [showRodadaBadge, setShowRodadaBadge] = useState(true);
  const [showRodadasOnMap, setShowRodadasOnMap] = useState(true);
  const [joiningRodada, setJoiningRodada] = useState(null);
  const [isUserJoined, setIsUserJoined] = useState(false);
  const [checkingJoin, setCheckingJoin] = useState(false);

  useEffect(() => {
    const loadRodadasVisibility = async () => {
      try {
        const stored = await AsyncStorage.getItem(SHOW_RODADAS_KEY);
        if (stored !== null) {
          setShowRodadasOnMap(stored === 'true');
        }
      } catch (error) {
        console.error('Error cargando preferencia de rodadas:', error);
      }
    };

    loadRodadasVisibility();
  }, []);

  useEffect(() => {
    const rodadaId = route.params?.rodadaId;
    if (!rodadaId) return;

    const found = rodadas.find((rodada) => rodada.id === rodadaId);
    if (!found) return;

    setSelectedRodada(found);
    setShowRodadasList(false);
    setShowRodadaDetail(true);
    setShowRodadaBadge(false);

    navigation.setParams({ rodadaId: undefined });
  }, [route.params?.rodadaId, rodadas, navigation]);

  useRealtimeSubscription(
    'rodadas',
    () => {
      console.log('Nueva rodada o cambio detectado');
      fetchRodadas({ soloProximas: false });
    },
    showRodadasList
  );

  useRealtimeSubscription(
    'rodadas_participantes',
    () => {
      console.log('Participantes de rodada actualizados');
      fetchRodadas({ soloProximas: false });
    },
    showRodadasList
  );

  const toggleRodadasVisibility = useCallback(async () => {
    try {
      const nextValue = !showRodadasOnMap;
      setShowRodadasOnMap(nextValue);
      await AsyncStorage.setItem(SHOW_RODADAS_KEY, String(nextValue));

      if (!nextValue) {
        setShowRodadasList(false);
        setSelectedRodada(null);
        setShowRodadaBadge(false);
      }
    } catch (error) {
      console.error('Error guardando preferencia de rodadas:', error);
    }
  }, [showRodadasOnMap]);

  const ensureRodadasVisible = useCallback(async () => {
    if (showRodadasOnMap) return;
    try {
      setShowRodadasOnMap(true);
      await AsyncStorage.setItem(SHOW_RODADAS_KEY, 'true');
    } catch (error) {
      console.error('Error guardando preferencia de rodadas:', error);
    }
  }, [showRodadasOnMap]);

  const handleJoinRodada = useCallback(
    async (rodada) => {
      if (!user?.id) {
        Alert.alert('Iniciar sesion', 'Debes iniciar sesion para unirte a una rodada');
        return;
      }

      if (rodada.organizador_id === user.id) {
        Alert.alert('Eres el organizador', 'No puedes unirte a tu propia rodada');
        return;
      }

      setJoiningRodada(rodada.id);
      try {
        const result = await unirseARodada(rodada.id, user.id);
        if (result.success) {
          if (result.alreadyJoined) {
            Alert.alert('Ya estas unido', `Ya eres parte de "${rodada.nombre}"`);
          } else {
            Alert.alert('Te uniste!', `Te has unido a "${rodada.nombre}"`);
          }
          fetchRodadas({ soloProximas: false });
        } else {
          Alert.alert('Error', result.error || 'No se pudo unir a la rodada');
        }
      } catch (error) {
        Alert.alert('Error', 'Ocurrio un error al unirse');
      } finally {
        setJoiningRodada(null);
      }
    },
    [fetchRodadas, unirseARodada, user]
  );

  const handleLeaveRodada = useCallback(
    async (rodada) => {
      if (!user?.id) return;

      Alert.alert(
        'Abandonar rodada',
        `Seguro que quieres abandonar "${rodada.nombre}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Abandonar',
            style: 'destructive',
            onPress: async () => {
              setJoiningRodada(rodada.id);
              try {
                const result = await salirDeRodada(rodada.id, user.id);
                if (result.success) {
                  setIsUserJoined(false);
                  Alert.alert('Info', `Has abandonado "${rodada.nombre}"`);
                  fetchRodadas({ soloProximas: false });
                } else {
                  Alert.alert('Error', result.error || 'No se pudo abandonar la rodada');
                }
              } catch (error) {
                Alert.alert('Error', 'Ocurrio un error al abandonar');
              } finally {
                setJoiningRodada(null);
              }
            },
          },
        ]
      );
    },
    [fetchRodadas, salirDeRodada, user]
  );

  const handleOpenRodadaDetail = useCallback(
    async (rodada) => {
      setSelectedRodada(rodada);
      setShowRodadasList(false);
      setShowRodadaDetail(true);
      setShowRodadaBadge(true);

      if (user?.id && rodada.organizador_id !== user.id) {
        setCheckingJoin(true);
        const joined = await verificarParticipacion(rodada.id, user.id);
        setIsUserJoined(joined);
        setCheckingJoin(false);
      } else {
        setIsUserJoined(false);
      }
    },
    [user, verificarParticipacion]
  );

  return {
    rodadas,
    fetchRodadas,
    isLoadingRodadas,
    showRodadasList,
    setShowRodadasList,
    showRodadaDetail,
    setShowRodadaDetail,
    selectedRodada,
    setSelectedRodada,
    showRodadaBadge,
    setShowRodadaBadge,
    showRodadasOnMap,
    toggleRodadasVisibility,
    ensureRodadasVisible,
    fetchRodadaById,
    joiningRodada,
    isUserJoined,
    setIsUserJoined,
    checkingJoin,
    deletingRodada,
    setDeletingRodada,
    handleJoinRodada,
    handleLeaveRodada,
    handleOpenRodadaDetail,
    eliminarRodada,
  };
};
