/**
 * ?? CREATE COMUNIDAD MODAL
 *
 * Modal sencillo para crear comunidades.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../store/useAppStore';

const CreateComunidadModal = ({ visible, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  // Tag keys for i18n (the actual values stored remain in Spanish for DB consistency)
  const tagKeys = [
    { key: 'street', value: 'Street' },
    { key: 'urbano', value: 'Urbano' },
    { key: 'freestyle', value: 'Freestyle' },
    { key: 'slalom', value: 'Slalom' },
    { key: 'downhill', value: 'Downhill' },
    { key: 'fitness', value: 'Fitness' },
    { key: 'ruta', value: 'Ruta' },
    { key: 'aprendizaje', value: 'Aprendizaje' },
    { key: 'nocturna', value: 'Nocturna' },
  ];

  const resetForm = () => {
    setNombre('');
    setDescripcion('');
    setCiudad('');
    setSelectedImages([]);
    setCoverIndex(0);
    setSelectedTags([]);
    setIsPublic(true);
  };

  const handlePickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 6,
        quality: 0.85,
      });

      if (!result.canceled && result.assets.length > 0) {
        const nextImages = result.assets.map((asset) => asset.uri);
        setSelectedImages(nextImages);
        setCoverIndex(0);
      }
    } catch (error) {
      // ignore
    }
  };

  const handleRemoveImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== index));
    setCoverIndex((prev) => {
      if (index === prev) return 0;
      if (index < prev) return prev - 1;
      return prev;
    });
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((item) => item !== tag);
      }
      return [...prev, tag];
    });
  };

  const handleCreate = async () => {
    if (!nombre.trim()) return;

    setLoading(true);
    try {
      await onSubmit?.({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        ciudad: ciudad.trim(),
        foto: null,
        tags: selectedTags.length > 0 ? selectedTags : null,
        isPublic,
        imagenes: selectedImages,
        coverIndex,
      });
      resetForm();
      onClose?.();
    } finally {
      setLoading(false);
    }
  };

  const glassBackground = isDark
    ? 'rgba(12, 16, 24, 0.95)'
    : 'rgba(255, 255, 255, 0.98)';
  const glassBorder = isDark
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(0, 0, 0, 0.08)';
  const inputBackground = isDark
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(15, 23, 42, 0.04)';
  const inputBorder = isDark
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(15, 23, 42, 0.12)';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 20}
          style={styles.keyboardWrapper}
        >
          <TouchableOpacity
            style={[styles.modalContent, { backgroundColor: glassBackground, borderColor: glassBorder }]}
            activeOpacity={1}
            onPress={() => {}}
          >
          <View style={[styles.header, { borderBottomColor: glassBorder }]}
          >
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
              {t('components.createComunidadModal.title')}
            </Text>
            <TouchableOpacity
              onPress={handleCreate}
              disabled={!nombre.trim() || loading}
              style={[
                styles.createButton,
                { backgroundColor: nombre.trim() ? theme.colors.primary : theme.colors.border },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.createButtonText}>{t('components.createComunidadModal.create')}</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.form}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                {t('components.createComunidadModal.photos')}
              </Text>
              <TouchableOpacity
                style={[
                  styles.photoActionButton,
                  { borderColor: inputBorder, backgroundColor: inputBackground },
                ]}
                onPress={handlePickImages}
              >
                <Ionicons name="image-outline" size={18} color={theme.colors.text.primary} />
                <Text style={[styles.photoActionText, { color: theme.colors.text.primary }]}>
                  {t('components.createComunidadModal.selectFromGallery')}
                </Text>
              </TouchableOpacity>
              {selectedImages.length > 0 && (
                <View style={styles.photoGrid}>
                  {selectedImages.map((uri, index) => {
                    const isCover = coverIndex === index;
                    return (
                      <TouchableOpacity
                        key={`${uri}-${index}`}
                        style={[
                          styles.photoOption,
                          { borderColor: isCover ? theme.colors.primary : inputBorder },
                        ]}
                        onPress={() => setCoverIndex(index)}
                      >
                        <Image source={{ uri }} style={styles.photoOptionImage} />
                        {isCover && (
                          <View
                            style={[
                              styles.photoOptionOverlay,
                              { backgroundColor: theme.colors.primary },
                            ]}
                          >
                            <Text style={styles.photoCoverText}>{t('components.createComunidadModal.cover')}</Text>
                          </View>
                        )}
                        <TouchableOpacity
                          style={styles.photoRemoveButton}
                          onPress={() => handleRemoveImage(index)}
                        >
                          <Ionicons name="close" size={12} color="#fff" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>{t('components.createComunidadModal.nameLabel')}</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: inputBackground, borderColor: inputBorder, color: theme.colors.text.primary },
                ]}
                placeholder={t('components.createComunidadModal.namePlaceholder')}
                placeholderTextColor={theme.colors.text.secondary}
                value={nombre}
                onChangeText={setNombre}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>{t('components.createComunidadModal.descriptionLabel')}</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: inputBackground, borderColor: inputBorder, color: theme.colors.text.primary },
                ]}
                placeholder={t('components.createComunidadModal.descriptionPlaceholder')}
                placeholderTextColor={theme.colors.text.secondary}
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>{t('components.createComunidadModal.cityLabel')}</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: inputBackground, borderColor: inputBorder, color: theme.colors.text.primary },
                ]}
                placeholder={t('components.createComunidadModal.cityPlaceholder')}
                placeholderTextColor={theme.colors.text.secondary}
                value={ciudad}
                onChangeText={setCiudad}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                {t('components.createComunidadModal.tagsLabel')}
              </Text>
              <View style={styles.tagsGrid}>
                {tagKeys.map((tag) => {
                  const selected = selectedTags.includes(tag.value);
                  return (
                    <TouchableOpacity
                      key={tag.key}
                      style={[
                        styles.tagButton,
                        {
                          backgroundColor: selected ? theme.colors.primary : inputBackground,
                          borderColor: selected ? theme.colors.primary : inputBorder,
                        },
                      ]}
                      onPress={() => toggleTag(tag.value)}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          { color: selected ? theme.colors.onPrimary : theme.colors.text.primary },
                        ]}
                      >
                        {t(`components.createComunidadModal.tags.${tag.key}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                {t('components.createComunidadModal.privacyLabel')}
              </Text>
              <View style={styles.privacyRow}>
                <TouchableOpacity
                  style={[
                    styles.privacyOption,
                    {
                      backgroundColor: isPublic ? theme.colors.primary : inputBackground,
                      borderColor: isPublic ? theme.colors.primary : inputBorder,
                    },
                  ]}
                  onPress={() => setIsPublic(true)}
                >
                  <Text
                    style={[
                      styles.privacyText,
                      { color: isPublic ? theme.colors.onPrimary : theme.colors.text.primary },
                    ]}
                  >
                    {t('components.createComunidadModal.public')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.privacyOption,
                    {
                      backgroundColor: !isPublic ? theme.colors.primary : inputBackground,
                      borderColor: !isPublic ? theme.colors.primary : inputBorder,
                    },
                  ]}
                  onPress={() => setIsPublic(false)}
                >
                  <Text
                    style={[
                      styles.privacyText,
                      { color: !isPublic ? theme.colors.onPrimary : theme.colors.text.primary },
                    ]}
                  >
                    {t('components.createComunidadModal.private')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
  },
  keyboardWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  createButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    minWidth: 70,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  form: {
    paddingHorizontal: 16,
  },
  formContent: {
    paddingVertical: 16,
    gap: 12,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  photoActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 8,
  },
  photoOption: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
  },
  photoOptionImage: {
    width: '100%',
    height: '100%',
  },
  photoOptionOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCoverText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  photoRemoveButton: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagButton: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  privacyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  privacyOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  privacyText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default CreateComunidadModal;
