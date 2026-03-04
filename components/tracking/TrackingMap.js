import React, { useRef, useState, useEffect, memo, useCallback, useMemo } from 'react';
import { View, Text, Platform, Animated } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { styles, darkMapStyle } from '../../screens/tracking/tracking.style';

const toRadians = (value) => (value * Math.PI) / 180;

// Algoritmo Douglas-Peucker para reducción de puntos en polyline
const simplifyPolyline = (points, tolerance = 0.0001) => {
  if (!points || points.length <= 2) return points;
  
  const simplified = [points[0]];
  let prevPoint = points[0];
  
  for (let i = 1; i < points.length; i++) {
    const currentPoint = points[i];
    const distance = Math.sqrt(
      Math.pow(currentPoint.latitude - prevPoint.latitude, 2) +
      Math.pow(currentPoint.longitude - prevPoint.longitude, 2)
    );
    
    if (distance >= tolerance) {
      simplified.push(currentPoint);
      prevPoint = currentPoint;
    }
  }
  
  // Siempre incluir el último punto
  const lastPoint = points[points.length - 1];
  if (simplified[simplified.length - 1] !== lastPoint) {
    simplified.push(lastPoint);
  }
  
  return simplified;
};

const calculateBearing = (from, to) => {
  if (!from || !to) return null;
  const lat1 = toRadians(from.latitude);
  const lon1 = toRadians(from.longitude);
  const lat2 = toRadians(to.latitude);
  const lon2 = toRadians(to.longitude);
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const heading = (Math.atan2(y, x) * 180) / Math.PI;
  return ((heading % 360) + 360) % 360;
};

// Marker que arranca con tracksViewChanges=true para que Android renderice el bitmap,
// luego lo apaga para no gastar CPU cada frame.
const AndroidSafeMarker = memo(({ children, ...markerProps }) => {
  const [trackChanges, setTrackChanges] = useState(Platform.OS === 'android');

  useEffect(() => {
    if (Platform.OS === 'android') {
      const timer = setTimeout(() => setTrackChanges(false), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <Marker {...markerProps} tracksViewChanges={trackChanges}>
      {children}
    </Marker>
  );
});

// Marker de bandera de salida
const StartFlagMarker = memo(({ coordinate }) => {
  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={95}
    >
      <View style={styles.rodadaMarkerContainer}>
        <View
          style={[
            styles.rodadaCallout,
            { backgroundColor: '#4CAF50' },
          ]}
        >
          <Text
            style={[styles.rodadaCalloutText, { color: '#000' }]}
            numberOfLines={1}
          >
            🚩 Salida
          </Text>
          <View
            style={[
              styles.rodadaCalloutArrow,
              { borderTopColor: '#4CAF50' },
            ]}
          />
        </View>
        <View
          style={[
            styles.rodadaMarker,
            { backgroundColor: '#4CAF50' },
          ]}
        >
          <Ionicons name="flag-outline" size={18} color="#000" />
        </View>
      </View>
    </Marker>
  );
});
const AnimatedSkateMarker = memo(({ coordinate, theme, heading = 0 }) => {
  const animatedValue = useRef(new Animated.ValueXY()).current;
  const lastCoordinate = useRef(null);

  useEffect(() => {
    if (!coordinate || !lastCoordinate.current) {
      lastCoordinate.current = coordinate;
      if (coordinate) {
        animatedValue.setValue({
          x: coordinate.longitude,
          y: coordinate.latitude,
        });
      }
      return;
    }

    const { latitude: lastLat, longitude: lastLng } = lastCoordinate.current;
    const { latitude, longitude } = coordinate;

    // Solo animar si hay cambio significativo
    if (Math.abs(latitude - lastLat) > 0.00001 || Math.abs(longitude - lastLng) > 0.00001) {
      Animated.spring(animatedValue, {
        toValue: { x: longitude, y: latitude },
        useNativeDriver: false,
        tension: 20,
        friction: 8,
        duration: 600, // Animación de 600ms
      }).start();
      lastCoordinate.current = coordinate;
    }
  }, [coordinate, animatedValue]);

  const animatedCoordinate = useMemo(() => {
    const { x, y } = animatedValue;
    return {
      latitude: y,
      longitude: x,
    };
  }, [animatedValue]);

  return (
    <Marker
      coordinate={animatedCoordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={Platform.OS === 'android'}
      zIndex={100}
      rotation={heading}
      flat={Platform.OS === 'android'}
    >
      <View
        style={[
          styles.currentPositionMarker,
          { backgroundColor: theme.colors.primary },
        ]}
      >
        <MaterialCommunityIcons name="roller-skate" size={18} color="#FFFFFF" />
      </View>
    </Marker>
  );
});

function TrackingMap({
  mapRef,
  mapType,
  onMapPan,
  initialRegion,
  routeCoordinates,
  theme,
  isDark,
  livePaths,
  currentLocation,
  visibleLiveSkaters,
  getSkaterColor,
  showRodadasOnMap,
  filteredRodadas,
  getRodadaVisuals,
  onSelectRodada,
  onDoublePressRodada,
  onSelectSkater,
  spots,
  showSpotsOnMap,
  startFlag,
}) {
  const lastRodadaTapRef = useRef({ id: null, at: 0 });

  // Optimizar polyline para mejor performance
  const optimizedRouteCoordinates = useMemo(() => {
    return simplifyPolyline(routeCoordinates, 0.0001);
  }, [routeCoordinates]);

  const handleRodadaPress = useCallback((rodada) => {
    const now = Date.now();
    const last = lastRodadaTapRef.current;
    const isDoubleTap = last.id === rodada.id && now - last.at < 300;
    lastRodadaTapRef.current = { id: rodada.id, at: now };

    if (isDoubleTap && onDoublePressRodada) {
      onDoublePressRodada(rodada);
      return;
    }

    onSelectRodada(rodada);
  }, [onSelectRodada, onDoublePressRodada]);

  const userHeading = useMemo(() => {
    const directHeading = Number.isFinite(currentLocation?.heading)
      ? ((currentLocation.heading % 360) + 360) % 360
      : null;
    if (directHeading != null) return directHeading;

    if (routeCoordinates.length >= 2) {
      const prev = routeCoordinates[routeCoordinates.length - 2];
      const last = routeCoordinates[routeCoordinates.length - 1];
      const fallbackHeading = calculateBearing(prev, last);
      if (fallbackHeading != null) return fallbackHeading;
    }

    return 0;
  }, [currentLocation?.heading, routeCoordinates]);

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      initialRegion={initialRegion}
      mapType={mapType}
      onPanDrag={onMapPan}
      moveOnMarkerPress={false}
      customMapStyle={isDark && mapType === "standard" ? darkMapStyle : undefined}
    >
      {optimizedRouteCoordinates.length > 1 && (
        <Polyline
          coordinates={optimizedRouteCoordinates}
          strokeColor={theme.colors.primary}
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
        />
      )}

      {startFlag && (
        <StartFlagMarker coordinate={startFlag} />
      )}

      {Object.keys(livePaths).map((userId) => {
        const pathData = livePaths[userId];
        if (!pathData?.points || pathData.points.length < 2) return null;

        return (
          <Polyline
            key={`path-${userId}`}
            coordinates={pathData.points}
            strokeColor="#19C37D"
            strokeWidth={3}
            lineCap="round"
            lineJoin="round"
          />
        );
      })}

      {currentLocation && (
        <AnimatedSkateMarker
          coordinate={currentLocation}
          theme={theme}
          heading={userHeading}
        />
      )}

      {visibleLiveSkaters.map((skater) => (
        <AndroidSafeMarker
          key={skater.userId}
          coordinate={{
            latitude: skater.lat,
            longitude: skater.lng,
          }}
          rotation={skater.heading || 0}
          anchor={{ x: 0.5, y: 0.5 }}
          zIndex={90}
          onPress={() => onSelectSkater?.(skater)}
        >
          <View
            style={[
              styles.currentPositionMarker,
              { backgroundColor: getSkaterColor(skater) },
            ]}
          >
            <MaterialCommunityIcons
              name="roller-skate"
              size={18}
              color="#FFFFFF"
            />
          </View>
        </AndroidSafeMarker>
      ))}

      {showRodadasOnMap &&
        filteredRodadas.map((rodada) => {
          const visuals = getRodadaVisuals(rodada);
          const markerColor = visuals.markerColor;
          const calloutColor = visuals.calloutColor;

          return (
            <React.Fragment key={rodada.id}>
              <Marker
                coordinate={{
                  latitude: parseFloat(rodada.punto_salida_lat),
                  longitude: parseFloat(rodada.punto_salida_lng),
                }}
                onPress={() => handleRodadaPress(rodada)}
                zIndex={80}
              >
                <View style={styles.rodadaMarkerContainer}>
                  <View
                    style={[
                      styles.rodadaCallout,
                      { backgroundColor: calloutColor },
                    ]}
                  >
                    <Text style={styles.rodadaCalloutText} numberOfLines={1}>
                      {rodada.nombre?.substring(0, 20)}
                      {rodada.nombre?.length > 20 ? "..." : ""}
                    </Text>
                    <View
                      style={[
                        styles.rodadaCalloutArrow,
                        { borderTopColor: calloutColor },
                      ]}
                    />
                  </View>
                  <View
                    style={[
                      styles.rodadaMarker,
                      { backgroundColor: markerColor },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={visuals.icon}
                      size={18}
                      color="#FFFFFF"
                    />
                  </View>
                </View>
              </Marker>

              {rodada.punto_llegada_lat && rodada.punto_llegada_lng && (
                <Marker
                  coordinate={{
                    latitude: parseFloat(rodada.punto_llegada_lat),
                    longitude: parseFloat(rodada.punto_llegada_lng),
                  }}
                  onPress={() => handleRodadaPress(rodada)}
                  zIndex={80}
                >
                  <View style={styles.rodadaMarkerContainer}>
                    <View
                      style={[
                        styles.rodadaCallout,
                        { backgroundColor: "#FFD700" },
                      ]}
                    >
                      <Text
                        style={[styles.rodadaCalloutText, { color: "#000" }]}
                        numberOfLines={1}
                      >
                        🏁 Llegada
                      </Text>
                      <View
                        style={[
                          styles.rodadaCalloutArrow,
                          { borderTopColor: "#FFD700" },
                        ]}
                      />
                    </View>
                    <View
                      style={[
                        styles.rodadaMarker,
                        { backgroundColor: "#FFD700" },
                      ]}
                    >
                      <Ionicons name="flag-outline" size={18} color="#000" />
                    </View>
                  </View>
                </Marker>
              )}
            </React.Fragment>
          );
        })}

      {showSpotsOnMap &&
        spots.map((spot) => (
          <Marker
            key={`spot-${spot.id}`}
            coordinate={{
              latitude: parseFloat(spot.latitud),
              longitude: parseFloat(spot.longitud),
            }}
            title={spot.nombre}
            description={spot.ciudad || "Spot"}
            zIndex={70}
          >
            <View
              style={[
                styles.spotMarker,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <MaterialCommunityIcons
                name="skateboard-mountain"
                size={16}
                color="#FFFFFF"
              />
            </View>
          </Marker>
        ))}
    </MapView>
  );
}

// Memorizar componente para evitar re-renders innecesarios
export default memo(TrackingMap);
