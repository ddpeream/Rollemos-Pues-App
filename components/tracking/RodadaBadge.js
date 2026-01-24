import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from '../../screens/tracking/tracking.style';

export default function RodadaBadge({
  visible,
  selectedRodada,
  getRodadaVisuals,
  onDismiss,
}) {
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
              Punto:{' '}
              {selectedRodada.punto_salida_nombre
                ? `${selectedRodada.punto_salida_nombre.substring(0, 30)}${
                    selectedRodada.punto_salida_nombre.length > 30 ? '...' : ''
                  }`
                : 'Sin definir'}
            </Text>
            <Text style={styles.rodadaBadgeStats}>
              Fecha:{' '}
              {selectedRodada.fecha_inicio
                ? new Date(selectedRodada.fecha_inicio).toLocaleDateString('es-CO')
                : 'Sin fecha'}{' '}
              - {selectedRodada.hora_encuentro || 'Sin hora'}
            </Text>
            <Text style={styles.rodadaBadgeStats}>
              Participantes: {selectedRodada.participantes_count || 0} - Nivel:{' '}
              {selectedRodada.nivel_requerido || 'Todos'}
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
