/**
 * 👥 FOLLOWERS MODAL - Lista de seguidores de un parche
 * =====================================================
 * 
 * Modal con lista paginada de seguidores
 * - Scroll infinito para carga progresiva
 * - Búsqueda por nombre
 * - Botón de seguir de vuelta
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import useAppStore from '../store/useAppStore';
import { getParcheMiembros } from '../services/parches';
import { spacing, typography, borderRadius } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PAGE_SIZE = 20;

export default function FollowersModal({ 
  visible, 
  onClose, 
  parcheId,
  parcheName,
  totalFollowers = 0,
  onNavigateToProfile
}) {
  const { t } = useTranslation();
  const { theme, user } = useAppStore();
  
  const [followers, setFollowers] = useState([]);
  const [filteredFollowers, setFilteredFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  // Cargar seguidores
  const loadFollowers = useCallback(async () => {
    if (!parcheId) return;
    
    setLoading(true);
    try {
      const data = await getParcheMiembros(parcheId);
      setFollowers(data || []);
      setFilteredFollowers(data || []);
    } catch (error) {
      console.error('Error cargando seguidores:', error);
    } finally {
      setLoading(false);
    }
  }, [parcheId]);

  useEffect(() => {
    if (visible) {
      loadFollowers();
      setSearchQuery('');
      setDisplayCount(PAGE_SIZE);
    }
  }, [visible, loadFollowers]);

  // Filtrar por búsqueda
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFollowers(followers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = followers.filter(f => 
        f.usuario?.nombre?.toLowerCase().includes(query)
      );
      setFilteredFollowers(filtered);
    }
    setDisplayCount(PAGE_SIZE);
  }, [searchQuery, followers]);

  // Cargar más al hacer scroll
  const handleLoadMore = () => {
    if (displayCount < filteredFollowers.length) {
      setDisplayCount(prev => Math.min(prev + PAGE_SIZE, filteredFollowers.length));
    }
  };

  // Renderizar item de seguidor
  const renderFollower = ({ item, index }) => {
    const isCurrentUser = item.usuario_id === user?.id;
    
    return (
      <TouchableOpacity
        style={[styles.followerItem, { 
          backgroundColor: theme.colors.glass.background,
          borderColor: theme.colors.border 
        }]}
        onPress={() => {
          onClose();
          onNavigateToProfile?.(item.usuario_id);
        }}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.usuario?.avatar_url || 'https://i.pravatar.cc/100' }}
          style={styles.avatar}
        />
        
        <View style={styles.followerInfo}>
          <Text style={[styles.followerName, { color: theme.colors.text.primary }]} numberOfLines={1}>
            {item.usuario?.nombre || 'Usuario'}
          </Text>
          {item.usuario?.ciudad && (
            <Text style={[styles.followerCity, { color: theme.colors.text.tertiary }]} numberOfLines={1}>
              {item.usuario.ciudad}
            </Text>
          )}
        </View>
        
        {isCurrentUser ? (
          <View style={[styles.youBadge, { backgroundColor: theme.colors.alpha.primary15 }]}>
            <Text style={[styles.youBadgeText, { color: theme.colors.primary }]}>
              {t('common.you', 'Tú')}
            </Text>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
        )}
      </TouchableOpacity>
    );
  };

  // Footer con indicador de carga
  const renderFooter = () => {
    if (displayCount >= filteredFollowers.length) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  // Empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={60} color={theme.colors.text.tertiary} />
      <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
        {searchQuery 
          ? t('detalleParche.noFollowersFound', 'No se encontraron seguidores')
          : t('detalleParche.noFollowersYet', 'Aún no hay seguidores')}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
        onPress={onClose}
        activeOpacity={1}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboard}
        >
          <TouchableOpacity
            style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
            onPress={() => {}}
            activeOpacity={1}
          >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.headerLeft}>
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                {t('detalleParche.followers', 'Seguidores')}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
                {totalFollowers.toLocaleString()} {t('detalleParche.followersCount', 'seguidores')}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: theme.colors.glass.background }]}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={[styles.searchContainer, { backgroundColor: theme.colors.glass.background }]}>
            <Ionicons name="search" size={20} color={theme.colors.text.tertiary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text.primary }]}
              placeholder={t('detalleParche.searchFollowers', 'Buscar seguidor...')}
              placeholderTextColor={theme.colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={theme.colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Lista */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredFollowers.slice(0, displayCount)}
              renderItem={renderFollower}
              keyExtractor={(item) => item.id?.toString() || item.usuario_id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={renderEmpty}
            />
          )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboard: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    height: SCREEN_HEIGHT * 0.8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    height: 44,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.md,
    paddingVertical: 0,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  followerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  followerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  followerName: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  followerCity: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  youBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  youBadgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingFooter: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    textAlign: 'center',
  },
});


