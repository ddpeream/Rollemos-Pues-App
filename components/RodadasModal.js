/**
 * 🛼 RODADAS MODAL - Lista de rodadas de un parche
 * =====================================================
 * 
 * Modal con lista paginada de rodadas
 * - Filtros: Próximas / Pasadas / Todas
 * - Scroll infinito para carga progresiva
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import useAppStore from '../store/useAppStore';
import { spacing, typography, borderRadius } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PAGE_SIZE = 10;

export default function RodadasModal({ 
  visible, 
  onClose, 
  rodadas = [],
  parcheName,
  loading = false,
  onNavigateToRodada
}) {
  const { t } = useTranslation();
  const { theme } = useAppStore();
  
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past'
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  // Filtrar rodadas
  const filteredRodadas = useMemo(() => {
    const now = new Date();
    let result = rodadas;
    
    if (filter === 'upcoming') {
      result = rodadas.filter(r => new Date(r.fecha_inicio) >= now || r.estado === 'en_curso');
    } else if (filter === 'past') {
      result = rodadas.filter(r => new Date(r.fecha_inicio) < now && r.estado !== 'en_curso');
    }
    
    // Ordenar: en curso primero, luego por fecha
    return result.sort((a, b) => {
      if (a.estado === 'en_curso' && b.estado !== 'en_curso') return -1;
      if (b.estado === 'en_curso' && a.estado !== 'en_curso') return 1;
      return new Date(a.fecha_inicio) - new Date(b.fecha_inicio);
    });
  }, [rodadas, filter]);

  // Cargar más al hacer scroll
  const handleLoadMore = () => {
    if (displayCount < filteredRodadas.length) {
      setDisplayCount(prev => Math.min(prev + PAGE_SIZE, filteredRodadas.length));
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  // Renderizar item de rodada
  const renderRodada = ({ item }) => {
    const isPast = new Date(item.fecha_inicio) < new Date() && item.estado !== 'en_curso';
    
    return (
      <TouchableOpacity
        style={[styles.rodadaCard, { 
          backgroundColor: theme.colors.background.surface,
          opacity: isPast ? 0.7 : 1
        }]}
        onPress={() => {
          onClose();
          onNavigateToRodada?.(item.id);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.rodadaHeader}>
          <View style={styles.rodadaInfo}>
            <Text style={[styles.rodadaName, { color: theme.colors.text.primary }]} numberOfLines={1}>
              {item.nombre}
            </Text>
            <View style={styles.rodadaDateRow}>
              <Ionicons name="calendar-outline" size={14} color={theme.colors.text.secondary} />
              <Text style={[styles.rodadaDate, { color: theme.colors.text.secondary }]}>
                {formatDate(item.fecha_inicio)}
              </Text>
              {item.hora_encuentro && (
                <Text style={[styles.rodadaTime, { color: theme.colors.primary }]}>
                  {item.hora_encuentro}
                </Text>
              )}
            </View>
          </View>
          
          <View style={[
            styles.rodadaStatus, 
            { backgroundColor: item.estado === 'en_curso' ? '#FF3B30' : isPast ? '#8E8E93' : '#34C759' }
          ]}>
            <Text style={styles.rodadaStatusText}>
              {item.estado === 'en_curso' 
                ? t('rodadas.status.active', 'En curso')
                : isPast 
                  ? t('rodadas.status.finished', 'Finalizada')
                  : t('rodadas.status.upcoming', 'Próxima')}
            </Text>
          </View>
        </View>
        
        <View style={styles.rodadaFooter}>
          <Ionicons name="location-outline" size={14} color={theme.colors.text.tertiary} />
          <Text style={[styles.rodadaLocation, { color: theme.colors.text.tertiary }]} numberOfLines={1}>
            {item.punto_salida_nombre || 'Punto por definir'}
          </Text>
          <View style={styles.rodadaParticipants}>
            <Ionicons name="people-outline" size={14} color={theme.colors.text.tertiary} />
            <Text style={[styles.rodadaParticipantsText, { color: theme.colors.text.tertiary }]}>
              {item.participantes?.length || item.participantes_count || 0}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Footer con indicador de carga
  const renderFooter = () => {
    if (displayCount >= filteredRodadas.length) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  // Empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="rollerblade" size={60} color={theme.colors.text.tertiary} />
      <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
        {filter === 'upcoming' 
          ? t('detalleParche.noUpcomingRodadas', 'No hay rodadas próximas')
          : filter === 'past'
            ? t('detalleParche.noPastRodadas', 'No hay rodadas pasadas')
            : t('detalleParche.noRodadasYet', 'Aún no hay rodadas')}
      </Text>
    </View>
  );

  const filters = [
    { key: 'all', label: t('detalleParche.allRodadas', 'Todas') },
    { key: 'upcoming', label: t('detalleParche.upcomingRodadas', 'Próximas') },
    { key: 'past', label: t('detalleParche.pastRodadas', 'Pasadas') },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.headerLeft}>
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                🛼 {t('detalleParche.rodadas', 'Rodadas')}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
                {rodadas.length} {t('detalleParche.rodadasTotal', 'rodadas')}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: theme.colors.glass.background }]}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Filtros */}
          <View style={styles.filtersContainer}>
            {filters.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.filterChip,
                  { 
                    backgroundColor: filter === f.key 
                      ? theme.colors.primary 
                      : theme.colors.glass.background,
                  }
                ]}
                onPress={() => {
                  setFilter(f.key);
                  setDisplayCount(PAGE_SIZE);
                }}
              >
                <Text style={[
                  styles.filterText,
                  { color: filter === f.key ? '#000' : theme.colors.text.secondary }
                ]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Lista */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredRodadas.slice(0, displayCount)}
              renderItem={renderRodada}
              keyExtractor={(item) => item.id?.toString()}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={renderEmpty}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    height: SCREEN_HEIGHT * 0.75,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  rodadaCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rodadaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  rodadaInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  rodadaName: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    marginBottom: 4,
  },
  rodadaDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rodadaDate: {
    fontSize: typography.fontSize.sm,
  },
  rodadaTime: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  rodadaStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rodadaStatusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  rodadaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rodadaLocation: {
    fontSize: typography.fontSize.sm,
    flex: 1,
  },
  rodadaParticipants: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rodadaParticipantsText: {
    fontSize: typography.fontSize.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingFooter: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    textAlign: 'center',
  },
});
