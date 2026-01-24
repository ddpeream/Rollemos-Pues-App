import React, { useRef, memo, useCallback } from 'react';
import { View, Text, Platform } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { styles, darkMapStyle } from '../../screens/tracking/tracking.style';

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
}) {
  const lastRodadaTapRef = useRef({ id: null, at: 0 });

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
      {routeCoordinates.length > 1 && (
        <Polyline
          coordinates={routeCoordinates}
          strokeColor={theme.colors.primary}
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
        />
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
        <Marker
          coordinate={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={Platform.OS === 'ios'}
          zIndex={100}
        >
          <View
            style={[
              styles.currentPositionMarker,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <MaterialCommunityIcons
              name="roller-skate"
              size={18}
              color="#FFFFFF"
            />
          </View>
        </Marker>
      )}

      {visibleLiveSkaters.map((skater) => (
        <Marker
          key={skater.userId}
          coordinate={{
            latitude: skater.lat,
            longitude: skater.lng,
          }}
          rotation={skater.heading || 0}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={Platform.OS === 'ios'}
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
        </Marker>
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
