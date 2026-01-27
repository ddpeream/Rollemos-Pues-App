import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { styles } from '../../screens/tracking/tracking.style';

export default function RodadaBadge({
  visible,
  selectedRodada,
  getRodadaVisuals,
  onDismiss,
}) {
  const { t } = useTranslation();

  if (!visible || !selectedRodada) return null;

  return (
    <TouchableOpacity
      style={styles.rodadaBadgeOverlay}
      onPress={onDismiss}
      activeOpacity={1}
    >
      <TouchableOpacity
        style={[
          styles.rodadaBadge,
          { backgroundColor: getRodadaVisuals(selectedRodada).markerColor },
        ]}
        onPress={() => {}}
        activeOpacity={1}
      >
        <View style={styles.rodadaBadgeContent}>
          <MaterialCommunityIcons name="account-group" size={20} color="#FFFFFF" />
          <View style={styles.rodadaBadgeText}>
            <Text style={styles.rodadaBadgeTitle} numberOfLines={1}>
              {selectedRodada.nombre}
            </Text>
            <Text style={styles.rodadaBadgeStats}>
              {t('rodadas.badge.point')}{' '}
              {selectedRodada.punto_salida_nombre
                ? `${selectedRodada.punto_salida_nombre.substring(0, 30)}${
                    selectedRodada.punto_salida_nombre.length > 30 ? '...' : ''
                  }`
                : t('rodadas.badge.undefined')}
            </Text>
            <Text style={styles.rodadaBadgeStats}>
              {t('rodadas.badge.date')}{' '}
              {selectedRodada.fecha_inicio
                ? new Date(selectedRodada.fecha_inicio).toLocaleDateString('es-CO')
                : t('rodadas.badge.noDate')}{' '}
              - {selectedRodada.hora_encuentro || t('rodadas.badge.noTime')}
            </Text>
            <Text style={styles.rodadaBadgeStats}>
              {t('rodadas.badge.participants')} {selectedRodada.participantes_count || 0} - {t('rodadas.badge.level')}{' '}
              {selectedRodada.nivel_requerido || t('rodadas.levels.short')}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onDismiss}
          style={styles.rodadaBadgeClose}
        >
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
