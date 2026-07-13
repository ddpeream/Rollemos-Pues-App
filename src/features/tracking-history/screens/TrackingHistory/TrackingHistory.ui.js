import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

function EmptyState({ copy, styles, theme }) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="map-outline" size={72} color={theme.colors.text.secondary} />
      <Text style={styles.emptyTitle}>{copy.emptyTitle}</Text>
      <Text style={styles.emptyHint}>{copy.emptyHint}</Text>
    </View>
  );
}

export default function TrackingHistoryView({
  copy,
  error,
  isDeleting,
  isLoading,
  isRefreshing,
  onBackPress,
  onRefresh,
  renderRoute,
  routes,
  styles,
  theme,
}) {
  const showLoading = isLoading && routes.length === 0;

  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" onPress={onBackPress} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
        </View>
      </View>

      {error ? <Text style={styles.error}>{copy.error}</Text> : null}

      {showLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{copy.loading}</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={[
            styles.listContent,
            routes.length === 0 && styles.emptyListContent,
          ]}
          data={routes}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<EmptyState copy={copy} styles={styles} theme={theme} />}
          refreshControl={(
            <RefreshControl
              onRefresh={onRefresh}
              refreshing={isRefreshing}
              tintColor={theme.colors.primary}
            />
          )}
          renderItem={renderRoute}
          showsVerticalScrollIndicator={false}
        />
      )}

      {isDeleting ? (
        <View style={styles.blockingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
