import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TrackingHistoryDetailView({
  copy,
  error,
  isLoading,
  map,
  onBackPress,
  styles,
  theme,
}) {
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.container}>
      {map}

      {map && !isLoading ? (
        <TouchableOpacity
          accessibilityLabel={copy.back}
          accessibilityRole="button"
          activeOpacity={0.85}
          onPress={onBackPress}
          style={styles.floatingBackButton}
        >
          <Ionicons name="chevron-back" size={20} color={theme.colors.text.primary} />
          <Text style={styles.floatingBackText}>{copy.back}</Text>
        </TouchableOpacity>
      ) : null}

      {isLoading ? (
        <View style={styles.stateOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.stateText}>{copy.loading}</Text>
        </View>
      ) : null}

      {!isLoading && error ? (
        <View style={styles.stateOverlay}>
          <Text style={styles.errorText}>{copy.error}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={onBackPress} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
