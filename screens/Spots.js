import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import useAppStore from '../store/useAppStore';
import { useSpots } from '../hooks/useSpots';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { theme as staticTheme } from '../theme';
import { fetchTrackingLive, subscribeTrackingLive, unsubscribeTrackingLive } from '../services/tracking';

const { width, height } = Dimensions.get('window');

export default function Spots() {
  const { t } = useTranslation();
  const { theme, user } = useAppStore();
  
  const {
    spots,
    loading,
    refreshing,
    loadSpots,
    refreshSpots,
  } = useSpots();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Todos');
  const [selectedType, setSelectedType] = useState('Todos');
  const [activeFilter, setActiveFilter] = useState(null);
  const [liveSkaters, setLiveSkaters] = useState([]);
  const [livePaths, setLivePaths] = useState({});

  const translateOption = (option) => {
    if (option === 'Todos') return t('filters.all');
    return option;
  };
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [selectedSpot, setSelectedSpot] = useState(null);
  const mapRef = useRef(null);

  // Pedir permisos de ubicación al montar la pantalla
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        console.log('🔐 Solicitando permisos en Spots...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('⚠️ Permiso de ubicación denegado en Spots');
        } else {
          console.log('✅ Permisos concedidos en Spots');
        }
      } catch (error) {
        console.error('❌ Error solicitando permisos en Spots:', error);
      }
    };
    requestPermissions();
  }, []);

  // Cargar spots al entrar a la pantalla
  useFocusEffect(
    React.useCallback(() => {
      loadSpots();
    }, [loadSpots])
  );

  // 📡 Suscribirse a cambios en tiempo real de spots (callback estable)
  const handleSpotsChange = React.useCallback(() => {
    console.log('📍 Recargando spots por cambio en realtime');
    loadSpots();
  }, [loadSpots]);

  useRealtimeSubscription('spots', handleSpotsChange);

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

  const getSkaterColor = (skater) => {
    return getSkaterGender(skater) === 'female' ? '#FF4FA3' : '#19C37D';
  };

  const appendLivePath = (userId, lat, lng) => {
    setLivePaths((prev) => {
      const current = prev[userId];
      const nextPoint = { latitude: lat, longitude: lng };

      if (!current) {
        return {
          ...prev,
          [userId]: {
            start: nextPoint,
            points: [nextPoint],
          },
        };
      }

      const last = current.points[current.points.length - 1];
      const moved =
        Math.abs(last.latitude - lat) > 0.00001 ||
        Math.abs(last.longitude - lng) > 0.00001;

      if (!moved) {
        return prev;
      }

      return {
        ...prev,
        [userId]: {
          ...current,
          points: [...current.points, nextPoint],
        },
      };
    });
  };

  useEffect(() => {
    let isMounted = true;

    const loadLiveSkaters = async () => {
      console.log('🔍 Cargando skaters en vivo...');
      const { data, error, ok } = await fetchTrackingLive();
      console.log('📍 fetchTrackingLive result:', { ok, error, count: data?.length, data });
      if (!isMounted) return;
      const normalized = (data || []).map(normalizeLiveRecord).filter(Boolean);
      console.log('📍 Skaters normalizados:', normalized);
      setLiveSkaters(normalized);
      normalized.forEach((item) => {
        if (item.isActive && Number.isFinite(item.lat) && Number.isFinite(item.lng)) {
          appendLivePath(item.userId, item.lat, item.lng);
        }
      });
    };

    loadLiveSkaters();

    const channel = subscribeTrackingLive((payload) => {
      if (!isMounted) return;
      const record = payload.new || payload.old;
      const normalized = normalizeLiveRecord(record);
      if (!normalized) return;

      if (payload.eventType === 'DELETE' || normalized.isActive === false) {
        setLiveSkaters((prev) => prev.filter((item) => item.userId !== normalized.userId));
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
  }, []);

  // Extract unique values for filters
  const cities = useMemo(() => {
    const uniqueCities = [...new Set(spots.map(s => s.ciudad).filter(Boolean))];
    return ['Todos', ...uniqueCities];
  }, [spots]);

  const types = useMemo(() => {
    const uniqueTypes = [...new Set(spots.map(s => s.tipo).filter(Boolean))];
    
    // Si no hay tipos de los datos, usar los predeterminados
    const defaultTypes = ['Skatepark', 'Street', 'Plaza', 'DIY', 'Bowl', 'Rampa'];
    const finalTypes = uniqueTypes.length > 0 ? uniqueTypes : defaultTypes;
    
    return ['Todos', ...finalTypes];
  }, [spots]);

  // Filter spots
  const filteredSpots = useMemo(() => {
    return spots.filter(spot => {
      const matchesSearch = spot.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           spot.direccion?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = selectedCity === 'Todos' || spot.ciudad === selectedCity;
      const matchesType = selectedType === 'Todos' || spot.tipo === selectedType;
      
      return matchesSearch && matchesCity && matchesType;
    });
  }, [spots, searchQuery, selectedCity, selectedType]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCity('Todos');
    setSelectedType('Todos');
  };

  const FilterButton = ({ id, label, value, options, onSelect, icon }) => {
    const isActive = activeFilter === id;
    const hasSelection = value !== 'Todos';
    
    // Mostrar el nombre del filtro cuando no hay selección
    const displayText = hasSelection ? translateOption(value) : label;

    return (
      <View style={styles.filterButtonContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { 
              backgroundColor: hasSelection ? theme.colors.primary : theme.colors.glass.background,
              borderColor: hasSelection ? theme.colors.primary : theme.colors.glass.border,
            }
          ]}
          onPress={() => setActiveFilter(isActive ? null : id)}
        >
          <Ionicons 
            name={icon} 
            size={16} 
            color={hasSelection ? theme.colors.onPrimary : theme.colors.text.primary} 
          />
          <Text style={[
            styles.filterButtonText,
            { color: hasSelection ? theme.colors.onPrimary : theme.colors.text.primary }
          ]}>
            {displayText}
          </Text>
          <Ionicons 
            name={isActive ? "chevron-up" : "chevron-down"} 
            size={16} 
            color={hasSelection ? theme.colors.onPrimary : theme.colors.text.secondary} 
          />
        </TouchableOpacity>

        {isActive && (
          <View style={[
            styles.filterDropdown,
            { 
              backgroundColor: theme.colors.background.surface,
              borderColor: theme.colors.glass.border,
            }
          ]}>
            <ScrollView style={styles.filterDropdownScroll} nestedScrollEnabled>
              {options.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.filterOption,
                    { borderBottomColor: theme.colors.glass.border }
                  ]}
                  onPress={() => {
                    onSelect(option);
                    setActiveFilter(null);
                  }}
                >
                  <Text style={[
                    styles.filterOptionText,
                    { color: option === value ? theme.colors.primary : theme.colors.text.primary }
                  ]}>
                    {translateOption(option)}
                  </Text>
                  {option === value && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const hasActiveFilters = searchQuery || selectedCity !== 'Todos' || selectedType !== 'Todos';

  // Get initial map region based on filtered spots
  const mapRegion = useMemo(() => {
    const spotsWithCoords = filteredSpots.filter(s => s.latitud && s.longitud);
    
    if (spotsWithCoords.length === 0) {
      // Default to Colombia center
      return {
        latitude: 4.5709,
        longitude: -74.2973,
        latitudeDelta: 10,
        longitudeDelta: 10,
      };
    }

    const latitudes = spotsWithCoords.map(s => parseFloat(s.latitud));
    const longitudes = spotsWithCoords.map(s => parseFloat(s.longitud));
    
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const deltaLat = (maxLat - minLat) * 1.5 || 0.1;
    const deltaLng = (maxLng - minLng) * 1.5 || 0.1;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(deltaLat, 0.1),
      longitudeDelta: Math.max(deltaLng, 0.1),
    };
  }, [filteredSpots]);

  const visibleLiveSkaters = useMemo(() => {
    const visible = liveSkaters.filter((skater) => {
      if (!skater.isActive) return false;
      if (!Number.isFinite(skater.lat) || !Number.isFinite(skater.lng)) return false;
      if (user?.id && skater.userId === user.id) return false;
      return true;
    });
    console.log('👀 visibleLiveSkaters:', JSON.stringify({ total: liveSkaters.length, visible: visible.length, userId: user?.id, visible }, null, 2));
    return visible;
  }, [liveSkaters, user]);

  // Focus on specific spot in map
  const focusSpotOnMap = (spot) => {
    if (spot.latitud && spot.longitud && mapRef.current) {
      setSelectedSpot(spot);
      setViewMode('map');
      
      setTimeout(() => {
        mapRef.current.animateToRegion({
          latitude: parseFloat(spot.latitud),
          longitude: parseFloat(spot.longitud),
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);
      }, 100);
    }
  };

  // Get spot type icon
  const getTypeIcon = (tipo) => {
    const icons = {
      'Skatepark': 'business',
      'Street': 'map',
      'Plaza': 'trail-sign',
      'DIY': 'hammer',
      'Bowl': 'disc',
      'Rampa': 'triangle',
    };
    return icons[tipo] || 'location';
  };

  // Get difficulty color
  const getDifficultyStyle = (dificultad, theme) => {
    const colors = {
      'fácil': { backgroundColor: theme.colors.success + '20', color: theme.colors.success },
      'media': { backgroundColor: '#FFA500' + '20', color: '#FFA500' },
      'difícil': { backgroundColor: theme.colors.error + '20', color: theme.colors.error },
    };
    return colors[dificultad?.toLowerCase()] || { backgroundColor: theme.colors.alpha.primary15, color: theme.colors.primary };
  };

  // Render spot card
  const renderSpotCard = ({ item }) => {
    const difficultyStyle = getDifficultyStyle(item.dificultad, theme);

    return (
      <TouchableOpacity 
        style={[styles.spotCard, { 
          backgroundColor: theme.colors.glass.background,
          borderColor: theme.colors.border 
        }]}
        activeOpacity={0.7}
      >
        {/* Image */}
        <Image 
          source={{ uri: item.foto || item.imagen || 'https://via.placeholder.com/400x300' }} 
          style={styles.spotImage} 
        />
        
        {/* Type Badge */}
        <View style={[styles.typeBadge, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name={getTypeIcon(item.tipo)} size={14} color={theme.colors.onPrimary} />
          <Text style={[styles.typeText, { color: theme.colors.onPrimary }]}>{item.tipo}</Text>
        </View>
        
        {/* Content */}
        <View style={styles.spotContent}>
          {/* Header */}
          <View style={styles.spotHeader}>
            <Text style={[styles.spotNombre, { color: theme.colors.text.primary }]}>
              {item.nombre}
            </Text>
            {item.verificado && (
              <View style={[styles.verifiedBadge, { backgroundColor: theme.colors.alpha.primary15 }]}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              </View>
            )}
          </View>

          {/* Location */}
          {(item.ciudad || item.direccion) && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={16} color={theme.colors.text.secondary} />
              <Text style={[styles.locationText, { color: theme.colors.text.secondary }]} numberOfLines={1}>
                {item.ciudad && item.direccion 
                  ? `${item.ciudad} - ${item.direccion}`
                  : item.ciudad || item.direccion
                }
              </Text>
            </View>
          )}

          {/* Description */}
          {item.descripcion && (
            <Text style={[styles.descriptionText, { color: theme.colors.text.secondary }]} numberOfLines={2}>
              {item.descripcion}
            </Text>
          )}

          {/* Features */}
          <View style={styles.featuresContainer}>
            {/* Difficulty */}
            {item.dificultad && (
              <View style={[styles.featureBadge, { backgroundColor: difficultyStyle.backgroundColor }]}>
                <Ionicons name="stats-chart" size={12} color={difficultyStyle.color} />
                <Text style={[styles.featureText, { color: difficultyStyle.color }]}>
                  {item.dificultad}
                </Text>
              </View>
            )}

            {/* Rating */}
            {item.rating && (
              <View style={[styles.featureBadge, { backgroundColor: theme.colors.alpha.primary15 }]}>
                <Ionicons name="star" size={12} color={theme.colors.primary} />
                <Text style={[styles.featureText, { color: theme.colors.primary }]}>
                  {item.rating}/5
                </Text>
              </View>
            )}

            {/* Open 24/7 */}
            {item.horario_24h && (
              <View style={[styles.featureBadge, { backgroundColor: theme.colors.success + '20' }]}>
                <Ionicons name="time-outline" size={12} color={theme.colors.success} />
                <Text style={[styles.featureText, { color: theme.colors.success }]}>
                  24/7
                </Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <TouchableOpacity 
              style={[styles.mapButton, { borderColor: theme.colors.border }]}
              onPress={() => focusSpotOnMap(item)}
            >
              <Ionicons name="map-outline" size={18} color={theme.colors.primary} />
              <Text style={[styles.mapButtonText, { color: theme.colors.primary }]}>
                {t('screens.spots.map')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.viewButton, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.viewButtonText, { color: theme.colors.onPrimary }]}>{t('screens.spots.view')}</Text>
              <Ionicons name="arrow-forward" size={16} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {t('nav.spots')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            {t('screens.spots.count', { count: filteredSpots.length })}
          </Text>
        </View>
        
        {/* View Mode Toggle */}
        <View style={[styles.viewToggle, { backgroundColor: theme.colors.glass.background, borderColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'list' && { backgroundColor: theme.colors.primary }
            ]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons 
              name="list" 
              size={20} 
              color={viewMode === 'list' ? theme.colors.onPrimary : theme.colors.text.secondary} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'map' && { backgroundColor: theme.colors.primary }
            ]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons 
              name="map" 
              size={20} 
              color={viewMode === 'map' ? theme.colors.onPrimary : theme.colors.text.secondary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { 
          backgroundColor: theme.colors.glass.background,
          borderColor: theme.colors.border 
        }]}>
          <Ionicons name="search" size={20} color={theme.colors.text.secondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text.primary }]}
            placeholder={t('screens.spots.searchPlaceholder')}
            placeholderTextColor={theme.colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <View style={styles.filterRow}>
          <FilterButton
            id="city"
            label={t('filters.city')}
            value={selectedCity}
            options={cities}
            onSelect={setSelectedCity}
            icon="location-outline"
          />
          <FilterButton
            id="type"
            label={t('filters.type')}
            value={selectedType}
            options={types}
            onSelect={setSelectedType}
            icon="business-outline"
          />
        </View>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <TouchableOpacity
            style={[styles.clearFiltersButton, { backgroundColor: theme.colors.error + '20' }]}
            onPress={clearFilters}
          >
            <Ionicons name="close-circle" size={16} color={theme.colors.error} />
            <Text style={[styles.clearFiltersText, { color: theme.colors.error }]}>
              {t('filters.clear')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content - List or Map */}
      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            mapType='satellite'
            initialRegion={mapRegion}
            customMapStyle={theme.colors.background.primary === '#0B0F14' ? darkMapStyle : []}
            showsUserLocation
            showsMyLocationButton
            showsCompass
            toolbarEnabled={false}
            onError={(err) => {
              console.error('❌ Error en MapView (Spots):', err);
              Alert.alert(t('screens.spots.mapErrorTitle'), t('screens.spots.mapErrorMessage'));
            }}
          >
            {filteredSpots
              .filter(spot => spot.latitud && spot.longitud)
              .map((spot) => (
                <Marker
                  key={spot.id}
                  coordinate={{
                    latitude: parseFloat(spot.latitud),
                    longitude: parseFloat(spot.longitud),
                  }}
                  title={spot.nombre}
                  description={spot.direccion}
                  onPress={() => setSelectedSpot(spot)}
                >
                  <View style={[
                    styles.customMarker,
                    { backgroundColor: selectedSpot?.id === spot.id ? theme.colors.primary : theme.colors.glass.background },
                    { borderColor: selectedSpot?.id === spot.id ? theme.colors.primary : theme.colors.border }
                  ]}>
                    <Ionicons 
                      name={getTypeIcon(spot.tipo)} 
                      size={20} 
                      color={selectedSpot?.id === spot.id ? theme.colors.onPrimary : theme.colors.primary} 
                    />
                  </View>
                </Marker>
              ))}
            {visibleLiveSkaters.map((skater) => {
              const path = livePaths[skater.userId];
              const skaterColor = getSkaterColor(skater);

              return (
                <React.Fragment key={`live-${skater.userId}`}>
                  {path?.points?.length > 1 && (
                    <Polyline
                      coordinates={path.points}
                      strokeColor={skaterColor}
                      strokeWidth={3}
                    />
                  )}
                  {path?.start && (
                    <Marker
                      key={`live-start-${skater.userId}`}
                      coordinate={path.start}
                      title="Inicio"
                    >
                      <View style={styles.startFlagMarker}>
                        <Ionicons name="flag" size={16} color="#FF3B30" />
                      </View>
                    </Marker>
                  )}
                  <Marker
                    coordinate={{
                      latitude: skater.lat,
                      longitude: skater.lng,
                    }}
                    title={skater.usuario?.nombre || 'Skater'}
                  >
                    <View style={[styles.liveMarker, { borderColor: skaterColor }]}>
                      <MaterialCommunityIcons name="roller-skate" size={18} color={skaterColor} />
                    </View>
                  </Marker>
                </React.Fragment>
              );
            })}
          </MapView>

          {/* Selected Spot Card Overlay */}
          {selectedSpot && (
            <View style={[styles.mapOverlayCard, { backgroundColor: theme.colors.background.primary }]}>
              <TouchableOpacity
                style={styles.closeOverlay}
                onPress={() => setSelectedSpot(null)}
              >
                <Ionicons name="close-circle" size={24} color={theme.colors.text.secondary} />
              </TouchableOpacity>

              <View style={styles.overlayContent}>
                <Image 
                  source={{ uri: selectedSpot.foto || selectedSpot.imagen || 'https://via.placeholder.com/400x300' }} 
                  style={styles.overlayImage}
                />
                
                <View style={styles.overlayInfo}>
                  <View style={[styles.overlayTypeBadge, { backgroundColor: theme.colors.primary }]}>
                    <Ionicons name={getTypeIcon(selectedSpot.tipo)} size={12} color={theme.colors.onPrimary} />
                    <Text style={[styles.overlayTypeText, { color: theme.colors.onPrimary }]}>{selectedSpot.tipo}</Text>
                  </View>
                  
                  <Text style={[styles.overlayTitle, { color: theme.colors.text.primary }]} numberOfLines={1}>
                    {selectedSpot.nombre}
                  </Text>
                  
                  {selectedSpot.ciudad && (
                    <View style={styles.overlayLocation}>
                      <Ionicons name="location-outline" size={14} color={theme.colors.text.secondary} />
                      <Text style={[styles.overlayLocationText, { color: theme.colors.text.secondary }]} numberOfLines={1}>
                        {selectedSpot.ciudad}
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity 
                    style={[styles.overlayButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => {
                      // Navigate to spot details
                      setViewMode('list');
                      setSelectedSpot(null);
                    }}
                  >
                    <Text style={[styles.overlayButtonText, { color: theme.colors.onPrimary }]}>{t('screens.spots.viewDetails')}</Text>
                    <Ionicons name="arrow-forward" size={16} color={theme.colors.onPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Map Controls */}
          <View style={styles.mapControls}>
            <TouchableOpacity
              style={[styles.mapControlButton, { backgroundColor: theme.colors.background.primary, borderColor: theme.colors.border }]}
              onPress={() => {
                if (mapRef.current) {
                  mapRef.current.animateToRegion(mapRegion, 500);
                }
              }}
            >
              <Ionicons name="contract-outline" size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
        data={filteredSpots}
        renderItem={renderSpotCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshSpots}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
                {t('screens.spots.loading')}
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="map-outline" size={64} color={theme.colors.text.secondary} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                {hasActiveFilters ? t('screens.spots.emptyFiltered') : t('screens.spots.empty')}
              </Text>
              <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                {hasActiveFilters 
                  ? t('screens.spots.emptyHintFiltered')
                  : t('screens.spots.emptyHint')
                }
              </Text>
            </View>
          )
        }
        />
      )}
    </View>
  );
}

// Dark mode map style
const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#1d2c4d" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#8ec3b9" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#1a3646" }]
  },
  {
    "featureType": "administrative.country",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#4b6878" }]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#64779e" }]
  },
  {
    "featureType": "administrative.province",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#4b6878" }]
  },
  {
    "featureType": "landscape.man_made",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#334e87" }]
  },
  {
    "featureType": "landscape.natural",
    "elementType": "geometry",
    "stylers": [{ "color": "#023e58" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#283d6a" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#6f9ba5" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#1d2c4d" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#023e58" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#3C7680" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#304a7d" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#98a5be" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#1d2c4d" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#2c6675" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#255763" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#b0d5ce" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#023e58" }]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#98a5be" }]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#1d2c4d" }]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#283d6a" }]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [{ "color": "#3a4762" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#0e1626" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#4e6d70" }]
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: staticTheme.spacing.lg,
    paddingTop: staticTheme.spacing.md,
    paddingBottom: staticTheme.spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: staticTheme.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
  },
  searchSection: {
    paddingHorizontal: staticTheme.spacing.lg,
    paddingVertical: staticTheme.spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: staticTheme.spacing.md,
    paddingVertical: staticTheme.spacing.sm,
    borderRadius: staticTheme.borderRadius.lg,
    borderWidth: 1,
    gap: staticTheme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: staticTheme.spacing.xs,
  },
  filtersSection: {
    paddingHorizontal: staticTheme.spacing.lg,
    paddingBottom: staticTheme.spacing.md,
    gap: staticTheme.spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: staticTheme.spacing.xs,
  },
  filterButtonContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: staticTheme.spacing.sm,
    paddingVertical: staticTheme.spacing.sm,
    borderRadius: staticTheme.borderRadius.md,
    borderWidth: 1,
    gap: staticTheme.spacing.xs,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  filterDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: staticTheme.spacing.xs,
    borderRadius: staticTheme.borderRadius.md,
    borderWidth: 1,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  filterDropdownScroll: {
    maxHeight: 200,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: staticTheme.spacing.md,
    paddingVertical: staticTheme.spacing.sm,
    borderBottomWidth: 1,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: staticTheme.spacing.md,
    paddingVertical: staticTheme.spacing.sm,
    borderRadius: staticTheme.borderRadius.md,
    gap: staticTheme.spacing.xs,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: staticTheme.spacing.lg,
  },
  spotCard: {
    borderRadius: staticTheme.borderRadius.lg,
    borderWidth: 1,
    marginBottom: staticTheme.spacing.lg,
    overflow: 'hidden',
  },
  spotImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  typeBadge: {
    position: 'absolute',
    top: staticTheme.spacing.md,
    right: staticTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: staticTheme.spacing.sm,
    paddingVertical: 6,
    borderRadius: staticTheme.borderRadius.md,
    gap: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  spotContent: {
    padding: staticTheme.spacing.md,
  },
  spotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: staticTheme.spacing.xs,
  },
  spotNombre: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  verifiedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: staticTheme.spacing.sm,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: staticTheme.spacing.sm,
  },
  locationText: {
    fontSize: 14,
    flex: 1,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: staticTheme.spacing.md,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: staticTheme.spacing.xs,
    marginBottom: staticTheme.spacing.md,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: staticTheme.spacing.sm,
    paddingVertical: 4,
    borderRadius: staticTheme.borderRadius.sm,
    gap: 4,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: staticTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: staticTheme.colors.alpha.white08,
    gap: staticTheme.spacing.sm,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: staticTheme.spacing.md,
    paddingVertical: staticTheme.spacing.sm,
    borderRadius: staticTheme.borderRadius.md,
    borderWidth: 1,
    gap: staticTheme.spacing.xs,
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: staticTheme.spacing.md,
    paddingVertical: staticTheme.spacing.sm,
    borderRadius: staticTheme.borderRadius.md,
    gap: staticTheme.spacing.xs,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: staticTheme.spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: staticTheme.spacing.md,
    marginBottom: staticTheme.spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: staticTheme.spacing.xxl * 2,
  },
  loadingText: {
    fontSize: 14,
    marginTop: staticTheme.spacing.md,
  },
  // Map styles
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  liveMarker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  startFlagMarker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  mapOverlayCard: {
    position: 'absolute',
    bottom: staticTheme.spacing.lg,
    left: staticTheme.spacing.lg,
    right: staticTheme.spacing.lg,
    borderRadius: staticTheme.borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  closeOverlay: {
    position: 'absolute',
    top: staticTheme.spacing.sm,
    right: staticTheme.spacing.sm,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    flexDirection: 'row',
    padding: staticTheme.spacing.md,
    gap: staticTheme.spacing.md,
  },
  overlayImage: {
    width: 100,
    height: 100,
    borderRadius: staticTheme.borderRadius.md,
  },
  overlayInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  overlayTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: staticTheme.spacing.xs,
    paddingVertical: 4,
    borderRadius: staticTheme.borderRadius.sm,
    gap: 4,
  },
  overlayTypeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  overlayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  overlayLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overlayLocationText: {
    fontSize: 12,
    flex: 1,
  },
  overlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: staticTheme.spacing.md,
    paddingVertical: staticTheme.spacing.xs,
    borderRadius: staticTheme.borderRadius.md,
    gap: staticTheme.spacing.xs,
  },
  overlayButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mapControls: {
    position: 'absolute',
    top: staticTheme.spacing.lg,
    right: staticTheme.spacing.lg,
    gap: staticTheme.spacing.sm,
  },
  mapControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerLeft: {
    flex: 1,
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: staticTheme.borderRadius.md,
    borderWidth: 1,
    padding: 2,
  },
  toggleButton: {
    width: 44,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: staticTheme.borderRadius.sm,
  },
});
