import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { styles } from '../../screens/tracking/tracking.style';

export default function RodadasListPanel({
  visible,
  isDark,
  theme,
  isLoadingRodadas,
  filteredRodadas,
  user,
  getRodadaVisuals,
  onClose,
  onSelectRodada,
  onOpenRodadaDetail,
}) {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <TouchableOpacity
      style={styles.rodadasListOverlay}
      onPress={onClose}
      activeOpacity={1}
    >
      <TouchableOpacity
        style={[
          styles.rodadasListPanel,
          {
            backgroundColor: isDark
              ? 'rgba(12, 16, 24, 0.95)'
              : 'rgba(255, 255, 255, 0.98)',
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
        onPress={() => {}}
        activeOpacity={1}
      >
        <View style={styles.rodadasListHeader}>
          <Text style={[styles.rodadasListTitle, { color: theme.colors.text.primary }]}>
            {t('rodadas.list.title')}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {isLoadingRodadas ? (
          <View style={styles.rodadasListEmpty}>
            <Text style={{ color: theme.colors.text.secondary }}>
              {t('rodadas.list.loading')}
            </Text>
          </View>
        ) : filteredRodadas.length === 0 ? (
          <View style={styles.rodadasListEmpty}>
            <MaterialCommunityIcons
              name="calendar-blank"
              size={48}
              color={theme.colors.text.disabled}
            />
            <Text
              style={[
                styles.rodadasListEmptyText,
                { color: theme.colors.text.secondary },
              ]}
            >
              {t('rodadas.list.empty')}
            </Text>
            <Text
              style={[
                styles.rodadasListEmptySubtext,
                { color: theme.colors.text.disabled },
              ]}
            >
              {t('rodadas.list.emptyHint')}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.rodadasListScroll}
            showsVerticalScrollIndicator={false}
          >
            {filteredRodadas.map((rodada) => {
              const isOrganizer = rodada.organizador_id === user?.id;
              const visuals = getRodadaVisuals(rodada);

              return (
                <View
                  key={rodada.id}
                  style={[
                    styles.rodadaListItem,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(0,0,0,0.03)',
                      borderColor: isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.06)',
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.rodadaListItemMain}
                    onPress={() => onSelectRodada(rodada)}
                  >
                    <View
                      style={[
                        styles.rodadaListItemStatus,
                        { backgroundColor: visuals.markerColor },
                      ]}
                    />
                    <View style={styles.rodadaListItemContent}>
                      <Text
                        style={[
                          styles.rodadaListItemName,
                          { color: theme.colors.text.primary },
                        ]}
                        numberOfLines={1}
                      >
                        {rodada.nombre}
                        {isOrganizer && (
                          <Text style={{ color: theme.colors.primary }}> {t('rodadas.list.yours')}</Text>
                        )}
                      </Text>
                      <Text
                        style={[
                          styles.rodadaListItemDetails,
                          { color: theme.colors.text.secondary },
                        ]}
                      >
                        📅{' '}
                        {new Date(rodada.fecha_inicio).toLocaleDateString('es-CO', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                        {' • '}🕐 {rodada.hora_encuentro || '---'}
                      </Text>
                      <Text
                        style={[
                          styles.rodadaListItemDetails,
                          { color: theme.colors.text.disabled },
                        ]}
                        numberOfLines={1}
                      >
                        📍 {rodada.punto_salida_nombre}
                      </Text>
                    </View>
                    <View style={styles.rodadaListItemParticipants}>
                      <MaterialCommunityIcons
                        name="account-group"
                        size={16}
                        color={theme.colors.primary}
                      />
                      <Text
                        style={[
                          styles.rodadaListItemCount,
                          { color: theme.colors.primary },
                        ]}
                      >
                        {rodada.participantes_count || 0}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.rodadaActionButton,
                      { backgroundColor: theme.colors.primary },
                    ]}
                    onPress={() => onOpenRodadaDetail(rodada)}
                  >
                    <Ionicons name="eye" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
