import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { theme as staticTheme } from '../theme';
import useAppStore from '../store/useAppStore';
import { useComunidades } from '../hooks/useComunidades';
import { getComunidadById } from '../services/comunidades';
import { useRodadas } from '../hooks/useRodadas';
import CreateRodadaModal from '../components/CreateRodadaModal';
import * as ImagePicker from 'expo-image-picker';
import { usePatinadores } from '../hooks/usePatinadores';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DetalleComunidad() {
  const navigation = useNavigation();
  const route = useRoute();
  const { comunidadId } = route.params || {};
  const { theme, user } = useAppStore();

  const {
    joinComunidad,
    leaveComunidad,
    isMember,
    loadComunidades,
    addComunidadImages,
    deleteComunidadImage,
    addLeader,
  } = useComunidades();
  const { rodadas, fetchRodadas, isLoading: loadingRodadas } = useRodadas();
  const {
    patinadores,
    loadPatinadoresFiltered,
    loading: loadingPatinadores,
  } = usePatinadores();

  const [comunidad, setComunidad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateRodadaModal, setShowCreateRodadaModal] = useState(false);
  const [rodadaTipo, setRodadaTipo] = useState('rodada');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerImageIndex, setViewerImageIndex] = useState(0);
  const [showLeaderModal, setShowLeaderModal] = useState(false);
  const [leaderSearch, setLeaderSearch] = useState('');

  const imageViewerRef = useRef(null);

  const loadComunidad = useCallback(async () => {
    if (!comunidadId) return;
    setLoading(true);
    const data = await getComunidadById(comunidadId);
    setComunidad(data);
    setLoading(false);
  }, [comunidadId]);

  useEffect(() => {
    loadComunidad();
  }, [loadComunidad]);

  useFocusEffect(
    React.useCallback(() => {
      if (comunidadId) {
        fetchRodadas({ comunidadId });
      }
      loadComunidades();
    }, [comunidadId, fetchRodadas, loadComunidades])
  );

  const joined = comunidadId ? isMember(comunidadId) : false;
  const isCreator = user?.id && comunidad?.created_by === user.id;
  const lideres = (comunidad?.comunidades_lideres || [])
    .map((row) => row.usuario)
    .filter(Boolean);
  const extraLideres = lideres.filter((lider) => lider.id !== comunidad?.created_by);
  const leaderIds = new Set(extraLideres.map((lider) => lider.id));
  const isLeader = user?.id ? leaderIds.has(user.id) : false;
  const canAddLeader = leaderIds.size === 0 ? isCreator : isCreator || isLeader;
  const canManageMedia = isCreator || isLeader;
  const canDeleteMedia = isCreator;
  const comunidadRodadas = rodadas.filter((r) => r.comunidad_id === comunidadId);

  const getAllImages = useCallback(() => {
    const images = [];
    if (comunidad?.foto) {
      images.push(comunidad.foto);
    }
    if (Array.isArray(comunidad?.fotos)) {
      images.push(...comunidad.fotos);
    }
    if (images.length === 0) {
      images.push('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800');
    }
    return images;
  }, [comunidad]);

  const allImages = getAllImages();

  const onViewerScroll = (event) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setViewerImageIndex(slideIndex);
  };

  const handleAddImages = async () => {
    if (!canManageMedia) {
      Alert.alert('Sin permisos', 'Solo lideres pueden agregar fotos');
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu galeria');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 6,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setUploadingImages(true);
        const imageUris = result.assets.map((asset) => asset.uri);
        const uploadResult = await addComunidadImages(comunidadId, imageUris);
        if (uploadResult.success) {
          await loadComunidad();
          Alert.alert('Listo', `${imageUris.length} imagen(es) agregada(s)`);
        } else {
          Alert.alert('Error', uploadResult.error || 'No se pudieron subir');
        }
        setUploadingImages(false);
      }
    } catch (error) {
      setUploadingImages(false);
      Alert.alert('Error', 'No se pudieron seleccionar imagenes');
    }
  };

  const isDeletableImage = useCallback((imageUrl) => {
    if (!imageUrl) return false;
    return imageUrl === comunidad?.foto || (comunidad?.fotos || []).includes(imageUrl);
  }, [comunidad]);

  const handleRemoveImage = async () => {
    if (!canDeleteMedia) {
      Alert.alert('Sin permisos', 'Solo el creador puede eliminar fotos');
      return;
    }

    const imageUrl = allImages[viewerImageIndex];
    if (!isDeletableImage(imageUrl)) {
      return;
    }

    Alert.alert(
      'Eliminar foto',
      '¿Quieres eliminar esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteComunidadImage(comunidadId, imageUrl);
            if (result.success) {
              await loadComunidad();
              setViewerImageIndex(0);
            } else {
              Alert.alert('Error', result.error || 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };

  const handleLeaderSearch = async (value) => {
    setLeaderSearch(value);
    if (value.trim().length < 2) return;
    await loadPatinadoresFiltered({ text: value.trim(), limit: 20 });
  };

  const handleAddLeader = async (leaderUser) => {
    if (!canAddLeader) {
      Alert.alert('Sin permisos', 'No puedes agregar lideres');
      return;
    }

    const result = await addLeader(comunidadId, leaderUser.id);
    if (result.success) {
      if (result.alreadyLeader) {
        Alert.alert('Info', 'Este usuario ya es lider');
        return;
      }
      await loadComunidad();
      setShowLeaderModal(false);
      setLeaderSearch('');
    } else {
      Alert.alert('Error', result.error || 'No se pudo agregar');
    }
  };

  if (loading || !comunidad) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
          Cargando comunidad...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          Comunidad
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.carouselContainer}>
          <FlatList
            data={allImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `comunidad-image-${index}`}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.coverSlide}
                onPress={() => {
                  setViewerImageIndex(index);
                  setShowImageViewer(true);
                }}
              >
                <Image source={{ uri: item }} style={styles.coverImage} />
              </TouchableOpacity>
            )}
          />
          {canManageMedia && (
            <TouchableOpacity
              style={[styles.addPhotoButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleAddImages}
              disabled={uploadingImages}
            >
              {uploadingImages ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera-outline" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {comunidad.nombre}
          </Text>
          {comunidad.usuario_creador?.nombre ? (
            <View style={styles.leaderRow}>
              <Ionicons name="person-outline" size={14} color={theme.colors.text.secondary} />
              <Text style={[styles.leaderText, { color: theme.colors.text.secondary }]}>
                Lider principal: {comunidad.usuario_creador.nombre}
              </Text>
            </View>
          ) : null}
          {comunidad.ciudad ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={theme.colors.text.secondary} />
              <Text style={[styles.locationText, { color: theme.colors.text.secondary }]}>
                {comunidad.ciudad}
              </Text>
            </View>
          ) : null}
          {comunidad.descripcion ? (
            <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
              {comunidad.descripcion}
            </Text>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={16} color={theme.colors.text.secondary} />
              <Text style={[styles.statText, { color: theme.colors.text.secondary }]}>
                {comunidad.miembros || 0} miembros
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="shield-checkmark-outline" size={16} color={theme.colors.text.secondary} />
              <Text style={[styles.statText, { color: theme.colors.text.secondary }]}>
                {comunidad.is_public ? 'Publica' : 'Privada'}
              </Text>
            </View>
          </View>

          {Array.isArray(comunidad.tags) && comunidad.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {comunidad.tags.slice(0, 6).map((tag) => (
                <View
                  key={tag}
                  style={[
                    styles.tagBadge,
                    {
                      backgroundColor: theme.colors.alpha.primary15,
                      borderColor: theme.colors.primary,
                    },
                  ]}
                >
                  <Text style={[styles.tagText, { color: theme.colors.primary }]}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.joinButton,
              { backgroundColor: joined ? theme.colors.border : theme.colors.primary },
            ]}
            onPress={async () => {
              if (joined) {
                await leaveComunidad(comunidadId);
              } else {
                const result = await joinComunidad(comunidadId);
                if (!result.success) {
                  Alert.alert('Error', result.error || 'No se pudo unir');
                }
              }
            }}
          >
            <Text
              style={{
                color: joined ? theme.colors.text.primary : theme.colors.onPrimary,
                fontWeight: '600',
              }}
            >
              {joined ? 'Unido' : 'Unirme'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Rodadas activas
          </Text>
          {loadingRodadas ? (
            <Text style={[styles.sectionText, { color: theme.colors.text.secondary }]}>
              Cargando rodadas...
            </Text>
          ) : (
            <Text style={[styles.sectionText, { color: theme.colors.text.secondary }]}>
              {comunidadRodadas.length}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Lideres
            </Text>
            {canAddLeader && (
              <TouchableOpacity
                style={[styles.addLeaderButton, { borderColor: theme.colors.primary }]}
                onPress={() => setShowLeaderModal(true)}
              >
                <Ionicons name="person-add-outline" size={16} color={theme.colors.primary} />
                <Text style={[styles.addLeaderText, { color: theme.colors.primary }]}>
                  Agregar
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.tagsContainer}>
            <View
              style={[
                styles.tagBadge,
                { backgroundColor: theme.colors.alpha.primary15, borderColor: theme.colors.primary },
              ]}
            >
              <Text style={[styles.tagText, { color: theme.colors.primary }]}>
                {comunidad.usuario_creador?.nombre || 'Creador'}
              </Text>
            </View>
            {extraLideres.map((lider) => (
              <View
                key={lider.id}
                style={[
                  styles.tagBadge,
                  { backgroundColor: theme.colors.alpha.primary15, borderColor: theme.colors.primary },
                ]}
              >
                <Text style={[styles.tagText, { color: theme.colors.primary }]}>
                  {lider.nombre}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {isCreator && (
        <View style={[styles.bottomAction, { backgroundColor: theme.colors.background.primary }]}>
          <View style={styles.creatorActions}>
            <TouchableOpacity
              style={[styles.creatorButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                setRodadaTipo('rodada');
                setShowCreateRodadaModal(true);
              }}
            >
              <Ionicons name="bicycle" size={20} color="#000" />
              <Text style={[styles.creatorButtonText, { color: '#000' }]}>
                Crear rodada
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.creatorButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                setRodadaTipo('entreno');
                setShowCreateRodadaModal(true);
              }}
            >
              <Ionicons name="barbell-outline" size={20} color="#000" />
              <Text style={[styles.creatorButtonText, { color: '#000' }]}>
                Crear entreno
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <CreateRodadaModal
        visible={showCreateRodadaModal}
        onClose={() => setShowCreateRodadaModal(false)}
        comunidadId={comunidadId}
        rodadaTipo={rodadaTipo}
        onSuccess={(rodada) => {
          fetchRodadas({ comunidadId });
          Alert.alert(
            'Rodada creada',
            `"${rodada.nombre}" ha sido programada.`,
            [{ text: 'Ok' }]
          );
        }}
      />

      <Modal visible={showImageViewer} transparent animationType="fade">
        <View style={styles.imageViewerOverlay}>
          <View style={styles.imageViewerHeader}>
            <TouchableOpacity
              style={styles.imageViewerCloseButton}
              onPress={() => setShowImageViewer(false)}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.imageViewerCounter}>
              {viewerImageIndex + 1} / {allImages.length}
            </Text>
            {canDeleteMedia && isDeletableImage(allImages[viewerImageIndex]) ? (
              <TouchableOpacity
                style={styles.imageViewerCloseButton}
                onPress={handleRemoveImage}
              >
                <Ionicons name="trash-outline" size={24} color="#fff" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 36 }} />
            )}
          </View>

          <FlatList
            ref={imageViewerRef}
            data={allImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onViewerScroll}
            initialScrollIndex={viewerImageIndex}
            getItemLayout={(data, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            keyExtractor={(item, index) => `viewer-${index}`}
            renderItem={({ item }) => (
              <View style={styles.imageViewerSlide}>
                <Image source={{ uri: item }} style={styles.imageViewerImage} resizeMode="contain" />
              </View>
            )}
          />
        </View>
      </Modal>

      <Modal visible={showLeaderModal} transparent animationType="fade">
        <View style={styles.leaderModalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 20}
          >
            <View style={[styles.leaderModal, { backgroundColor: theme.colors.background.primary }]}>
            <View style={styles.leaderModalHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Agregar lider
              </Text>
              <TouchableOpacity onPress={() => setShowLeaderModal(false)}>
                <Ionicons name="close" size={22} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: theme.colors.glass.background,
                  borderColor: theme.colors.glass.border,
                  color: theme.colors.text.primary,
                },
              ]}
              placeholder="Buscar usuario"
              placeholderTextColor={theme.colors.text.secondary}
              value={leaderSearch}
              onChangeText={handleLeaderSearch}
            />
            {loadingPatinadores ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.sectionText, { color: theme.colors.text.secondary }]}>
                  Buscando...
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.leaderList}>
                {patinadores.map((patinador) => (
                  <TouchableOpacity
                    key={patinador.id}
                    style={styles.leaderItem}
                    onPress={() => handleAddLeader(patinador)}
                  >
                    <Text style={[styles.sectionText, { color: theme.colors.text.primary }]}>
                      {patinador.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
                {leaderSearch.trim().length >= 2 && patinadores.length === 0 && (
                  <Text style={[styles.sectionText, { color: theme.colors.text.secondary }]}>
                    Sin resultados
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: staticTheme.spacing.lg,
    paddingVertical: staticTheme.spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    paddingBottom: staticTheme.spacing.xl,
  },
  coverImage: {
    width: SCREEN_WIDTH,
    height: 220,
  },
  coverSlide: {
    width: SCREEN_WIDTH,
  },
  carouselContainer: {
    position: 'relative',
  },
  addPhotoButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    padding: staticTheme.spacing.lg,
    gap: staticTheme.spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leaderText: {
    fontSize: 13,
  },
  locationText: {
    fontSize: 13,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: staticTheme.spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  joinButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  section: {
    paddingHorizontal: staticTheme.spacing.lg,
    paddingVertical: staticTheme.spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 14,
  },
  bottomAction: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: staticTheme.spacing.lg,
    paddingVertical: staticTheme.spacing.md,
  },
  creatorActions: {
    flexDirection: 'row',
    gap: staticTheme.spacing.sm,
  },
  creatorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  creatorButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  addLeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  addLeaderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  imageViewerHeader: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imageViewerCloseButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageViewerCounter: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imageViewerSlide: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageViewerImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  leaderModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  leaderModal: {
    borderRadius: 16,
    padding: 16,
    maxHeight: '70%',
  },
  leaderModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  leaderList: {
    marginTop: 12,
  },
  leaderItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
});
