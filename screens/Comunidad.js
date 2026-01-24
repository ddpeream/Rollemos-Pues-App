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
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import useAppStore from '../store/useAppStore';
import { useParches } from '../hooks/useParches';
import { useComunidades } from '../hooks/useComunidades';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { theme as staticTheme } from '../theme';
import CreateParcheModal from '../components/CreateParcheModal';
import CreateComunidadModal from '../components/CreateComunidadModal';

const { width } = Dimensions.get('window');

export default function Comunidad() {
  const { t } = useTranslation();
  const { theme, user } = useAppStore();
  const navigation = useNavigation();

  const {
    parches,
    loading: loadingParches,
    refreshing: refreshingParches,
    loadParches,
    refreshParches,
    createParche,
  } = useParches();

  const {
    comunidades,
    loading: loadingComunidades,
    refreshing: refreshingComunidades,
    loadComunidades,
    refreshComunidades,
    createComunidad,
    addComunidadImages,
  } = useComunidades();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Todos');
  const [selectedDiscipline, setSelectedDiscipline] = useState('Todas');
  const [selectedType, setSelectedType] = useState('Todos');
  const [activeFilter, setActiveFilter] = useState(null);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showCreateParcheModal, setShowCreateParcheModal] = useState(false);
  const [showCreateComunidadModal, setShowCreateComunidadModal] = useState(false);

  const translateOption = (option) => {
    if (option === 'Todos') return t('filters.all');
    if (option === 'Todas') return t('filters.allFeminine');
    return option;
  };

  // Cargar data al entrar
  useFocusEffect(
    React.useCallback(() => {
      loadParches();
      loadComunidades();
    }, [loadParches, loadComunidades])
  );

  useRealtimeSubscription('parches', loadParches);
  useRealtimeSubscription('comunidades', loadComunidades);
  useRealtimeSubscription('comunidades_seguidores', loadComunidades);

  const cities = useMemo(() => {
    const uniqueCities = [
      ...new Set([
        ...parches.map((p) => p.ciudad).filter(Boolean),
        ...comunidades.map((c) => c.ciudad).filter(Boolean),
      ]),
    ];
    return ['Todos', ...uniqueCities];
  }, [parches, comunidades]);

  const disciplines = useMemo(() => {
    const allDisciplines = parches
      .flatMap((p) => {
        if (typeof p.disciplinas === 'string') {
          return p.disciplinas.split(',').map((d) => d.trim());
        }
        return Array.isArray(p.disciplinas) ? p.disciplinas : [];
      })
      .filter(Boolean);

    const uniqueDisciplines = [...new Set(allDisciplines)];
    const defaultDisciplines = ['Street', 'Park', 'Vert', 'Freestyle', 'Downhill', 'Slalom'];
    const finalDisciplines = uniqueDisciplines.length > 0 ? uniqueDisciplines : defaultDisciplines;

    return ['Todas', ...finalDisciplines];
  }, [parches]);

  const typeOptions = ['Todos', 'Parches', 'Comunidades'];

  const combinedItems = useMemo(() => {
    const parcheItems = parches.map((item) => ({ ...item, _type: 'parche' }));
    const comunidadItems = comunidades.map((item) => ({ ...item, _type: 'comunidad' }));
    return [...comunidadItems, ...parcheItems];
  }, [parches, comunidades]);

  const filteredItems = useMemo(() => {
    return combinedItems.filter((item) => {
      const matchesSearch = item.nombre?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = selectedCity === 'Todos' || item.ciudad === selectedCity;
      const matchesType =
        selectedType === 'Todos' ||
        (selectedType === 'Parches' && item._type === 'parche') ||
        (selectedType === 'Comunidades' && item._type === 'comunidad');

      if (!matchesSearch || !matchesCity || !matchesType) return false;

      if (item._type === 'parche' && selectedDiscipline !== 'Todas') {
        if (typeof item.disciplinas === 'string') {
          return item.disciplinas
            .split(',')
            .map((d) => d.trim())
            .includes(selectedDiscipline);
        }
        if (Array.isArray(item.disciplinas)) {
          return item.disciplinas.includes(selectedDiscipline);
        }
        return false;
      }

      return true;
    });
  }, [combinedItems, searchQuery, selectedCity, selectedDiscipline, selectedType]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCity('Todos');
    setSelectedDiscipline('Todas');
    setSelectedType('Todos');
  };

  const FilterButton = ({ id, label, value, options, onSelect, icon }) => {
    const isActive = activeFilter === id;
    const hasSelection = value !== 'Todos' && value !== 'Todas';
    const displayText = hasSelection ? translateOption(value) : label;

    return (
      <View style={styles.filterButtonContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: hasSelection ? theme.colors.primary : theme.colors.glass.background,
              borderColor: hasSelection ? theme.colors.primary : theme.colors.glass.border,
            },
          ]}
          onPress={() => setActiveFilter(isActive ? null : id)}
        >
          <Ionicons
            name={icon}
            size={16}
            color={hasSelection ? theme.colors.onPrimary : theme.colors.text.primary}
          />
          <Text
            style={[
              styles.filterButtonText,
              { color: hasSelection ? theme.colors.onPrimary : theme.colors.text.primary },
            ]}
          >
            {displayText}
          </Text>
          <Ionicons
            name={isActive ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={hasSelection ? theme.colors.onPrimary : theme.colors.text.secondary}
          />
        </TouchableOpacity>

        {isActive && (
          <View
            style={[
              styles.filterDropdown,
              {
                backgroundColor: theme.colors.background.surface,
                borderColor: theme.colors.glass.border,
              },
            ]}
          >
            <ScrollView style={styles.filterDropdownScroll} nestedScrollEnabled>
              {options.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.filterOption, { borderBottomColor: theme.colors.glass.border }]}
                  onPress={() => {
                    onSelect(option);
                    setActiveFilter(null);
                  }}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      {
                        color:
                          option === value ? theme.colors.primary : theme.colors.text.primary,
                      },
                    ]}
                  >
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

  const hasActiveFilters =
    searchQuery ||
    selectedCity !== 'Todos' ||
    selectedDiscipline !== 'Todas' ||
    selectedType !== 'Todos';


  const renderItem = ({ item }) => {
    const disciplinas = typeof item.disciplinas === 'string'
      ? item.disciplinas.split(',').map((d) => d.trim())
      : Array.isArray(item.disciplinas)
      ? item.disciplinas
      : [];
    const tags = Array.isArray(item.tags) ? item.tags : [];
    const badges = item._type === 'parche' ? disciplinas : tags;
    const detailRoute =
      item._type === 'parche'
        ? { name: 'DetalleParche', params: { parcheId: item.id } }
        : { name: 'DetalleComunidad', params: { comunidadId: item.id } };

    return (
      <TouchableOpacity
        style={[
          styles.parcheCard,
          { backgroundColor: theme.colors.glass.background, borderColor: theme.colors.border },
        ]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate(detailRoute.name, detailRoute.params)}
      >
        <Image
          source={{ uri: item.foto || item.logo || 'https://via.placeholder.com/400x300' }}
          style={styles.parcheImage}
        />

        <View style={styles.parcheContent}>
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
          </View>

          {item.descripcion && (
            <Text
              style={[styles.descriptionText, { color: theme.colors.text.secondary }]}
              numberOfLines={2}
            >
              {item.descripcion}
            </Text>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={16} color={theme.colors.text.secondary} />
              <Text style={[styles.statText, { color: theme.colors.text.secondary }]}>
                {item._type === 'parche'
                  ? t('screens.parches.members', { count: item.miembros || 0 })
                  : `${item.miembros || 0} miembros`}
              </Text>
            </View>
          </View>

          {badges.length > 0 && (
            <View style={styles.tagsContainer}>
              {badges.slice(0, 3).map((badge, idx) => (
                <View
                  key={`${badge}-${idx}`}
                  style={[
                    styles.disciplineBadge,
                    { backgroundColor: theme.colors.alpha.primary15, borderColor: theme.colors.primary },
                  ]}
                >
                  <Text style={[styles.disciplineText, { color: theme.colors.primary }]}>
                    {badge}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={[styles.viewButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate(detailRoute.name, detailRoute.params)}
            >
              <Text style={[styles.viewButtonText, { color: theme.colors.onPrimary }]}>Ver</Text>
              <Ionicons name="arrow-forward" size={16} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const loading = loadingParches || loadingComunidades;
  const refreshing = refreshingParches || refreshingComunidades;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 20}
    >
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {t('nav.comunidad')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            {t('screens.comunidad.count', { count: filteredItems.length })}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowCreateMenu(true)}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Crear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.colors.glass.background, borderColor: theme.colors.border },
          ]}
        >
          <Ionicons name="search" size={20} color={theme.colors.text.secondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text.primary }]}
            placeholder={t('screens.comunidad.searchPlaceholder')}
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

      <View style={styles.filtersSection}>
        <View style={styles.filterRow}>
          <FilterButton
            id="type"
            label="Tipo"
            value={selectedType}
            options={typeOptions}
            onSelect={setSelectedType}
            icon="grid-outline"
          />
          <FilterButton
            id="city"
            label={t('filters.city')}
            value={selectedCity}
            options={cities}
            onSelect={setSelectedCity}
            icon="location-outline"
          />
        </View>
        <View style={styles.filterRow}>
          <FilterButton
            id="discipline"
            label={t('filters.discipline')}
            value={selectedDiscipline}
            options={disciplines}
            onSelect={setSelectedDiscipline}
            icon="fitness-outline"
          />
        </View>

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

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => `${item._type}-${item.id}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              refreshParches();
              refreshComunidades();
            }}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
                {t('screens.comunidad.loading')}
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={theme.colors.text.secondary} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                {t('screens.comunidad.empty')}
              </Text>
              <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                {t('screens.comunidad.emptyHint')}
              </Text>
            </View>
          )
        }
      />

      <Modal visible={showCreateMenu} transparent animationType="fade">
        <TouchableOpacity style={styles.createMenuBackdrop} onPress={() => setShowCreateMenu(false)}>
          <View
            style={[
              styles.createMenu,
              {
                backgroundColor: theme.colors.background.primary,
                borderColor: theme.colors.glass.border,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.createMenuItem,
                {
                  backgroundColor: theme.colors.glass.background,
                  borderColor: theme.colors.glass.border,
                },
              ]}
              onPress={() => {
                setShowCreateMenu(false);
                setShowCreateComunidadModal(true);
              }}
            >
              <Ionicons name="people-outline" size={18} color={theme.colors.primary} />
              <Text style={[styles.createMenuText, { color: theme.colors.text.primary }]}>
                Comunidad
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.createMenuItem,
                {
                  backgroundColor: theme.colors.glass.background,
                  borderColor: theme.colors.glass.border,
                },
              ]}
              onPress={() => {
                setShowCreateMenu(false);
                setShowCreateParcheModal(true);
              }}
            >
              <Ionicons name="people-circle-outline" size={18} color={theme.colors.primary} />
              <Text style={[styles.createMenuText, { color: theme.colors.text.primary }]}>
                Parche
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <CreateParcheModal
        visible={showCreateParcheModal}
        onClose={() => setShowCreateParcheModal(false)}
        usuario={user}
        onSubmit={async (parcheData) => {
          const result = await createParche(parcheData);
          if (result.success) {
            Alert.alert('Parche creado', `"${result.data.nombre}" fue creado.`);
          } else {
            Alert.alert('Error', result.error || 'No se pudo crear el parche');
            throw new Error(result.error);
          }
        }}
      />

      <CreateComunidadModal
        visible={showCreateComunidadModal}
        onClose={() => setShowCreateComunidadModal(false)}
        onSubmit={async (comunidadData) => {
          const { imagenes = [], coverIndex = 0, ...payload } = comunidadData || {};
          const result = await createComunidad(payload);
          if (!result.success) {
            Alert.alert('Error', result.error || 'No se pudo crear la comunidad');
            throw new Error(result.error);
          }

          if (imagenes.length > 0) {
            const uploadResult = await addComunidadImages(
              result.data.id,
              imagenes,
              coverIndex
            );
            if (!uploadResult.success) {
              Alert.alert(
                'Comunidad creada',
                'Se creo la comunidad, pero no se pudieron subir las fotos.'
              );
              return;
            }
            await loadComunidades();
          }

          Alert.alert('Comunidad creada', `"${result.data.nombre}" fue creada.`);
        }}
      />

    </KeyboardAvoidingView>
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: staticTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: staticTheme.colors.alpha.white08,
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
  comunidadCard: {
    borderRadius: staticTheme.borderRadius.lg,
    borderWidth: 1,
    marginBottom: staticTheme.spacing.lg,
    overflow: 'hidden',
  },
  comunidadImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  comunidadContent: {
    padding: staticTheme.spacing.md,
  },
  comunidadHeader: {
    marginBottom: staticTheme.spacing.sm,
  },
  comunidadNombre: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: staticTheme.spacing.xs,
  },
  comunidadActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  joinButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 13,
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
  createMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  createMenu: {
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  createMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  createMenuText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
