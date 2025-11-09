import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { useTheme } from '../store/useAppStore';
import { spacing, borderRadius, typography } from '../theme';

/**
 * Componente genérico para renderizar filtros consistentes con la versión web.
 * Soporta campos de búsqueda y selectores, y muestra un botón "Aplicar" configurable.
 */
export default function FilterToolbar({
  filters,
  values,
  onValueChange,
  onApply,
  applyLabel,
  style,
  showApply = true,
}) {
  const { theme } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.glass.border,
    },
    fieldsWrapper: {
      flexDirection: 'column',
    },
    field: {
      marginBottom: spacing.sm,
    },
    label: {
      color: theme.colors.text.secondary,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      marginBottom: spacing.xs,
    },
    input: {
      backgroundColor: theme.colors.background.primary,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      color: theme.colors.text.primary,
      borderWidth: 1,
      borderColor: theme.colors.glass.border,
      fontSize: typography.fontSize.md,
    },
    pickerContainer: {
      backgroundColor: theme.colors.background.primary,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.glass.border,
      overflow: 'hidden',
    },
    picker: {
      color: theme.colors.text.primary,
      height: 48,
    },
    actions: {
      marginTop: spacing.sm,
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    applyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
    },
    applyButtonIcon: {
      marginRight: spacing.xs,
    },
    applyLabel: {
      color: '#000',
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
    },
  }), [theme]);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.fieldsWrapper}>
        {filters.map((filter) => (
          <View key={filter.key} style={styles.field}>
            {filter.label ? <Text style={styles.label}>{filter.label}</Text> : null}
            {filter.type === 'search' ? (
              <TextInput
                style={styles.input}
                placeholder={filter.placeholder}
                placeholderTextColor={theme.colors.text.secondary}
                value={values?.[filter.key] ?? ''}
                onChangeText={(text) => onValueChange?.(filter.key, text)}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType={filter.returnKeyType || 'search'}
              />
            ) : null}

            {filter.type === 'select' ? (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={values?.[filter.key] ?? ''}
                  onValueChange={(itemValue) => onValueChange?.(filter.key, itemValue)}
                  style={styles.picker}
                  dropdownIconColor={theme.colors.text.primary}
                  mode="dropdown"
                >
                  {filter.options?.map((opt) => (
                    <Picker.Item key={opt.value ?? opt.label} label={opt.label} value={opt.value} />
                  ))}
                </Picker>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      {showApply && (
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onApply}
            style={styles.applyButton}
            activeOpacity={0.8}
          >
            <Ionicons
              name="funnel"
              size={16}
              color="#000"
              style={styles.applyButtonIcon}
            />
            <Text style={styles.applyLabel}>{applyLabel}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

FilterToolbar.propTypes = {
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['search', 'select']).isRequired,
      label: PropTypes.string,
      placeholder: PropTypes.string,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        })
      ),
    })
  ),
  values: PropTypes.object,
  onValueChange: PropTypes.func,
  onApply: PropTypes.func,
  applyLabel: PropTypes.string,
  style: PropTypes.any,
  showApply: PropTypes.bool,
};

FilterToolbar.defaultProps = {
  filters: [],
  values: {},
  onValueChange: undefined,
  onApply: undefined,
  applyLabel: 'Aplicar filtros',
  style: null,
  showApply: true,
};
