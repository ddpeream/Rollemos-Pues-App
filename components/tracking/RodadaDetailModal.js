import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

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
                {selectedRodada?.nombre || t('rodadas.detail.title')}
              </Text>
              {user && selectedRodada?.organizador_id === user.id && (
                <View style={styles.organizerBadgeHeader}>
                  <MaterialCommunityIcons name="crown" size={14} color="#34C759" />
                  <Text style={styles.organizerBadgeText}>{t('rodadas.detail.youAreOrganizer')}</Text>
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
                {t('rodadas.detail.status')}
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
                  {selectedRodada?.estado === 'en_curso' ? t('rodadas.detail.statusActive') : t('rodadas.detail.statusScheduled')}
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
                {t('rodadas.detail.organizer')}
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
                  {selectedRodada?.organizador?.nombre || t('common.user')}
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
                {t('rodadas.detail.type')}
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
                    ? t('rodadas.types.training')
                    : selectedRodada?.comunidad_id
                    ? t('rodadas.types.community')
                    : t('rodadas.types.rodada')}
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
                  {t('rodadas.detail.community')}
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
                    {selectedRodada?.comunidad?.nombre || t('rodadas.detail.notSpecified')}
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
                {t('rodadas.detail.startPoint')}
              </Text>
              <View style={styles.rodadaDetailRow}>
                <Ionicons name="location" size={18} color={theme.colors.primary} />
                <Text
                  style={[
                    styles.rodadaDetailValue,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  {selectedRodada?.punto_salida_nombre || t('rodadas.detail.notSpecified')}
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
                {t('rodadas.detail.dateTime')}
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
                    : t('rodadas.detail.noDate')}
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
                  {selectedRodada?.hora_encuentro || t('rodadas.detail.noTime')}
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
                {t('rodadas.detail.levelRequired')}
              </Text>
              <View style={styles.rodadaDetailRow}>
                <MaterialCommunityIcons name="medal" size={18} color={theme.colors.primary} />
                <Text
                  style={[
                    styles.rodadaDetailValue,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  {selectedRodada?.nivel_requerido || t('rodadas.detail.allLevels')}
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
                {t('rodadas.detail.participants')}
              </Text>
              <View style={styles.rodadaDetailRow}>
                <Ionicons name="people" size={18} color={theme.colors.primary} />
                <Text
                  style={[
                    styles.rodadaDetailValue,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  {t('rodadas.detail.participantsCount', { count: selectedRodada?.participantes_count || 0 })}
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
                        - {item.usuario?.nombre || t('common.user')}
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
                  {t('rodadas.detail.description')}
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
                {t('rodadas.detail.viewOnMap')}
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
                    {t('rodadas.detail.verifying')}
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
                      {t('rodadas.detail.leaving')}
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
                        {t('rodadas.detail.leave')}
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
                    <Text style={styles.rodadaDetailButtonText}>{t('rodadas.detail.joining')}</Text>
                  ) : (
                    <>
                      <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.rodadaDetailButtonText}>{t('rodadas.detail.join')}</Text>
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
                  <Text style={styles.rodadaDetailButtonText}>{t('rodadas.detail.deleting')}</Text>
                ) : (
                  <>
                    <Ionicons name="trash" size={20} color="#FFFFFF" />
                    <Text style={styles.rodadaDetailButtonText}>{t('rodadas.detail.delete')}</Text>
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
