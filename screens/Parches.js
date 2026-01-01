import React, { useState, useMemo } from 'react';
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
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import useAppStore from '../store/useAppStore';
import { useParches } from '../hooks/useParches';
import { theme as staticTheme } from '../theme';
import CreateParcheModal from '../components/CreateParcheModal';

const { width } = Dimensions.get('window');

export default function Parches() {
  const { t } = useTranslation();
  const { theme, user } = useAppStore();
  const navigation = useNavigation();
  
  const {
    parches,
    loading,
    refreshing,
    loadParches,
    refreshParches,
    createParche,
  } = useParches();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Todos');
  const [selectedDiscipline, setSelectedDiscipline] = useState('Todas');
  const [activeFilter, setActiveFilter] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const translateOption = (option) => {
    if (option === 'Todos') return t('filters.all');
    if (option === 'Todas') return t('filters.allFeminine');
    return option;
  };

  // Cargar parches al entrar a la pantalla
  useFocusEffect(
    React.useCallback(() => {
      loadParches();
    }, [])
  );

  // Extract unique values for filters
  const cities = useMemo(() => {
    const uniqueCities = [...new Set(parches.map(p => p.ciudad).filter(Boolean))];
    return ['Todos', ...uniqueCities];
  }, [parches]);
  
  const disciplines = useMemo(() => {
    const allDisciplines = parches.flatMap(p => {
      if (typeof p.disciplinas === 'string') {
        return p.disciplinas.split(',').map(d => d.trim());
      }
      return Array.isArray(p.disciplinas) ? p.disciplinas : [];
    }).filter(Boolean);
    const uniqueDisciplines = [...new Set(allDisciplines)];
    
    // Si no hay disciplinas de los datos, usar las predeterminadas
    const defaultDisciplines = ['Street', 'Park', 'Vert', 'Freestyle', 'Downhill', 'Slalom'];
    const finalDisciplines = uniqueDisciplines.length > 0 ? uniqueDisciplines : defaultDisciplines;
    
    return ['Todas', ...finalDisciplines];
  }, [parches]);

  // Filter parches
  const filteredParches = useMemo(() => {
    return parches.filter(parche => {
      const matchesSearch = parche.nombre?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = selectedCity === 'Todos' || parche.ciudad === selectedCity;
      
      let matchesDiscipline = selectedDiscipline === 'Todas';
      if (!matchesDiscipline) {
        if (typeof parche.disciplinas === 'string') {
          matchesDiscipline = parche.disciplinas.split(',').map(d => d.trim()).includes(selectedDiscipline);
        } else if (Array.isArray(parche.disciplinas)) {
          matchesDiscipline = parche.disciplinas.includes(selectedDiscipline);
        }
      }
      
      return matchesSearch && matchesCity && matchesDiscipline;
    });
  }, [parches, searchQuery, selectedCity, selectedDiscipline]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCity('Todos');
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

  const hasActiveFilters = searchQuery || selectedCity !== 'Todos' || selectedDiscipline !== 'Todas';

  // Render parche card
  const renderParcheCard = ({ item }) => {
    // Procesar disciplinas
    const disciplinas = typeof item.disciplinas === 'string' 
      ? item.disciplinas.split(',').map(d => d.trim())
      : Array.isArray(item.disciplinas) 
      ? item.disciplinas 
      : [];

    console.log('🎴 Renderizando card:', item.id, item.nombre);
    
    return (
      <TouchableOpacity 
        style={[styles.parcheCard, { 
          backgroundColor: theme.colors.glass.background,
          borderColor: theme.colors.border 
        }]}
        activeOpacity={0.7}
        onPress={() => {
          console.log('👆 CLICK en parche:', item.id, item.nombre);
          console.log('📍 Navigation object:', navigation);
          navigation.navigate('DetalleParche', { parcheId: item.id });
          console.log('✅ navigate() llamado');
        }}
      >
        {/* Image */}
        <Image 
          source={{ uri: item.foto || item.logo || 'https://via.placeholder.com/400x300' }} 
          style={styles.parcheImage} 
        />
        
        {/* Content */}
        <View style={styles.parcheContent}>
          {/* Header */}
          <View style={styles.parcheHeader}>
            <View style={styles.parcheInfo}>
              <Text style={[styles.parcheNombre, { color: theme.colors.text.primary }]}>
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
            
            {item.verificado && (
              <View style={[styles.verifiedBadge, { backgroundColor: theme.colors.alpha.primary15 }]}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              </View>
            )}
          </View>

          {/* Description */}
          {item.descripcion && (
            <Text style={[styles.descriptionText, { color: theme.colors.text.secondary }]} numberOfLines={2}>
              {item.descripcion}
            </Text>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={16} color={theme.colors.text.secondary} />
              <Text style={[styles.statText, { color: theme.colors.text.secondary }]}>
                {t('screens.parches.members', { count: item.miembros || 0 })}
              </Text>
            </View>
            {item.fundado && (
              <View style={styles.statItem}>
                <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
                <Text style={[styles.statText, { color: theme.colors.text.secondary }]}>
                  {t('screens.parches.since', { year: item.fundado })}
                </Text>
              </View>
            )}
          </View>

          {/* Tags */}
          {disciplinas.length > 0 && (
            <View style={styles.tagsContainer}>
              {disciplinas.slice(0, 3).map((disc, idx) => (
                <View key={idx} style={[styles.disciplineBadge, { 
                  backgroundColor: theme.colors.alpha.primary15,
                  borderColor: theme.colors.primary 
                }]}>
                  <Text style={[styles.disciplineText, { color: theme.colors.primary }]}>
                    {disc}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Footer */}
          <View style={styles.cardFooter}>
            {item.redes?.instagram && (
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-instagram" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.viewButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                console.log('👁️ CLICK en botón Ver:', item.id);
                navigation.navigate('DetalleParche', { parcheId: item.id });
              }}
            >
              <Text style={[styles.viewButtonText, { color: theme.colors.onPrimary }]}>{t('screens.parches.view')}</Text>
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
            {t('nav.parches')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            {t('screens.parches.count', { count: filteredParches.length })}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Crear</Text>
        </TouchableOpacity>
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
            placeholder={t('screens.parches.searchPlaceholder')}
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

      {/* Parches List */}
      <FlatList
        data={filteredParches}
        renderItem={renderParcheCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshParches}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
                {t('screens.parches.loading')}
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={theme.colors.text.secondary} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                {hasActiveFilters ? t('screens.parches.emptyFiltered') : t('screens.parches.empty')}
              </Text>
              <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                {hasActiveFilters 
                  ? t('screens.parches.emptyHintFiltered')
                  : t('screens.parches.emptyHint')
                }
              </Text>
            </View>
          )
        }
      />

      {/* Modal para crear parche */}
      <CreateParcheModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        usuario={user}
        onSubmit={async (parcheData) => {
          const result = await createParche(parcheData);
          if (result.success) {
            console.log('✅ Parche creado:', result.data);
            Alert.alert(
              '🛹 ¡Parche creado!',
              `"${result.data.nombre}" ha sido creado exitosamente.`,
              [{ text: 'Genial!' }]
            );
          } else {
            Alert.alert('Error', result.error || 'No se pudo crear el parche');
            throw new Error(result.error); // Para que el modal no se cierre
          }
        }}
      />
    </View>
  );
}

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
  headerLeft: {
    flex: 1,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 4,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  parcheCard: {
    borderRadius: staticTheme.borderRadius.lg,
    borderWidth: 1,
    marginBottom: staticTheme.spacing.lg,
    overflow: 'hidden',
  },
  parcheImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  parcheContent: {
    padding: staticTheme.spacing.md,
  },
  parcheHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: staticTheme.spacing.sm,
  },
  parcheInfo: {
    flex: 1,
  },
  parcheNombre: {
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
  verifiedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: staticTheme.spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: staticTheme.spacing.md,
    marginBottom: staticTheme.spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: staticTheme.spacing.xs,
  },
  statText: {
    fontSize: 13,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: staticTheme.spacing.xs,
    marginBottom: staticTheme.spacing.md,
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
});
