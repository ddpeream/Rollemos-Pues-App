import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from '../../screens/tracking/tracking.style';

export default function RodadaDetailModal({
  visible,
  selectedRodada,
  user,
  isDark,
  theme,
  checkingJoin,
  isUserJoined,
  joiningRodada,
  deletingRodada,
  onClose,
  onCenterOnRodada,
  onJoinRodada,
  onLeaveRodada,
  onDeleteRodada,
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.rodadaDetailOverlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View
          style={[
            styles.rodadaDetailPanel,
            {
              backgroundColor: isDark
                ? 'rgba(12, 16, 24, 0.98)'
                : 'rgba(255, 255, 255, 0.98)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <View style={styles.rodadaDetailHeader}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.rodadaDetailTitle,
                  { color: theme.colors.text.primary },
                ]}
                numberOfLines={2}
              >
                {selectedRodada?.nombre || 'Rodada'}
              </Text>
              {user && selectedRodada?.organizador_id === user.id && (
                <View style={styles.organizerBadgeHeader}>
                  <MaterialCommunityIcons name="crown" size={14} color="#34C759" />
                  <Text style={styles.organizerBadgeText}>Eres el organizador</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons
                name="close-circle"
                size={28}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.rodadaDetailContent}>
            <View style={styles.rodadaDetailSection}>
              <Text
                style={[
                  styles.rodadaDetailLabel,
                  { color: theme.colors.text.secondary },
                ]}
              >
                Estado
              </Text>
              <View style={styles.rodadaDetailRow}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor:
                      selectedRodada?.estado === 'en_curso' ? '#FF3B30' : '#34C759',
                  }}
                />
                <Text
                  style={[
                    styles.rodadaDetailValue,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  {selectedRodada?.estado === 'en_curso' ? 'En curso' : 'Programada'}
                </Text>
              </View>
            </View>

            <View style={styles.rodadaDetailSection}>
              <Text
                style={[
                  styles.rodadaDetailLabel,
                  { color: theme.colors.text.secondary },
                ]}
              >
                Organiza
              </Text>
              <View style={styles.rodadaDetailRow}>
                <MaterialCommunityIcons
                  name="account"
                  size={18}
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.rodadaDetailValue,
                    { color: theme.colors.text.primary, flex: 1 },
                  ]}
                >
                  {selectedRodada?.organizador?.nombre || 'Usuario'}
                </Text>
              </View>
            </View>

            <View style={styles.rodadaDetailSection}>
              <Text
                style={[
                  styles.rodadaDetailLabel,
                  { color: theme.colors.text.secondary },
                ]}
              >
                Tipo
              </Text>
              <View style={styles.rodadaDetailRow}>
                <MaterialCommunityIcons
                  name={
                    selectedRodada?.tipo === 'entreno'
                      ? 'traffic-cone'
                      : selectedRodada?.comunidad_id
                      ? 'account-multiple'
                      : 'account-group'
                  }
                  size={18}
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.rodadaDetailValue,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  {selectedRodada?.tipo === 'entreno'
                    ? 'Entreno'
                    : selectedRodada?.comunidad_id
                    ? 'Comunidad'
                    : 'Rodada'}
                </Text>
              </View>
            </View>

            {(selectedRodada?.comunidad_id || selectedRodada?.comunidad) && (
              <View style={styles.rodadaDetailSection}>
                <Text
                  style={[
                    styles.rodadaDetailLabel,
                    { color: theme.colors.text.secondary },
                  ]}
                >
                  Comunidad
                </Text>
                <View style={styles.rodadaDetailRow}>
                  <MaterialCommunityIcons
                    name="account-multiple"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.rodadaDetailValue,
                      { color: theme.colors.text.primary },
                    ]}
                  >
                    {selectedRodada?.comunidad?.nombre || 'No especificada'}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.rodadaDetailSection}>
              <Text
                style={[
                  styles.rodadaDetailLabel,
                  { color: theme.colors.text.secondary },
                ]}
              >
                Punto de salida
              </Text>
              <View style={styles.rodadaDetailRow}>
                <Ionicons name="location" size={18} color={theme.colors.primary} />
                <Text
                  style={[
                    styles.rodadaDetailValue,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  {selectedRodada?.punto_salida_nombre || 'No especificado'}
                </Text>
              </View>
            </View>

            <View style={styles.rodadaDetailSection}>
              <Text
                style={[
                  styles.rodadaDetailLabel,
                  { color: theme.colors.text.secondary },
                ]}
              >
                Fecha y hora
              </Text>
              <View style={styles.rodadaDetailRow}>
                <Ionicons name="calendar" size={18} color={theme.colors.primary} />
                <Text
                  style={[
                    styles.rodadaDetailValue,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  {selectedRodada?.fecha_inicio
                    ? new Date(selectedRodada.fecha_inicio).toLocaleDateString('es-CO', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Sin fecha'}
                </Text>
              </View>
              <View style={[styles.rodadaDetailRow, { marginTop: 4 }]}>
                <Ionicons name="time" size={18} color={theme.colors.primary} />
                <Text
                  style={[
                    styles.rodadaDetailValue,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  {selectedRodada?.hora_encuentro || 'No especificada'}
                </Text>
              </View>
            </View>

            <View style={styles.rodadaDetailSection}>
              <Text
                style={[
                  styles.rodadaDetailLabel,
                  { color: theme.colors.text.secondary },
                ]}
              >
                Nivel requerido
              </Text>
              <View style={styles.rodadaDetailRow}>
                <MaterialCommunityIcons name="medal" size={18} color={theme.colors.primary} />
                <Text
                  style={[
                    styles.rodadaDetailValue,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  {selectedRodada?.nivel_requerido || 'Todos los niveles'}
                </Text>
              </View>
            </View>

            <View style={styles.rodadaDetailSection}>
              <Text
                style={[
                  styles.rodadaDetailLabel,
                  { color: theme.colors.text.secondary },
                ]}
              >
                Participantes
              </Text>
              <View style={styles.rodadaDetailRow}>
                <Ionicons name="people" size={18} color={theme.colors.primary} />
                <Text
                  style={[
                    styles.rodadaDetailValue,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  {selectedRodada?.participantes_count || 0} personas se han unido
                </Text>
              </View>
              {Array.isArray(selectedRodada?.participantes) &&
                selectedRodada.participantes.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    {selectedRodada.participantes.map((item, index) => (
                      <Text
                        key={item.id || `${item.usuario?.id || 'user'}-${index}`}
                        style={[
                          styles.rodadaDetailValue,
                          { color: theme.colors.text.primary },
                        ]}
                      >
                        - {item.usuario?.nombre || 'Usuario'}
                      </Text>
                    ))}
                  </View>
                )}
            </View>

            {selectedRodada?.descripcion && (
              <View style={styles.rodadaDetailSection}>
                <Text
                  style={[
                    styles.rodadaDetailLabel,
                    { color: theme.colors.text.secondary },
                  ]}
                >
                  Descripción
                </Text>
                <Text
                  style={[
                    styles.rodadaDetailValue,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  {selectedRodada.descripcion}
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.rodadaDetailActions}>
            <TouchableOpacity
              style={[
                styles.rodadaDetailButton,
                {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.06)',
                },
              ]}
              onPress={() => onCenterOnRodada(selectedRodada)}
            >
              <Ionicons name="locate" size={20} color={theme.colors.text.primary} />
              <Text
                style={[
                  styles.rodadaDetailButtonText,
                  { color: theme.colors.text.primary },
                ]}
              >
                Ver en mapa
              </Text>
            </TouchableOpacity>

            {user &&
              selectedRodada?.organizador_id !== user.id &&
              (checkingJoin ? (
                <View
                  style={[
                    styles.rodadaDetailButton,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,0,0,0.06)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.rodadaDetailButtonText,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    Verificando...
                  </Text>
                </View>
              ) : isUserJoined ? (
                <TouchableOpacity
                  style={[
                    styles.rodadaDetailButton,
                    {
                      backgroundColor: 'transparent',
                      borderWidth: 2,
                      borderColor: '#FF3B30',
                    },
                  ]}
                  onPress={() => onLeaveRodada(selectedRodada)}
                  disabled={joiningRodada === selectedRodada?.id}
                >
                  {joiningRodada === selectedRodada?.id ? (
                    <Text
                      style={[
                        styles.rodadaDetailButtonText,
                        { color: '#FF3B30' },
                      ]}
                    >
                      Abandonando...
                    </Text>
                  ) : (
                    <>
                      <Ionicons name="exit-outline" size={20} color="#FF3B30" />
                      <Text
                        style={[
                          styles.rodadaDetailButtonText,
                          { color: '#FF3B30' },
                        ]}
                      >
                        Abandonar
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.rodadaDetailButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={() => onJoinRodada(selectedRodada)}
                  disabled={joiningRodada === selectedRodada?.id}
                >
                  {joiningRodada === selectedRodada?.id ? (
                    <Text style={styles.rodadaDetailButtonText}>Uniéndote...</Text>
                  ) : (
                    <>
                      <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.rodadaDetailButtonText}>Unirme</Text>
                    </>
                  )}
                </TouchableOpacity>
              ))}

            {user && selectedRodada?.organizador_id === user.id && (
              <TouchableOpacity
                style={[
                  styles.rodadaDetailButton,
                  { backgroundColor: '#FF3B30' },
                ]}
                onPress={() => onDeleteRodada(selectedRodada)}
                disabled={deletingRodada}
              >
                {deletingRodada ? (
                  <Text style={styles.rodadaDetailButtonText}>Eliminando...</Text>
                ) : (
                  <>
                    <Ionicons name="trash" size={20} color="#FFFFFF" />
                    <Text style={styles.rodadaDetailButtonText}>Eliminar rodada</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
