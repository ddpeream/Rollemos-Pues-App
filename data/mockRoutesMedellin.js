/**
 * 🛹 RUTAS MOCK DE MEDELLÍN - CORREGIDAS
 *
 * Coordenadas verificadas con ubicaciones reales de Medellín
 * Rutas siguen avenidas principales aptas para patinaje
 * ~30km cada ruta (1-1.5 horas de patinaje)
 */

// Función helper para generar puntos intermedios
const interpolatePoints = (start, end, numPoints) => {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const ratio = i / numPoints;
    points.push({
      latitude: start.latitude + (end.latitude - start.latitude) * ratio,
      longitude: start.longitude + (end.longitude - start.longitude) * ratio,
      timestamp: Date.now() - (numPoints - i) * 5000,
    });
  }
  return points;
};

// Agregar variación GPS realista
const addVariation = (point, variation = 0.00015) => ({
  ...point,
  latitude: point.latitude + (Math.random() - 0.5) * variation,
  longitude: point.longitude + (Math.random() - 0.5) * variation,
});

/**
 * RUTA 1: Circuito Sur - El Poblado → Envigado → Sabaneta
 * Sigue: Av. El Poblado → Av. Las Vegas → Calle 10 Sur
 * Distancia: ~32 km | Duración: ~1h 30min
 */
const generateRuta1Coordinates = () => {
  const waypoints = [
    // INICIO: Parque Lleras (El Poblado)
    { latitude: 6.2085, longitude: -75.5693 },

    // Bajando por Av. El Poblado hacia el sur
    { latitude: 6.205, longitude: -75.5695 },
    { latitude: 6.201, longitude: -75.5698 },
    { latitude: 6.197, longitude: -75.5702 },
    { latitude: 6.193, longitude: -75.5705 },

    // Entrando a Envigado por Av. Las Vegas
    { latitude: 6.189, longitude: -75.571 },
    { latitude: 6.185, longitude: -75.5715 },
    { latitude: 6.181, longitude: -75.572 },

    // Centro de Envigado - Parque Principal
    { latitude: 6.175, longitude: -75.573 },
    { latitude: 6.172, longitude: -75.5735 },

    // Continuando hacia Sabaneta por la vía principal
    { latitude: 6.168, longitude: -75.5742 },
    { latitude: 6.164, longitude: -75.575 },
    { latitude: 6.16, longitude: -75.5758 },
    { latitude: 6.156, longitude: -75.5765 },

    // Sabaneta - Parque Principal
    { latitude: 6.1515, longitude: -75.6165 },

    // RETORNO: Por Transversal Intermedia
    { latitude: 6.156, longitude: -75.61 },
    { latitude: 6.161, longitude: -75.604 },
    { latitude: 6.166, longitude: -75.598 },

    // Subiendo de regreso por Envigado
    { latitude: 6.172, longitude: -75.592 },
    { latitude: 6.178, longitude: -75.586 },
    { latitude: 6.184, longitude: -75.581 },

    // Vuelta a El Poblado por Calle 10 Sur
    { latitude: 6.19, longitude: -75.577 },
    { latitude: 6.196, longitude: -75.573 },
    { latitude: 6.202, longitude: -75.57 },

    // FIN: Parque Lleras
    { latitude: 6.2085, longitude: -75.5693 },
  ];

  let fullRoute = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const segment = interpolatePoints(waypoints[i], waypoints[i + 1], 20);
    fullRoute = fullRoute.concat(segment.map(addVariation));
  }

  return fullRoute;
};

/**
 * RUTA 2: Circuito Norte - Estadio → 70 → Laureles → Universidad
 * Sigue: Carrera 70 → Av. 33 → Universidad Nacional → Estadio
 * Distancia: ~30 km | Duración: ~1h 20min
 */
const generateRuta2Coordinates = () => {
  const waypoints = [
    // INICIO: Unidad Deportiva Atanasio Girardot
    // Coordenadas verificadas: 6.2568°N, 75.5902°W
    { latitude: 6.2568, longitude: -75.5902 },

    // Saliendo por Carrera 70 hacia el norte
    { latitude: 6.26, longitude: -75.591 },
    { latitude: 6.264, longitude: -75.592 },
    { latitude: 6.268, longitude: -75.5928 },
    { latitude: 6.272, longitude: -75.5935 },

    // Zona Universidad Pontificia Bolivariana (UPB)
    { latitude: 6.245, longitude: -75.589 },

    // Por la 70 hacia Laureles
    { latitude: 6.248, longitude: -75.5895 },
    { latitude: 6.251, longitude: -75.59 },

    // Laureles - Primer Parque
    { latitude: 6.2445, longitude: -75.589 },

    // Por Avenida 33 hacia el norte
    { latitude: 6.248, longitude: -75.587 },
    { latitude: 6.252, longitude: -75.585 },
    { latitude: 6.256, longitude: -75.583 },

    // Zona Universidad Nacional
    { latitude: 6.262, longitude: -75.577 },
    { latitude: 6.267, longitude: -75.572 },

    // Subiendo hacia Robledo
    { latitude: 6.273, longitude: -75.578 },
    { latitude: 6.279, longitude: -75.585 },

    // Por la Calle 80 hacia el oeste
    { latitude: 6.276, longitude: -75.595 },
    { latitude: 6.27, longitude: -75.602 },

    // Bajando por la zona de Belén
    { latitude: 6.264, longitude: -75.608 },
    { latitude: 6.258, longitude: -75.605 },
    { latitude: 6.252, longitude: -75.6 },

    // Por Av. 80 de regreso hacia el centro
    { latitude: 6.248, longitude: -75.596 },
    { latitude: 6.244, longitude: -75.592 },

    // Volviendo hacia el Estadio
    { latitude: 6.25, longitude: -75.5905 },
    { latitude: 6.254, longitude: -75.59 },

    // FIN: Unidad Deportiva Atanasio Girardot
    { latitude: 6.2568, longitude: -75.5902 },
  ];

  let fullRoute = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const segment = interpolatePoints(waypoints[i], waypoints[i + 1], 18);
    fullRoute = fullRoute.concat(segment.map(addVariation));
  }

  return fullRoute;
};

/**
 * RUTA 3: Circuito Ciudad del Río - Poblado → Centro → Parques del Río
 * Nueva ruta popular de patinaje
 * Distancia: ~28 km | Duración: ~1h 15min
 */
const generateRuta3Coordinates = () => {
  const waypoints = [
    // INICIO: Parque El Poblado
    { latitude: 6.21, longitude: -75.569 },

    // Por Av. El Poblado hacia el norte
    { latitude: 6.215, longitude: -75.568 },
    { latitude: 6.22, longitude: -75.567 },

    // Ciudad del Río
    { latitude: 6.225, longitude: -75.566 },
    { latitude: 6.23, longitude: -75.565 },

    // Cruzando hacia Parques del Río
    { latitude: 6.238, longitude: -75.564 },

    // Parques del Río (junto al edificio EPM)
    { latitude: 6.245, longitude: -75.568 },

    // Por la Av. Oriental hacia el norte
    { latitude: 6.25, longitude: -75.566 },
    { latitude: 6.255, longitude: -75.564 },

    // Zona Estadio
    { latitude: 6.2568, longitude: -75.5902 },

    // Carrera 70 hacia el sur
    { latitude: 6.252, longitude: -75.592 },
    { latitude: 6.247, longitude: -75.593 },
    { latitude: 6.242, longitude: -75.588 },

    // De regreso a El Poblado por Transversal Inferior
    { latitude: 6.236, longitude: -75.582 },
    { latitude: 6.23, longitude: -75.576 },
    { latitude: 6.224, longitude: -75.571 },
    { latitude: 6.218, longitude: -75.5695 },

    // FIN: Parque El Poblado
    { latitude: 6.21, longitude: -75.569 },
  ];

  let fullRoute = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const segment = interpolatePoints(waypoints[i], waypoints[i + 1], 22);
    fullRoute = fullRoute.concat(segment.map(addVariation));
  }

  return fullRoute;
};

// Rutas mock exportables
export const MOCK_ROUTES = [
  {
    id: "mock-route-1",
    userId: "mock-user",
    coordinates: generateRuta1Coordinates(),
    distance: 32100, // 32.1 km
    duration: 5400, // 1h 30min
    avgSpeed: 21.4,
    maxSpeed: 39.8,
    calories: 820,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    startPoint: { latitude: 6.2085, longitude: -75.5693 },
    endPoint: { latitude: 6.2085, longitude: -75.5693 },
    name: "🛹 Circuito Sur - El Poblado → Envigado → Sabaneta",
  },
  {
    id: "mock-route-2",
    userId: "mock-user",
    coordinates: generateRuta2Coordinates(),
    distance: 30200, // 30.2 km
    duration: 4800, // 1h 20min
    avgSpeed: 22.7,
    maxSpeed: 41.2,
    calories: 745,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    startPoint: { latitude: 6.2568, longitude: -75.5902 },
    endPoint: { latitude: 6.2568, longitude: -75.5902 },
    name: "🛹 Circuito Norte - Estadio → 70 → Laureles → UN",
  },
  {
    id: "mock-route-3",
    userId: "mock-user",
    coordinates: generateRuta3Coordinates(),
    distance: 28400, // 28.4 km
    duration: 4500, // 1h 15min
    avgSpeed: 22.7,
    maxSpeed: 40.5,
    calories: 698,
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    startPoint: { latitude: 6.21, longitude: -75.569 },
    endPoint: { latitude: 6.21, longitude: -75.569 },
    name: "🛹 Ciudad del Río - Poblado → Centro → Parques",
  },
];

/**
 * Inyectar rutas mock en AsyncStorage
 */
export const injectMockRoutes = async (AsyncStorage) => {
  try {
    const STORAGE_KEY = "@rollemos_routes";
    const existingRoutes = await AsyncStorage.getItem(STORAGE_KEY);
    const routes = existingRoutes ? JSON.parse(existingRoutes) : [];

    const hasMockRoutes = routes.some((r) => r.id.startsWith("mock-route"));

    if (!hasMockRoutes) {
      const newRoutes = [...MOCK_ROUTES, ...routes];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newRoutes));
      console.log("✅ Rutas mock de Medellín inyectadas correctamente");
      return true;
    }

    console.log("ℹ️ Rutas mock ya existen en el storage");
    return false;
  } catch (error) {
    console.error("❌ Error inyectando rutas mock:", error);
    return false;
  }
};

/**
 * Eliminar rutas mock del storage
 */
export const removeMockRoutes = async (AsyncStorage) => {
  try {
    const STORAGE_KEY = "@rollemos_routes";
    const existingRoutes = await AsyncStorage.getItem(STORAGE_KEY);
    const routes = existingRoutes ? JSON.parse(existingRoutes) : [];

    const filteredRoutes = routes.filter((r) => !r.id.startsWith("mock-route"));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRoutes));
    console.log("✅ Rutas mock eliminadas del storage");
    return true;
  } catch (error) {
    console.error("❌ Error eliminando rutas mock:", error);
    return false;
  }
};
