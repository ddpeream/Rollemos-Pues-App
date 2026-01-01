/**
 * 🛹 DETALLE PARCHE - Vista completa de un crew/parche
 * =====================================================
 * 
 * Muestra información completa del parche con:
 * - Carrusel de imágenes
 * - Información del grupo
 * - Lista de miembros
 * - Botón de unirse/salirse
 * - Contacto e información adicional
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import useAppStore from '../store/useAppStore';
import { useParches } from '../hooks/useParches';
import { spacing, typography, borderRadius } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 280;

export default function DetalleParche() {
  console.log('🚀 DetalleParche MONTADO');
  
  const navigation = useNavigation();
  const route = useRoute();
  const { parcheId } = route.params || {};
  
  console.log('📦 Route params:', route.params);
  console.log('🆔 parcheId:', parcheId);
  
  const { theme, user } = useAppStore();
  const { 
    loadParche, 
    joinParche, 
    leaveParche, 
    addParcheImages,
    refreshParches 
  } = useParches();
  
  const [parche, setParche] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  const carouselRef = useRef(null);

  // Cargar datos del parche
  const fetchParche = useCallback(async () => {
    if (!parcheId) {
      setLoading(false);
      return;
    }
    
    try {
      const result = await loadParche(parcheId);
      if (result.success) {
        setParche(result.data);
      } else {
        Alert.alert('Error', 'No se pudo cargar el parche');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error cargando parche:', error);
      Alert.alert('Error', 'No se pudo cargar el parche');
    } finally {
      setLoading(false);
    }
  }, [parcheId, loadParche, navigation]);

  useEffect(() => {
    fetchParche();
  }, [fetchParche]);

  // Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchParche();
    setRefreshing(false);
  };

  // Verificar si el usuario es miembro
  const isMember = parche?.miembros?.some(m => m.usuario_id === user?.id);
  const isCreator = parche?.created_by === user?.id;

  // Unirse al parche
  const handleJoin = async () => {
    if (!user) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para unirte a un parche');
      return;
    }

    setJoining(true);
    try {
      const result = await joinParche(parcheId);
      if (result.success) {
        Alert.alert('🎉 ¡Te uniste!', `Ahora eres parte de "${parche.nombre}"`);
        await fetchParche(); // Recargar para actualizar miembros
      } else {
        Alert.alert('Error', result.error || 'No se pudo unir al parche');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo unir al parche');
    } finally {
      setJoining(false);
    }
  };

  // Salirse del parche
  const handleLeave = async () => {
    Alert.alert(
      'Salir del parche',
      `¿Seguro que quieres salir de "${parche.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            setJoining(true);
            try {
              const result = await leaveParche(parcheId);
              if (result.success) {
                Alert.alert('👋', 'Has salido del parche');
                await fetchParche();
              } else {
                Alert.alert('Error', result.error || 'No se pudo salir del parche');
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo salir del parche');
            } finally {
              setJoining(false);
            }
          }
        }
      ]
    );
  };

  // Seleccionar múltiples imágenes
  const handleAddImages = async () => {
    if (!isCreator) {
      Alert.alert('Sin permisos', 'Solo el creador del parche puede agregar fotos');
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setUploadingImages(true);
        const imageUris = result.assets.map(asset => asset.uri);
        
        console.log(`📸 Subiendo ${imageUris.length} imágenes...`);
        const uploadResult = await addParcheImages(parcheId, imageUris);
        
        if (uploadResult.success) {
          Alert.alert('✅', `${imageUris.length} imagen(es) agregada(s)`);
          await fetchParche();
        } else {
          Alert.alert('Error', uploadResult.error || 'No se pudieron subir las imágenes');
        }
        setUploadingImages(false);
      }
    } catch (error) {
      console.error('Error seleccionando imágenes:', error);
      setUploadingImages(false);
    }
  };

  // Obtener todas las imágenes del parche
  const getAllImages = () => {
    const images = [];
    
    // Imagen principal
    if (parche?.foto) {
      images.push(parche.foto);
    }
    
    // Imágenes adicionales del array
    if (parche?.fotos && Array.isArray(parche.fotos)) {
      images.push(...parche.fotos);
    }
    
    // Si no hay imágenes, usar placeholder
    if (images.length === 0) {
      images.push('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800');
    }
    
    return images;
  };

  // Render imagen del carrusel
  const renderCarouselImage = ({ item, index }) => (
    <Image
      source={{ uri: item }}
      style={styles.carouselImage}
      resizeMode="cover"
    />
  );

  // Manejar scroll del carrusel
  const onCarouselScroll = (event) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentImageIndex(slideIndex);
  };

  // Abrir contacto
  const handleContact = (type, value) => {
    if (!value) return;
    
    switch (type) {
      case 'instagram':
        Linking.openURL(`https://instagram.com/${value}`);
        break;
      case 'correo':
        Linking.openURL(`mailto:${value}`);
        break;
      case 'telefono':
        Linking.openURL(`tel:${value}`);
        break;
    }
  };

  // Formatear disciplinas
  const formatDisciplinas = (disciplinas) => {
    if (!disciplinas) return [];
    if (typeof disciplinas === 'string') {
      return disciplinas.split(',').map(d => d.trim());
    }
    return Array.isArray(disciplinas) ? disciplinas : [];
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
          Cargando parche...
        </Text>
      </View>
    );
  }

  if (!parche) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background.primary }]}>
        <Ionicons name="alert-circle-outline" size={60} color={theme.colors.text.tertiary} />
        <Text style={[styles.errorText, { color: theme.colors.text.secondary }]}>
          No se encontró el parche
        </Text>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = getAllImages();
  const disciplinas = formatDisciplinas(parche.disciplinas);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header flotante */}
      <View style={styles.floatingHeader}>
        <TouchableOpacity 
          style={[styles.headerButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        {isCreator && (
          <TouchableOpacity 
            style={[styles.headerButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
            onPress={handleAddImages}
            disabled={uploadingImages}
          >
            {uploadingImages ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera-outline" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Carrusel de imágenes */}
        <View style={styles.carouselContainer}>
          <FlatList
            ref={carouselRef}
            data={images}
            renderItem={renderCarouselImage}
            keyExtractor={(item, index) => `image-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onCarouselScroll}
            scrollEventThrottle={16}
          />
          
          {/* Indicadores de página */}
          {images.length > 1 && (
            <View style={styles.paginationContainer}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    currentImageIndex === index && styles.paginationDotActive,
                    { backgroundColor: currentImageIndex === index ? '#fff' : 'rgba(255,255,255,0.5)' }
                  ]}
                />
              ))}
            </View>
          )}
          
          {/* Contador de imágenes */}
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {currentImageIndex + 1} / {images.length}
            </Text>
          </View>
        </View>

        {/* Contenido */}
        <View style={[styles.content, { backgroundColor: theme.colors.background.primary }]}>
          {/* Header del parche */}
          <View style={styles.parcheHeader}>
            <View style={styles.parcheInfo}>
              <Text style={[styles.parcheName, { color: theme.colors.text.primary }]}>
                {parche.nombre}
              </Text>
              
              {parche.ciudad && (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={16} color={theme.colors.text.secondary} />
                  <Text style={[styles.locationText, { color: theme.colors.text.secondary }]}>
                    {parche.ciudad}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Badge de miembros */}
            <View style={[styles.membersBadge, { backgroundColor: theme.colors.alpha.primary15 }]}>
              <Ionicons name="people" size={18} color={theme.colors.primary} />
              <Text style={[styles.membersCount, { color: theme.colors.primary }]}>
                {parche.miembros?.length || parche.miembros_aprox || 0}
              </Text>
            </View>
          </View>

          {/* Disciplinas */}
          {disciplinas.length > 0 && (
            <View style={styles.disciplinasContainer}>
              {disciplinas.map((disc, index) => (
                <View 
                  key={index} 
                  style={[styles.disciplinaChip, { 
                    backgroundColor: theme.colors.alpha.primary15,
                    borderColor: theme.colors.primary 
                  }]}
                >
                  <Text style={[styles.disciplinaText, { color: theme.colors.primary }]}>
                    {disc}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Descripción */}
          {parche.descripcion && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Acerca del parche
              </Text>
              <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
                {parche.descripcion}
              </Text>
            </View>
          )}

          {/* Creador */}
          {parche.usuario_creador && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Fundador
              </Text>
              <TouchableOpacity 
                style={[styles.creatorCard, { 
                  backgroundColor: theme.colors.glass.background,
                  borderColor: theme.colors.border 
                }]}
                onPress={() => navigation.navigate('PerfilUsuario', { userId: parche.usuario_creador.id })}
              >
                <Image
                  source={{ uri: parche.usuario_creador.avatar_url || 'https://i.pravatar.cc/100' }}
                  style={styles.creatorAvatar}
                />
                <View style={styles.creatorInfo}>
                  <Text style={[styles.creatorName, { color: theme.colors.text.primary }]}>
                    {parche.usuario_creador.nombre}
                  </Text>
                  <Text style={[styles.creatorRole, { color: theme.colors.text.tertiary }]}>
                    Creador del parche
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Contacto */}
          {parche.contacto && Object.keys(parche.contacto).length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Contacto
              </Text>
              
              <View style={styles.contactGrid}>
                {parche.contacto.instagram && (
                  <TouchableOpacity 
                    style={[styles.contactItem, { backgroundColor: theme.colors.glass.background }]}
                    onPress={() => handleContact('instagram', parche.contacto.instagram)}
                  >
                    <Ionicons name="logo-instagram" size={24} color="#E4405F" />
                    <Text style={[styles.contactText, { color: theme.colors.text.secondary }]}>
                      @{parche.contacto.instagram}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {parche.contacto.correo && (
                  <TouchableOpacity 
                    style={[styles.contactItem, { backgroundColor: theme.colors.glass.background }]}
                    onPress={() => handleContact('correo', parche.contacto.correo)}
                  >
                    <Ionicons name="mail" size={24} color={theme.colors.primary} />
                    <Text style={[styles.contactText, { color: theme.colors.text.secondary }]} numberOfLines={1}>
                      {parche.contacto.correo}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {parche.contacto.telefono && (
                  <TouchableOpacity 
                    style={[styles.contactItem, { backgroundColor: theme.colors.glass.background }]}
                    onPress={() => handleContact('telefono', parche.contacto.telefono)}
                  >
                    <Ionicons name="call" size={24} color="#25D366" />
                    <Text style={[styles.contactText, { color: theme.colors.text.secondary }]}>
                      {parche.contacto.telefono}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Miembros */}
          {parche.miembros && parche.miembros.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Miembros ({parche.miembros.length})
              </Text>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.membersScroll}
              >
                {parche.miembros.slice(0, 10).map((miembro, index) => (
                  <TouchableOpacity 
                    key={miembro.id || index}
                    style={styles.memberItem}
                    onPress={() => navigation.navigate('PerfilUsuario', { userId: miembro.usuario_id })}
                  >
                    <Image
                      source={{ uri: miembro.usuario?.avatar_url || 'https://i.pravatar.cc/100' }}
                      style={styles.memberAvatar}
                    />
                    <Text 
                      style={[styles.memberName, { color: theme.colors.text.secondary }]}
                      numberOfLines={1}
                    >
                      {miembro.usuario?.nombre?.split(' ')[0] || 'Usuario'}
                    </Text>
                  </TouchableOpacity>
                ))}
                
                {parche.miembros.length > 10 && (
                  <View style={styles.memberItem}>
                    <View style={[styles.moreMembersCircle, { backgroundColor: theme.colors.alpha.primary15 }]}>
                      <Text style={[styles.moreMembersText, { color: theme.colors.primary }]}>
                        +{parche.miembros.length - 10}
                      </Text>
                    </View>
                    <Text style={[styles.memberName, { color: theme.colors.text.tertiary }]}>
                      más
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {/* Espacio para el botón flotante */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Botón de acción flotante */}
      {user && !isCreator && (
        <View style={[styles.bottomAction, { backgroundColor: theme.colors.background.primary }]}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { 
                backgroundColor: isMember ? 'transparent' : theme.colors.primary,
                borderWidth: isMember ? 2 : 0,
                borderColor: theme.colors.primary 
              }
            ]}
            onPress={isMember ? handleLeave : handleJoin}
            disabled={joining}
          >
            {joining ? (
              <ActivityIndicator color={isMember ? theme.colors.primary : '#000'} />
            ) : (
              <>
                <Ionicons 
                  name={isMember ? "exit-outline" : "people"} 
                  size={22} 
                  color={isMember ? theme.colors.primary : '#000'} 
                />
                <Text style={[
                  styles.actionButtonText,
                  { color: isMember ? theme.colors.primary : '#000' }
                ]}>
                  {isMember ? 'Salir del parche' : 'Unirme al parche'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Mensaje para creador */}
      {isCreator && (
        <View style={[styles.bottomAction, { backgroundColor: theme.colors.background.primary }]}>
          <View style={[styles.creatorBanner, { backgroundColor: theme.colors.alpha.primary15 }]}>
            <Ionicons name="star" size={20} color={theme.colors.primary} />
            <Text style={[styles.creatorBannerText, { color: theme.colors.primary }]}>
              Eres el creador de este parche
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.lg,
    textAlign: 'center',
  },
  backButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  backButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  floatingHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselContainer: {
    height: IMAGE_HEIGHT,
    width: SCREEN_WIDTH,
  },
  carouselImage: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paginationDotActive: {
    width: 24,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  parcheHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  parcheInfo: {
    flex: 1,
  },
  parcheName: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: typography.fontSize.md,
  },
  membersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  membersCount: {
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
  },
  disciplinasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  disciplinaChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  disciplinaText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.md,
    lineHeight: 22,
  },
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  creatorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  creatorInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  creatorName: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  creatorRole: {
    fontSize: typography.fontSize.sm,
  },
  contactGrid: {
    gap: spacing.sm,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  contactText: {
    fontSize: typography.fontSize.md,
    flex: 1,
  },
  membersScroll: {
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  memberItem: {
    alignItems: 'center',
    width: 70,
  },
  memberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: spacing.xs,
  },
  memberName: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  moreMembersCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  moreMembersText: {
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  actionButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
  },
  creatorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  creatorBannerText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
});
