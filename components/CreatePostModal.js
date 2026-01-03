/**
 * MODAL PARA CREAR NUEVO POST
 * Componente elegante con selector de imagen, descripción y ubicación
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../store/useAppStore';
import { spacing, typography, borderRadius } from '../theme';
import { searchPlaces } from '../services/rodadas';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CreatePostModal = ({ 
  visible, 
  onClose, 
  onSubmit, 
  usuario 
}) => {
  const { theme, isDark } = useTheme();
  const [imagen, setImagen] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState(0.75);
  
  // Estados para Places API
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  // Buscar lugares con debounce
  const searchLocationDebounced = useCallback(async (query) => {
    if (!query || query.length < 3) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }

    setSearchingLocation(true);
    try {
      const results = await searchPlaces(query, { country: 'co' });
      setLocationSuggestions(results);
      setShowLocationSuggestions(results.length > 0);
    } catch (error) {
      console.error('Error buscando ubicación:', error);
    } finally {
      setSearchingLocation(false);
    }
  }, []);

  // Manejar cambio de ubicación con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      searchLocationDebounced(ubicacion);
    }, 300);
    return () => clearTimeout(timer);
  }, [ubicacion, searchLocationDebounced]);

  // Seleccionar ubicación de la lista
  const selectLocation = (place) => {
    setUbicacion(place.mainText || place.description);
    setShowLocationSuggestions(false);
    setLocationSuggestions([]);
  };

  // Reset del estado cuando se cierra
  const handleClose = () => {
    setImagen(null);
    setDescripcion('');
    setUbicacion('');
    setLoading(false);
    setImageAspectRatio(0.75);
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);
    onClose();
  };

  // Seleccionar imagen
  const selectImage = async () => {
    try {
      // Pedir permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Necesitamos acceso a tu galería para seleccionar fotos.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Seleccionar imagen
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
        aspect: undefined,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        if (!asset.uri) {
          throw new Error('La imagen seleccionada no tiene URI válida');
        }
        
        setImagen(asset.uri);
        const aspectRatio = asset.width / asset.height;
        setImageAspectRatio(aspectRatio);
        
        console.log('✅ Imagen seleccionada');
      }
    } catch (error) {
      Alert.alert('Error', `No se pudo seleccionar la imagen: ${error.message}`);
    }
  };

  // Tomar foto
  const takePhoto = async () => {
    try {
      // Pedir permisos
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Necesitamos acceso a tu cámara para tomar fotos.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Tomar foto
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.85,
        aspect: undefined,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        if (!asset.uri) {
          throw new Error('La foto capturada no tiene URI válida');
        }
        
        setImagen(asset.uri);
        const aspectRatio = asset.width / asset.height;
        setImageAspectRatio(aspectRatio);
        
        console.log('✅ Foto capturada');
      }
    } catch (error) {
      Alert.alert('Error', `No se pudo tomar la foto: ${error.message}`);
    }
  };

  // Mostrar opciones de imagen
  const showImageOptions = () => {
    Alert.alert(
      'Seleccionar foto',
      'Elige una opción',
      [
        { text: 'Galería', onPress: selectImage },
        { text: 'Cámara', onPress: takePhoto },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  // Enviar post
  const handleSubmit = async () => {
    // Validaciones
    if (!imagen) {
      Alert.alert('Error', 'Debes seleccionar una imagen');
      return;
    }

    if (!descripcion.trim()) {
      Alert.alert('Error', 'Debes agregar una descripción');
      return;
    }

    setLoading(true);

    try {
      const postData = {
        usuario_id: usuario.id,
        imagen,
        descripcion: descripcion.trim(),
        ubicacion: ubicacion.trim() || null,
        aspect_ratio: imageAspectRatio
      };

      const result = await onSubmit(postData);
      
      if (result && result.success) {
        Alert.alert('Éxito', 'Post publicado correctamente');
        handleClose();
      } else {
        const errorMsg = result?.error || 'Error desconocido';
        Alert.alert('Error', `No se pudo publicar: ${errorMsg}`);
      }
    } catch (error) {
      Alert.alert('Error', `Error: ${error.message || 'Intenta nuevamente'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      console.log('🟢 CreatePostModal ABIERTO', { imagen: !!imagen, descripcion: descripcion.length, usuario: usuario?.id });
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView 
        style={[styles.safeContainer, { backgroundColor: theme.colors.background.primary }]}
        edges={['top', 'left', 'right']}
      >
        <KeyboardAvoidingView 
          style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent={false} />
          
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.glass.border }]}>
          <TouchableOpacity 
            onPress={handleClose} 
            style={styles.cancelButton}
            disabled={loading}
          >
            <Text style={[styles.cancelText, { color: theme.colors.text.secondary }]}>
              Cancelar
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Nuevo Post
          </Text>
          
          <TouchableOpacity 
            onPress={handleSubmit} 
            style={[
              styles.submitButton, 
              { 
                backgroundColor: (!imagen || !descripcion.trim() || loading) ? '#ccc' : theme.colors.primary
              }
            ]}
            disabled={!imagen || !descripcion.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.onPrimary} size="small" />
            ) : (
              <Text style={[styles.submitText, { color: (!imagen || !descripcion.trim() || loading) ? '#666' : theme.colors.onPrimary }]}>
                Publicar
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Selector de Imagen */}
          <TouchableOpacity 
            style={[styles.imageSelector, { borderColor: theme.colors.glass.border }]}
            onPress={showImageOptions}
            disabled={loading}
          >
            {imagen ? (
              <View style={styles.selectedImageContainer}>
                <Image 
                  source={{ uri: imagen }} 
                  style={[
                    styles.selectedImage,
                    { aspectRatio: imageAspectRatio }
                  ]}
                  resizeMode="cover"
                />
                <TouchableOpacity 
                  style={styles.changeImageButton}
                  onPress={showImageOptions}
                  disabled={loading}
                >
                  <Ionicons name="camera" size={20} color={theme.colors.onSecondary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons 
                  name="camera-outline" 
                  size={48} 
                  color={theme.colors.text.secondary} 
                />
                <Text style={[styles.placeholderText, { color: theme.colors.text.secondary }]}>
                  Toca para seleccionar una foto
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Campos de Texto */}
          <View style={styles.form}>
            {/* Usuario Info */}
            {usuario && (
              <View style={styles.userRow}>
                <Image 
                  source={{ uri: usuario?.avatar_url || 'https://via.placeholder.com/40' }} 
                  style={styles.userAvatar}
                />
                <Text style={[styles.userName, { color: theme.colors.text.primary }]}>
                  {usuario?.nombre || 'Usuario'}
                </Text>
              </View>
            )}

            {/* Descripción */}
            <TextInput
              style={[
                styles.textInput, 
                styles.descriptionInput,
                { 
                  color: theme.colors.text.primary, 
                  borderColor: theme.colors.glass.border,
                  backgroundColor: theme.colors.background.surface
                }
              ]}
              placeholder="Escribe una descripción..."
              placeholderTextColor={theme.colors.text.secondary}
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              maxLength={500}
              textAlignVertical="top"
              editable={!loading}
            />
            <Text style={[styles.charCount, { color: theme.colors.text.secondary }]}>
              {descripcion.length}/500
            </Text>

            {/* Ubicación con autocompletado */}
            <View style={styles.locationContainer}>
              <View style={styles.inputContainer}>
                <Ionicons 
                  name="location-outline" 
                  size={20} 
                  color={theme.colors.text.secondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.textInput,
                    { 
                      color: theme.colors.text.primary, 
                      borderColor: theme.colors.glass.border,
                      backgroundColor: theme.colors.background.surface,
                      flex: 1
                    }
                  ]}
                  placeholder="Agregar ubicación (opcional)"
                  placeholderTextColor={theme.colors.text.secondary}
                  value={ubicacion}
                  onChangeText={setUbicacion}
                  maxLength={100}
                  editable={!loading}
                />
                {searchingLocation && (
                  <ActivityIndicator 
                    size="small" 
                    color={theme.colors.primary} 
                    style={styles.searchingIndicator}
                  />
                )}
              </View>
              
              {/* Lista de sugerencias */}
              {showLocationSuggestions && locationSuggestions.length > 0 && (
                <View style={[
                  styles.suggestionsContainer,
                  { 
                    backgroundColor: theme.colors.background.surface,
                    borderColor: theme.colors.glass.border 
                  }
                ]}>
                  {locationSuggestions.map((place, index) => (
                    <TouchableOpacity
                      key={place.placeId || index}
                      style={[
                        styles.suggestionItem,
                        index < locationSuggestions.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: theme.colors.glass.border
                        }
                      ]}
                      onPress={() => selectLocation(place)}
                    >
                      <Ionicons 
                        name="location" 
                        size={16} 
                        color={theme.colors.primary}
                        style={styles.suggestionIcon}
                      />
                      <View style={styles.suggestionText}>
                        <Text 
                          style={[styles.suggestionMain, { color: theme.colors.text.primary }]}
                          numberOfLines={1}
                        >
                          {place.mainText}
                        </Text>
                        {place.secondaryText && (
                          <Text 
                            style={[styles.suggestionSecondary, { color: theme.colors.text.secondary }]}
                            numberOfLines={1}
                          >
                            {place.secondaryText}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '400',
  },
  title: {
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: spacing.base,
  },
  imageSelector: {
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  selectedImageContainer: {
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    minHeight: 200,
  },
  changeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    gap: spacing.base,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.sm,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    fontSize: 16,
  },
  descriptionInput: {
    height: 120,
    paddingTop: spacing.sm,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputIcon: {
    marginLeft: 4,
  },
  searchingIndicator: {
    marginRight: 8,
  },
  locationContainer: {
    position: 'relative',
    zIndex: 10,
  },
  suggestionsContainer: {
    marginTop: 4,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    maxHeight: 200,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  suggestionIcon: {
    marginRight: 8,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionMain: {
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionSecondary: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default CreatePostModal;