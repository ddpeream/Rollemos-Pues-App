import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

/**
 * SpotSearchFilter - Componente independiente de filtrado para spots
 * 
 * Props:
 *   - draftFilters: {ciudad, tipo, dificultad} - Estado actual de filtros
 *   - onFiltersChange: (newFilters) => void - Callback cuando cambian los filtros
 *   - onApplyFilters: () => void - Callback cuando presiona "Buscar"
 *   - allCities: string[] - Lista de ciudades disponibles
 *   - isLoading: boolean - Si está cargando (para deshabilitar botón)
 *   - strings: object - Traducciones del idioma
 *   - theme: object - Colores del tema
 *   - spacing: object - Valores de espaciado
 *   - typography: object - Valores tipográficos
 *   - borderRadius: object - Valores de bordes redondeados
 */
export default function SpotSearchFilter({
  draftFilters,
  onFiltersChange,
  onApplyFilters,
  allCities,
  isLoading,
  strings,
  theme,
  spacing,
  typography,
  borderRadius,
}) {
  // Local state para el Picker modal
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [activePickerField, setActivePickerField] = useState(null);

  // Función local para obtener opciones del picker según el campo
  const getPickerOptions = useCallback((fieldKey) => {
    switch (fieldKey) {
      case 'ciudad':
        return [
          { label: strings.allCities, value: '' },
          ...allCities.map(city => ({ label: city, value: city }))
        ];
      case 'tipo':
        return [
          { label: strings.allTypes, value: '' },
          { label: strings.typeStreet, value: 'street' },
          { label: strings.typePark, value: 'park' },
          { label: strings.typePumptrack, value: 'pumptrack' },
        ];
      case 'dificultad':
        return [
          { label: strings.difficultyAll, value: '' },
          { label: strings.difficultyLow, value: 'baja' },
          { label: strings.difficultyMedium, value: 'media' },
          { label: strings.difficultyHigh, value: 'alta' },
        ];
      default:
        return [];
    }
  }, [allCities, strings]);

  // Abre el modal del picker
  const openPickerModal = useCallback((fieldKey) => {
    setActivePickerField(fieldKey);
    setPickerModalVisible(true);
  }, []);

  // Cierra el modal del picker
  const closePickerModal = useCallback(() => {
    setPickerModalVisible(false);
    setActivePickerField(null);
  }, []);

  // Maneja cambios en el picker
  const handlePickerChange = useCallback((value) => {
    if (activePickerField) {
      onFiltersChange(prev => ({ ...prev, [activePickerField]: value }));
    }
  }, [activePickerField, onFiltersChange]);

  // Estilos del componente
  const styles = useMemo(() => StyleSheet.create({
    container: {
      marginBottom: spacing.lg,
    },
    filtersChipsScroll: {
      marginBottom: spacing.md,
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background.surface,
      borderRadius: borderRadius.round,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginRight: spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.glass.border,
    },
    filterChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterChipText: {
      color: theme.colors.text.secondary,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
    },
    filterChipTextActive: {
      color: '#000',
      fontWeight: typography.fontWeight.semibold,
    },
    applyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    applyButtonDisabled: {
      opacity: 0.5,
    },
    applyButtonText: {
      color: '#000',
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
      marginLeft: spacing.sm,
    },
    pickerModalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    pickerModalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    pickerModalContent: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 34,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 5,
    },
    pickerModalHeader: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E5E5',
      backgroundColor: '#F9F9F9',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    pickerModalDone: {
      color: '#007AFF',
      fontSize: 17,
      fontWeight: '600',
    },
    pickerModalPicker: {
      backgroundColor: '#FFFFFF',
      width: '100%',
    },
    pickerItem: {
      fontSize: 20,
      height: 180,
      color: '#000000',
    },
  }), [theme, spacing, typography, borderRadius]);

  return (
    <View style={styles.container}>
      {/* Filter Chips - Quick Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersChipsScroll}
      >
        {[
          { icon: 'location', label: 'Ciudad', key: 'ciudad', active: draftFilters.ciudad },
          { icon: 'cube', label: 'Tipo', key: 'tipo', active: draftFilters.tipo },
          { icon: 'trending-up', label: 'Dificultad', key: 'dificultad', active: draftFilters.dificultad },
        ].map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              filter.active && styles.filterChipActive
            ]}
            onPress={() => openPickerModal(filter.key)}
            disabled={isLoading}
          >
            <Ionicons
              name={filter.icon}
              size={16}
              color={filter.active ? '#000' : theme.colors.text.secondary}
              style={{ marginRight: spacing.xs }}
            />
            <Text style={[
              styles.filterChipText,
              filter.active && styles.filterChipTextActive
            ]}>
              {filter.active ? draftFilters[filter.key] : filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Apply Filter Button */}
      <TouchableOpacity
        style={[
          styles.applyButton,
          isLoading && styles.applyButtonDisabled,
        ]}
        onPress={onApplyFilters}
        activeOpacity={0.8}
        disabled={isLoading}
      >
        <Ionicons name="search" size={18} color="#000" />
        <Text style={styles.applyButtonText}>
          {isLoading ? 'Buscando...' : 'Buscar'}
        </Text>
      </TouchableOpacity>

      {/* Picker Modal for Filter Selection */}
      <Modal
        visible={pickerModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closePickerModal}
      >
        <View style={styles.pickerModalOverlay}>
          <TouchableOpacity
            style={styles.pickerModalBackdrop}
            activeOpacity={1}
            onPress={closePickerModal}
          />
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <TouchableOpacity
                onPress={closePickerModal}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.pickerModalDone}>Listo</Text>
              </TouchableOpacity>
            </View>
            {activePickerField && (
              <Picker
                selectedValue={draftFilters[activePickerField]}
                onValueChange={handlePickerChange}
                style={styles.pickerModalPicker}
                itemStyle={styles.pickerItem}
              >
                {getPickerOptions(activePickerField).map((option) => (
                  <Picker.Item
                    key={option.value || 'empty'}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </Picker>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
