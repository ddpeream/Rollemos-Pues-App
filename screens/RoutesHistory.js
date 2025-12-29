/**
 * 📋 Routes History Screen
 * 
 * Pantalla para ver el historial de rutas grabadas.
 * 
 * Características:
 * - Lista de rutas con previews de mapa
 * - Stats de cada ruta (distancia, tiempo, velocidad)
 * - Vista detallada de ruta
 * - Compartir ruta a galería/redes
 * - Eliminar rutas
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import { useRouteTracker } from '../hooks/useRouteTracker';

const { width } = Dimensions.get('window');

export default function RoutesHistory() {
  const navigation = useNavigation();
  const { theme } = useAppStore();
  const { t } = useTranslation();
  const { loadRoutes, deleteRoute } = useRouteTracker();

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar rutas al entrar
  useFocusEffect(
    React.useCallback(() => {
      fetchRoutes();
    }, [])
  );

  const fetchRoutes = async () => {
    setLoading(true);
    const data = await loadRoutes();
    setRoutes(data);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRoutes();
    setRefreshing(false);
  };

  const handleDeleteRoute = (route) => {
    Alert.alert(
      t('screens.routesHistory.deleteTitle'),
      t('screens.routesHistory.deleteMessage', { distance: formatDistance(route.distance) }),
      [
        { text: t('screens.routesHistory.cancel'), style: 'cancel' },
        {
          text: t('screens.routesHistory.delete'),
          style: 'destructive',
          onPress: async () => {
            const success = await deleteRoute(route.id);
            if (success) {
              setRoutes((prev) => prev.filter((r) => r.id !== route.id));
            }
          },
        },
      ]
    );
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return t('screens.routesHistory.today', {
        time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('screens.routesHistory.yesterday', {
        time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      });
    } else {
      return date.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  // Formatear tiempo (segundos -> HH:MM:SS)
  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h}h ${m}m`;
    } else if (m > 0) {
      return `${m}m ${s}s`;
    } else {
      return `${s}s`;
    }
  };

  // Formatear distancia
  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${meters.toFixed(0)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  };

  // Generar URL de preview del mapa estático
  const getMapPreviewUrl = (route) => {
    if (!route.coordinates || route.coordinates.length === 0) return null;

    const start = route.coordinates[0];
    const path = route.coordinates
      .filter((_, index) => index % 5 === 0) // Tomar 1 de cada 5 puntos
      .map((c) => `${c.latitude},${c.longitude}`)
      .join('|');

    // Google Static Maps API (requiere API key en producción)
    return `https://maps.googleapis.com/maps/api/staticmap?size=400x200&path=color:0x4DD7D0FF|weight:3|${path}&markers=color:green|label:S|${start.latitude},${start.longitude}&key=AIzaSyAp3esnudg_4QNvVOUBONnxpY06TVXC2Ck`;
  };

  // Renderizar ruta
  const renderRoute = ({ item }) => (
    <View style={[styles.routeCard, { backgroundColor: theme.colors.background.secondary }]}>
      {/* Preview del mapa */}
      <View style={[styles.mapPreview, { backgroundColor: theme.colors.background.tertiary }]}>
        {/* Placeholder de mapa - en producción usar Static Maps API */}
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={48} color={theme.colors.text.tertiary} />
        </View>

        {/* Fecha */}
        <View style={[styles.dateBadge, { backgroundColor: theme.colors.background.overlay }]}>
          <Ionicons name="calendar-outline" size={12} color={theme.colors.text.primary} />
          <Text style={[styles.dateText, { color: theme.colors.text.primary }]}>
            {formatDate(item.date)}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.routeInfo}>
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Ionicons name="navigate" size={16} color={theme.colors.primary} />
            <Text style={[styles.statText, { color: theme.colors.text.primary }]}>
              {formatDistance(item.distance)}
            </Text>
          </View>

          <View style={styles.statChip}>
            <Ionicons name="time" size={16} color={theme.colors.primary} />
            <Text style={[styles.statText, { color: theme.colors.text.primary }]}>
              {formatDuration(item.duration)}
            </Text>
          </View>

          <View style={styles.statChip}>
            <Ionicons name="speedometer" size={16} color={theme.colors.primary} />
            <Text style={[styles.statText, { color: theme.colors.text.primary }]}>
              {item.avgSpeed.toFixed(1)} km/h
            </Text>
          </View>
        </View>

        {/* Secondary stats */}
        <View style={[styles.secondaryStats, { borderTopColor: theme.colors.border.primary }]}>
          <View style={styles.secondaryStatItem}>
            <Text style={[styles.secondaryLabel, { color: theme.colors.text.tertiary }]}>
              {t('screens.routesHistory.maxSpeed')}
            </Text>
            <Text style={[styles.secondaryValue, { color: theme.colors.text.primary }]}>
              {item.maxSpeed.toFixed(1)} km/h
            </Text>
          </View>

          <View style={styles.secondaryStatItem}>
            <Text style={[styles.secondaryLabel, { color: theme.colors.text.tertiary }]}>
              {t('screens.routesHistory.calories')}
            </Text>
            <Text style={[styles.secondaryValue, { color: theme.colors.text.primary }]}>
              {item.calories} kcal
            </Text>
          </View>

          <View style={styles.secondaryStatItem}>
            <Text style={[styles.secondaryLabel, { color: theme.colors.text.tertiary }]}>
              {t('screens.routesHistory.points')}
            </Text>
            <Text style={[styles.secondaryValue, { color: theme.colors.text.primary }]}>
              {item.coordinates.length}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.background.tertiary }]}
          >
            <Ionicons name="eye-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.actionText, { color: theme.colors.primary }]}>{t('screens.routesHistory.view')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.background.tertiary }]}
          >
            <Ionicons name="share-social-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.actionText, { color: theme.colors.primary }]}>{t('screens.routesHistory.share')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDeleteRoute(item)}
            style={[styles.actionButton, { backgroundColor: theme.colors.background.tertiary }]}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={[styles.actionText, { color: '#FF3B30' }]}>{t('screens.routesHistory.delete')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border.primary }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            {t('screens.routesHistory.title')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.text.tertiary }]}>
            {t('screens.routesHistory.count', { count: routes.length })}
          </Text>
        </View>
      </View>

      {/* Lista de rutas */}
      {loading ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.text.tertiary }]}>
            {t('screens.routesHistory.loading')}
          </Text>
        </View>
      ) : routes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={80} color={theme.colors.text.tertiary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
            {t('screens.routesHistory.empty')}
          </Text>
          <Text style={[styles.emptyText, { color: theme.colors.text.tertiary }]}>
            {t('screens.routesHistory.emptyHint')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={routes}
          renderItem={renderRoute}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Lista
  listContent: {
    padding: 16,
    gap: 16,
  },

  // Route Card
  routeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // Map Preview
  mapPreview: {
    height: 180,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Info
  routeInfo: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(77, 215, 208, 0.1)',
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Secondary Stats
  secondaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    marginBottom: 12,
    borderTopWidth: 1,
  },
  secondaryStatItem: {
    alignItems: 'center',
    gap: 4,
  },
  secondaryLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  secondaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
