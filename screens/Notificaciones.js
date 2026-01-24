import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import BackButton from '../components/common/BackButton';
import { supabase } from '../config/supabase';
import { useAppStore } from '../store/useAppStore';
import { spacing, typography, borderRadius } from '../theme';

export default function Notificaciones() {
  const navigation = useNavigation();
  const { user, theme } = useAppStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('notificaciones')
      .select(
        'id, tipo, titulo, body, galeria_id, comentario_id, from_user_id, data, leida, created_at'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error cargando notificaciones:', error);
      setItems([]);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markRead = async (notificationId) => {
    if (!notificationId || !user?.id) return;
    const { error } = await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error marcando notificacion como leida:', error);
    } else {
      setItems((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, leida: true } : item
        )
      );
    }
  };

  const openNotification = async (item) => {
    await markRead(item.id);

    const data = item.data || {};
    const tipo = item.tipo;
    const galeriaId = item.galeria_id || data.galeria_id;
    const comentarioId = item.comentario_id || data.comentario_id;
    const parcheId = data.parche_id;
    const rodadaId = data.rodada_id;
    const fromUserId = item.from_user_id || data.from_user_id;

    if (tipo === 'like' || tipo === 'comentario') {
      navigation.navigate('MainTabs', {
        screen: 'Galeria',
        params: { postId: galeriaId, commentId: comentarioId },
      });
      return;
    }

    if (tipo === 'seguidor') {
      if (parcheId) {
        navigation.navigate('DetalleParche', { parcheId });
        return;
      }
      if (fromUserId) {
        navigation.navigate('PerfilUsuario', { userId: fromUserId });
      }
      return;
    }

    if (tipo === 'rodada' && rodadaId) {
      navigation.navigate('MainTabs', {
        screen: 'Rutas',
        params: {
          screen: 'TrackingMain',
          params: { rodadaId },
        },
      });
    }
  };

  const renderItem = ({ item }) => {
    const isUnread = !item.leida;
    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.glass.background,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={() => openNotification(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardLeft}>
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: theme.colors.primary + '20' },
            ]}
          >
            <Ionicons name="notifications" size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              {item.titulo || 'Notificacion'}
            </Text>
            <Text style={[styles.body, { color: theme.colors.text.secondary }]}>
              {item.body}
            </Text>
          </View>
        </View>
        {isUnread && (
          <View
            style={[
              styles.unreadDot,
              { backgroundColor: theme.colors.primary },
            ]}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <BackButton title="Notificaciones" />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
            Cargando notificaciones...
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off" size={48} color={theme.colors.text.tertiary} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                No hay notificaciones
              </Text>
              <Text style={[styles.emptyText, { color: theme.colors.text.tertiary }]}>
                Cuando tengas actividad, aparecera aqui.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  body: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: spacing.sm,
  },
});

