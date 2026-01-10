import { useEffect, useState } from 'react';

export const useTrackingHistory = ({ route, mapRef, navigation }) => {
  const [historicalRoute, setHistoricalRoute] = useState(null);

  useEffect(() => {
    if (route.params?.historicalRoute) {
      console.log(
        'Ruta historica recibida:',
        route.params.historicalRoute.id
      );
      setHistoricalRoute(route.params.historicalRoute);
      if (mapRef.current && route.params.historicalRoute.coordinates?.length > 0) {
        setTimeout(() => {
          mapRef.current.fitToCoordinates(route.params.historicalRoute.coordinates, {
            edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
            animated: true,
          });
        }, 500);
      }
    }
  }, [route.params?.historicalRoute, mapRef]);

  useEffect(() => {
    if (route.params?.historicalRoute) return;
    if (!historicalRoute?.coordinates?.length || !mapRef.current) return;
    mapRef.current.fitToCoordinates(historicalRoute.coordinates, {
      edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
      animated: true,
    });
  }, [historicalRoute, route.params?.historicalRoute, mapRef]);

  const clearHistoricalRoute = () => {
    setHistoricalRoute(null);
    navigation.setParams({ historicalRoute: undefined });
  };

  return { historicalRoute, clearHistoricalRoute };
};
