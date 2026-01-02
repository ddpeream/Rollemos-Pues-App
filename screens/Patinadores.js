import React, { useState, useMemo, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import useAppStore from '../store/useAppStore';
import { usePatinadores } from '../hooks/usePatinadores';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { theme as staticTheme } from '../theme';

const { width } = Dimensions.get('window');

export default function Patinadores() {
  const { t } = useTranslation();
  const { theme } = useAppStore();
  const navigation = useNavigation();
  
  const {
    patinadores,
    loading,
    refreshing,
    loadPatinadores,
    refreshPatinadores,
  } = usePatinadores();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Todos');
  const [selectedLevel, setSelectedLevel] = useState('Todos');
  const [selectedDiscipline, setSelectedDiscipline] = useState('Todas');
  const [activeFilter, setActiveFilter] = useState(null);

  const translateOption = (option) => {
    if (option === 'Todos') return t('filters.all');
    if (option === 'Todas') return t('filters.allFeminine');
    if (option === 'principiante') return t('screens.shared.levels.principiante');
    if (option === 'intermedio') return t('screens.shared.levels.intermedio');
    if (option === 'avanzado') return t('screens.shared.levels.avanzado');
    if (option === 'profesional') return t('screens.shared.levels.profesional');
    return option;
  };

  // Cargar patinadores al entrar a la pantalla
  useFocusEffect(
    React.useCallback(() => {
      loadPatinadores();
    }, [loadPatinadores])
  );

  // 📡 Suscribirse a cambios en tiempo real de usuarios/patinadores (callback estable)
  const handlePatinersChange = React.useCallback(() => {
    console.log('👤 Recargando patinadores por cambio en realtime');
    loadPatinadores();
  }, [loadPatinadores]);

  useRealtimeSubscription('usuarios', handlePatinersChange);

  // Extract unique values for filters
  const cities = useMemo(() => {
    const uniqueCities = [...new Set(patinadores.map(s => s.ciudad).filter(Boolean))];
    return ['Todos', ...uniqueCities];
  }, [patinadores]);

  const levels = ['Todos', 'principiante', 'intermedio', 'avanzado', 'profesional'];
  
  const disciplines = useMemo(() => {
    const allDisciplines = patinadores.flatMap(s => {
      if (typeof s.disciplinas === 'string') {
        return s.disciplinas.split(',').map(d => d.trim());
      }
      return Array.isArray(s.disciplinas) ? s.disciplinas : [];
    }).filter(Boolean);
    const uniqueDisciplines = [...new Set(allDisciplines)];
    
    // Si no hay disciplinas de los datos, usar las predeterminadas
    const defaultDisciplines = ['Street', 'Park', 'Vert', 'Freestyle', 'Downhill', 'Slalom'];
    const finalDisciplines = uniqueDisciplines.length > 0 ? uniqueDisciplines : defaultDisciplines;
    
    return ['Todas', ...finalDisciplines];
  }, [patinadores]);

  // Filter skaters
  const filteredSkaters = useMemo(() => {
    return patinadores.filter(skater => {
      const matchesSearch = skater.nombre?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = selectedCity === 'Todos' || skater.ciudad === selectedCity;
      const matchesLevel = selectedLevel === 'Todos' || skater.nivel === selectedLevel;
      
      let matchesDiscipline = selectedDiscipline === 'Todas';
      if (!matchesDiscipline) {
        if (typeof skater.disciplinas === 'string') {
          matchesDiscipline = skater.disciplinas.split(',').map(d => d.trim()).includes(selectedDiscipline);
        } else if (Array.isArray(skater.disciplinas)) {
          matchesDiscipline = skater.disciplinas.includes(selectedDiscipline);
        }
      }
      
      return matchesSearch && matchesCity && matchesLevel && matchesDiscipline;
    });
  }, [patinadores, searchQuery, selectedCity, selectedLevel, selectedDiscipline]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCity('Todos');
    setSelectedLevel('Todos');
    setSelectedDiscipline('Todas');
  };

  const FilterButton = ({ id, label, value, options, onSelect, icon }) => {
    const isActive = activeFilter === id;
    const hasSelection = value !== 'Todos' && value !== 'Todas';
    
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

  const hasActiveFilters = searchQuery || selectedCity !== 'Todos' || 
    selectedLevel !== 'Todos' || selectedDiscipline !== 'Todas';

  // Render skater card
  const renderSkaterCard = ({ item }) => {
    // Procesar disciplinas
    const disciplinas = typeof item.disciplinas === 'string' 
      ? item.disciplinas.split(',').map(d => d.trim())
      : Array.isArray(item.disciplinas) 
      ? item.disciplinas 
      : [];

    return (
      <TouchableOpacity 
        style={[styles.skaterCard, { 
          backgroundColor: theme.colors.glass.background,
          borderColor: theme.colors.border 
        }]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('PerfilUsuario', { userId: item.id })}
      >
        {/* Image */}
        <Image 
          source={{ uri: item.avatar_url || item.foto || 'https://via.placeholder.com/400x300' }} 
          style={styles.skaterImage} 
        />
        
        {/* Content */}
        <View style={styles.skaterContent}>
          {/* Header */}
          <View style={styles.skaterHeader}>
            <View style={styles.skaterInfo}>
              <Text style={[styles.skaterName, { color: theme.colors.text.primary }]}>
                {item.nombre}
              </Text>
              {item.ciudad && (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color={theme.colors.text.secondary} />
                  <Text style={[styles.cityText, { color: theme.colors.text.secondary }]}>
                    {item.ciudad}
                  </Text>
                </View>
              )}
            </View>
            
            {item.destacado && (
              <View style={[styles.featuredBadge, { backgroundColor: theme.colors.alpha.primary15 }]}>
                <Ionicons name="star" size={16} color={theme.colors.primary} />
              </View>
            )}
          </View>

          {/* Bio */}
          {(item.bioCorta || item.bio) && (
            <Text style={[styles.bioText, { color: theme.colors.text.secondary }]} numberOfLines={2}>
              {item.bioCorta || item.bio}
            </Text>
          )}

          {/* Tags */}
          <View style={styles.tagsContainer}>
            {/* Level Badge */}
            {item.nivel && (
              <View style={[styles.levelBadge, getLevelStyle(item.nivel, theme)]}>
                <Text style={[styles.levelText, { color: theme.colors.text.primary }]}>{item.nivel}</Text>
              </View>
            )}
            
            {/* Disciplines */}
            {disciplinas.slice(0, 3).map((disc, idx) => (
              <View key={idx} style={[styles.disciplineBadge, { 
                backgroundColor: theme.colors.alpha.white08,
                borderColor: theme.colors.border 
              }]}>
                <Text style={[styles.disciplineText, { color: theme.colors.text.primary }]}>
                  {disc}
                </Text>
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            {item.redes?.instagram && (
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-instagram" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.viewButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('PerfilUsuario', { userId: item.id })}
            >
              <Text style={[styles.viewButtonText, { color: theme.colors.onPrimary }]}>{t('screens.patinadores.viewProfile')}</Text>
              <Ionicons name="arrow-forward" size={16} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Filter chip component
  const FilterChip = ({ label, selected, onPress }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        { 
          backgroundColor: selected ? theme.colors.primary : theme.colors.glass.background,
          borderColor: selected ? theme.colors.primary : theme.colors.border 
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.filterChipText,
        { color: selected ? theme.colors.onPrimary : theme.colors.text.primary }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {t('nav.patinadores')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
          {t('screens.patinadores.count', { count: filteredSkaters.length })}
        </Text>
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
            placeholder={t('screens.patinadores.searchPlaceholder')}
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
            id="level"
            label={t('filters.level')}
            value={selectedLevel}
            options={levels}
            onSelect={setSelectedLevel}
            icon="stats-chart-outline"
          />
          <FilterButton
            id="discipline"
            label={t('filters.discipline')}
            value={selectedDiscipline}
            options={disciplines}
            onSelect={setSelectedDiscipline}
            icon="fitness-outline"
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

      {/* Skaters List */}
      <FlatList
        data={filteredSkaters}
        renderItem={renderSkaterCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshPatinadores}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
                {t('screens.patinadores.loading')}
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={theme.colors.text.secondary} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                {t('screens.patinadores.empty')}
              </Text>
              <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                {hasActiveFilters 
                  ? t('screens.patinadores.emptyHintFiltered')
                  : t('screens.patinadores.emptyHint')
                }
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

// Helper function for level styling
const getLevelStyle = (nivel, theme) => {
  const styles = {
    principiante: { backgroundColor: theme.colors.info + '20' },
    intermedio: { backgroundColor: theme.colors.warning + '20' },
    avanzado: { backgroundColor: theme.colors.success + '20' },
    profesional: { backgroundColor: theme.colors.primary + '20' },
  };
  return styles[nivel] || styles.principiante;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
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
  skaterCard: {
    borderRadius: staticTheme.borderRadius.lg,
    borderWidth: 1,
    marginBottom: staticTheme.spacing.lg,
    overflow: 'hidden',
  },
  skaterImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  skaterContent: {
    padding: staticTheme.spacing.md,
  },
  skaterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: staticTheme.spacing.sm,
  },
  skaterInfo: {
    flex: 1,
  },
  skaterName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: staticTheme.spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cityText: {
    fontSize: 14,
  },
  featuredBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: staticTheme.spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: staticTheme.spacing.xs,
    marginBottom: staticTheme.spacing.md,
  },
  levelBadge: {
    paddingHorizontal: staticTheme.spacing.sm,
    paddingVertical: 4,
    borderRadius: staticTheme.borderRadius.sm,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  disciplineBadge: {
    paddingHorizontal: staticTheme.spacing.sm,
    paddingVertical: 4,
    borderRadius: staticTheme.borderRadius.sm,
    borderWidth: 1,
  },
  disciplineText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: staticTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: staticTheme.colors.alpha.white08,
  },
  socialButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: staticTheme.spacing.xs,
    paddingHorizontal: staticTheme.spacing.md,
    paddingVertical: staticTheme.spacing.sm,
    borderRadius: staticTheme.borderRadius.md,
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
});
