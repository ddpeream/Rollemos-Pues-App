import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HistoricalRouteCardView({
  copy,
  dateLabel,
  formattedRoute,
  onDelete,
  onOpen,
  previewPoints,
  previewSegments,
  styles,
  theme,
}) {
  return (
    <View style={styles.card}>
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.85}
        onPress={onOpen}
        style={styles.preview}
      >
        <View style={styles.previewGrid}>
          {previewPoints.length > 0 ? (
            <>
              {previewSegments.map((segment) => (
                <View
                  key={segment.key}
                  style={[
                    styles.previewSegment,
                    {
                      backgroundColor: theme.colors.primary,
                      left: `${segment.left}%`,
                      top: `${segment.top}%`,
                      width: `${segment.length}%`,
                      transform: [
                        { rotate: `${segment.angle}deg` },
                      ],
                    },
                  ]}
                />
              ))}
              <View
                style={[
                  styles.previewPoint,
                  {
                    backgroundColor: theme.colors.success,
                    left: `${previewPoints[0].left}%`,
                    top: `${previewPoints[0].top}%`,
                  },
                ]}
              />
              <View
                style={[
                  styles.previewPoint,
                  {
                    backgroundColor: theme.colors.secondary,
                    left: `${previewPoints[previewPoints.length - 1].left}%`,
                    top: `${previewPoints[previewPoints.length - 1].top}%`,
                  },
                ]}
              />
            </>
          ) : (
            <Ionicons name="map-outline" size={44} color={theme.colors.text.secondary} />
          )}
        </View>
        <View style={styles.dateBadge}>
          <Ionicons name="calendar-outline" size={12} color={theme.colors.text.primary} />
          <Text style={styles.dateText}>{dateLabel}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.primaryStats}>
          <View style={styles.statChip}>
            <Ionicons name="navigate" size={16} color={theme.colors.primary} />
            <Text style={styles.statText}>{formattedRoute.distance}</Text>
          </View>
          <View style={styles.statChip}>
            <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.statText}>{formattedRoute.duration}</Text>
          </View>
          <View style={styles.statChip}>
            <Ionicons name="speedometer-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.statText}>{formattedRoute.avgSpeed}</Text>
          </View>
        </View>

        <View style={styles.secondaryStats}>
          <View style={styles.secondaryStat}>
            <Text style={styles.secondaryLabel}>{copy.maxSpeed}</Text>
            <Text style={styles.secondaryValue}>{formattedRoute.maxSpeed}</Text>
          </View>
          <View style={styles.secondaryStat}>
            <Text style={styles.secondaryLabel}>{copy.calories}</Text>
            <Text style={styles.secondaryValue}>{formattedRoute.calories}</Text>
          </View>
          <View style={styles.secondaryStat}>
            <Text style={styles.secondaryLabel}>{copy.points}</Text>
            <Text style={styles.secondaryValue}>{formattedRoute.pointsCount}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onOpen}
            style={styles.actionButton}
          >
            <Ionicons name="eye-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.actionText}>{copy.view}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            onPress={onDelete}
            style={styles.actionButton}
          >
            <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
            <Text style={[styles.actionText, { color: theme.colors.error }]}>
              {copy.delete}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
