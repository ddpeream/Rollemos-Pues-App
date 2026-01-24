/**
 * 🎨 CREATE PARCHE MODAL - Modal para crear/editar parches
 * ========================================================
 * 
 * Modal elegante para crear nuevos parches o editar existentes.
 * Incluye validación, previsualización y manejo de estados de carga.
 * 
 * Features:
 * ✅ Formulario completo con validación
 * ✅ Selección múltiple de disciplinas
 * ✅ Picker de ciudades con sugerencias
 * ✅ Información de contacto opcional
 * ✅ Estados de carga y error
 * ✅ Diseño consistente con el tema
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../store/useAppStore';
import { spacing, typography, borderRadius } from '../theme';
import { validatePatchData } from '../utils/parches';

// Disciplinas disponibles
const DISCIPLINAS_DISPONIBLES = [
  { id: 'street', label: 'Street', icon: 'bicycle' },
  { id: 'park', label: 'Park', icon: 'basketball' },
  { id: 'slalom', label: 'Slalom', icon: 'speedometer' },
  { id: 'downhill', label: 'Downhill', icon: 'triangle-outline' },
  { id: 'freestyle', label: 'Freestyle', icon: 'star' },
  { id: 'longboard', label: 'Longboard', icon: 'trending-up' },
];

// Ciudades sugeridas (se pueden expandir)
const CIUDADES_SUGERIDAS = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
  'Bucaramanga', 'Pereira', 'Manizales', 'Ibagué', 'Pasto'
];

export default function CreateParcheModal({
  visible,
  onClose,
  onSubmit,
  usuario,
  editData = null, // Si se pasa, es modo edición
}) {
  const { theme } = useTheme();
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    ciudad: '',
    disciplinas: [],
    foto: '',
    fotoLocal: false,
    miembros_aprox: '',
    contacto: {
      correo: '',
      instagram: '',
      telefono: ''
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [showCiudadesSugeridas, setShowCiudadesSugeridas] = useState(false);

  // Efecto para cargar datos en modo edición
  useEffect(() => {
    if (editData && visible) {
      setFormData({
        nombre: editData.nombre || '',
        descripcion: editData.descripcion || '',
        ciudad: editData.ciudad || '',
        disciplinas: editData.disciplinas || [],
        foto: editData.foto || '',
        fotoLocal: false, // Foto existente no es local
        miembros_aprox: editData.miembros_aprox?.toString() || '',
        contacto: {
          correo: editData.contacto?.correo || '',
          instagram: editData.contacto?.instagram || '',
          telefono: editData.contacto?.telefono || ''
        }
      });
    } else if (visible && !editData) {
      // Resetear formulario para nuevo parche
      setFormData({
        nombre: '',
        descripcion: '',
        ciudad: '',
        disciplinas: [],
        foto: '',
        fotoLocal: false,
        miembros_aprox: '',
        contacto: {
          correo: '',
          instagram: '',
          telefono: ''
        }
      });
    }
    setErrors([]);
  }, [editData, visible]);

  // Memoized styles
  const styles = useMemo(() => StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    keyboard: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '95%',
      maxHeight: '90%',
      backgroundColor: theme.colors.background.primary,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.glass.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.glass.border,
    },
    title: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.text.primary,
      flex: 1,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.glass.background,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.glass.border,
    },
    scrollContent: {
      padding: spacing.lg,
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
      color: theme.colors.text.primary,
      marginBottom: spacing.sm,
    },
    input: {
      backgroundColor: theme.colors.background.surface,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: theme.colors.text.primary,
      borderWidth: 1,
      borderColor: theme.colors.glass.border,
      fontSize: typography.fontSize.md,
      minHeight: 48,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    disciplinasContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    disciplinaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.round,
      borderWidth: 1.5,
      gap: spacing.xs,
    },
    disciplinaChipSelected: {
      backgroundColor: theme.colors.alpha.primary15,
      borderColor: theme.colors.primary,
    },
    disciplinaChipUnselected: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.glass.border,
    },
    disciplinaText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
    },
    disciplinaTextSelected: {
      color: theme.colors.primary,
    },
    disciplinaTextUnselected: {
      color: theme.colors.text.secondary,
    },
    ciudadesSugeridas: {
      backgroundColor: theme.colors.background.surface,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.glass.border,
      marginTop: spacing.xs,
      maxHeight: 120,
    },
    ciudadSugerida: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.glass.border,
    },
    ciudadSugeridaText: {
      color: theme.colors.text.primary,
      fontSize: typography.fontSize.md,
    },
    contactoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    contactoIcon: {
      width: 24,
    },
    contactoInput: {
      flex: 1,
    },
    errorContainer: {
      backgroundColor: '#FEF2F2',
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: '#FECACA',
    },
    errorText: {
      color: '#DC2626',
      fontSize: typography.fontSize.sm,
      marginBottom: spacing.xs,
    },
    footer: {
      flexDirection: 'row',
      padding: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.glass.border,
      gap: spacing.md,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.glass.border,
      alignItems: 'center',
    },
    cancelText: {
      color: theme.colors.text.secondary,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
    },
    submitButton: {
      flex: 2,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitText: {
      color: '#000',
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    helpText: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginTop: spacing.xs,
      fontStyle: 'italic',
    },
  }), [theme]);

  // Handlers
  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateContacto = (field, value) => {
    setFormData(prev => ({
      ...prev,
      contacto: {
        ...prev.contacto,
        [field]: value
      }
    }));
  };

  const toggleDisciplina = (disciplinaId) => {
    setFormData(prev => ({
      ...prev,
      disciplinas: prev.disciplinas.includes(disciplinaId)
        ? prev.disciplinas.filter(d => d !== disciplinaId)
        : [...prev.disciplinas, disciplinaId]
    }));
  };

  const selectCiudadSugerida = (ciudad) => {
    updateFormData('ciudad', ciudad);
    setShowCiudadesSugeridas(false);
  };

  // Seleccionar imagen de galería
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
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        updateFormData('foto', asset.uri);
        updateFormData('fotoLocal', true); // Marcar que es imagen local
        console.log('✅ Imagen seleccionada para parche:', asset.uri);
      }
    } catch (error) {
      console.error('❌ Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Tomar foto con cámara
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Necesitamos acceso a tu cámara para tomar fotos.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        updateFormData('foto', asset.uri);
        updateFormData('fotoLocal', true);
        console.log('✅ Foto tomada para parche:', asset.uri);
      }
    } catch (error) {
      console.error('❌ Error tomando foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Validar datos
      const validation = validatePatchData(formData);
      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }

      setErrors([]);

      // Preparar datos para envío
      const patchData = {
        ...formData,
        miembros_aprox: parseInt(formData.miembros_aprox) || 1,
        // Limpiar contacto vacío
        contacto: Object.fromEntries(
          Object.entries(formData.contacto).filter(([_, value]) => value.trim())
        )
      };

      // Llamar función de submit del padre
      await onSubmit(patchData);
      
      // Cerrar modal solo si no hay errores
      onClose();
      
    } catch (error) {
      console.error('Error en submit:', error);
      setErrors([error.message || 'Error al guardar el parche']);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.nombre.trim().length >= 3;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboard}
        >
          <TouchableOpacity style={styles.modalContainer} onPress={() => {}} activeOpacity={1}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {editData ? 'Editar Parche' : 'Crear Nuevo Parche'}
            </Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
              disabled={loading}
            >
              <Ionicons name="close" size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.helpText, { marginTop: spacing.md }]}>
                {editData ? 'Guardando cambios...' : 'Creando parche...'}
              </Text>
            </View>
          ) : (
            <>
              {/* Contenido del formulario */}
              <ScrollView 
                style={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                {/* Errores */}
                {errors.length > 0 && (
                  <View style={styles.errorContainer}>
                    {errors.map((error, index) => (
                      <Text key={index} style={styles.errorText}>• {error}</Text>
                    ))}
                  </View>
                )}

                {/* Información básica */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Información Básica</Text>
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Nombre del parche"
                    placeholderTextColor={theme.colors.text.secondary}
                    value={formData.nombre}
                    onChangeText={(value) => updateFormData('nombre', value)}
                    maxLength={100}
                  />
                  
                  <TextInput
                    style={[styles.input, styles.textArea, { marginTop: spacing.sm }]}
                    placeholder="Descripción del parche (opcional)"
                    placeholderTextColor={theme.colors.text.secondary}
                    value={formData.descripcion}
                    onChangeText={(value) => updateFormData('descripcion', value)}
                    multiline
                    maxLength={500}
                  />
                  
                  <View style={{ marginTop: spacing.sm }}>
                    <TextInput
                      style={styles.input}
                      placeholder="Ciudad"
                      placeholderTextColor={theme.colors.text.secondary}
                      value={formData.ciudad}
                      onChangeText={(value) => {
                        updateFormData('ciudad', value);
                        setShowCiudadesSugeridas(true);
                      }}
                      onFocus={() => setShowCiudadesSugeridas(true)}
                    />
                    
                    {showCiudadesSugeridas && formData.ciudad.length > 0 && (
                      <View style={styles.ciudadesSugeridas}>
                        <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                          {CIUDADES_SUGERIDAS
                            .filter(ciudad => 
                              ciudad.toLowerCase().includes(formData.ciudad.toLowerCase())
                            )
                            .map((ciudad) => (
                              <TouchableOpacity
                                key={ciudad}
                                style={styles.ciudadSugerida}
                                onPress={() => selectCiudadSugerida(ciudad)}
                              >
                                <Text style={styles.ciudadSugeridaText}>{ciudad}</Text>
                              </TouchableOpacity>
                            ))
                          }
                        </ScrollView>
                      </View>
                    )}
                    
                    {/* Mostrar todas las ciudades cuando el campo está vacío y enfocado */}
                    {showCiudadesSugeridas && formData.ciudad.length === 0 && (
                      <View style={styles.ciudadesSugeridas}>
                        <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                          {CIUDADES_SUGERIDAS.map((ciudad) => (
                            <TouchableOpacity
                              key={ciudad}
                              style={styles.ciudadSugerida}
                              onPress={() => selectCiudadSugerida(ciudad)}
                            >
                              <Text style={styles.ciudadSugeridaText}>{ciudad}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>

                {/* Disciplinas */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Disciplinas</Text>
                  <Text style={styles.helpText}>
                    Selecciona las disciplinas que practica tu parche
                  </Text>
                  
                  <View style={styles.disciplinasContainer}>
                    {DISCIPLINAS_DISPONIBLES.map((disciplina) => {
                      const isSelected = formData.disciplinas.includes(disciplina.id);
                      return (
                        <TouchableOpacity
                          key={disciplina.id}
                          style={[
                            styles.disciplinaChip,
                            isSelected ? styles.disciplinaChipSelected : styles.disciplinaChipUnselected
                          ]}
                          onPress={() => toggleDisciplina(disciplina.id)}
                        >
                          <Ionicons 
                            name={disciplina.icon} 
                            size={16} 
                            color={isSelected ? theme.colors.primary : theme.colors.text.secondary} 
                          />
                          <Text style={[
                            styles.disciplinaText,
                            isSelected ? styles.disciplinaTextSelected : styles.disciplinaTextUnselected
                          ]}>
                            {disciplina.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Detalles adicionales */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Detalles</Text>
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Número aproximado de miembros"
                    placeholderTextColor={theme.colors.text.secondary}
                    value={formData.miembros_aprox}
                    onChangeText={(value) => updateFormData('miembros_aprox', value.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>

                {/* Foto del parche */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Foto del parche (opcional)</Text>
                  
                  {formData.foto ? (
                    <View style={{ marginTop: spacing.sm }}>
                      <Image
                        source={{ uri: formData.foto }}
                        style={{
                          width: '100%',
                          height: 180,
                          borderRadius: borderRadius.lg,
                        }}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          borderRadius: 20,
                          padding: 8,
                        }}
                        onPress={() => {
                          updateFormData('foto', '');
                          updateFormData('fotoLocal', false);
                        }}
                      >
                        <Ionicons name="close" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          backgroundColor: theme.colors.background.surface,
                          borderRadius: borderRadius.md,
                          padding: spacing.lg,
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: theme.colors.glass.border,
                          borderStyle: 'dashed',
                        }}
                        onPress={selectImage}
                      >
                        <Ionicons name="images-outline" size={32} color={theme.colors.primary} />
                        <Text style={{ color: theme.colors.text.secondary, marginTop: spacing.xs }}>
                          Galería
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          backgroundColor: theme.colors.background.surface,
                          borderRadius: borderRadius.md,
                          padding: spacing.lg,
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: theme.colors.glass.border,
                          borderStyle: 'dashed',
                        }}
                        onPress={takePhoto}
                      >
                        <Ionicons name="camera-outline" size={32} color={theme.colors.primary} />
                        <Text style={{ color: theme.colors.text.secondary, marginTop: spacing.xs }}>
                          Cámara
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Contacto */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Información de Contacto</Text>
                  <Text style={styles.helpText}>
                    Información opcional para que otros skaters puedan contactarte
                  </Text>
                  
                  <View style={styles.contactoRow}>
                    <Ionicons name="mail" size={20} color={theme.colors.text.secondary} style={styles.contactoIcon} />
                    <TextInput
                      style={[styles.input, styles.contactoInput]}
                      placeholder="Correo electrónico"
                      placeholderTextColor={theme.colors.text.secondary}
                      value={formData.contacto.correo}
                      onChangeText={(value) => updateContacto('correo', value)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  
                  <View style={styles.contactoRow}>
                    <Ionicons name="logo-instagram" size={20} color={theme.colors.text.secondary} style={styles.contactoIcon} />
                    <TextInput
                      style={[styles.input, styles.contactoInput]}
                      placeholder="Instagram (sin @)"
                      placeholderTextColor={theme.colors.text.secondary}
                      value={formData.contacto.instagram}
                      onChangeText={(value) => updateContacto('instagram', value.replace('@', ''))}
                      autoCapitalize="none"
                    />
                  </View>
                  
                  <View style={styles.contactoRow}>
                    <Ionicons name="call" size={20} color={theme.colors.text.secondary} style={styles.contactoIcon} />
                    <TextInput
                      style={[styles.input, styles.contactoInput]}
                      placeholder="Teléfono (opcional)"
                      placeholderTextColor={theme.colors.text.secondary}
                      value={formData.contacto.telefono}
                      onChangeText={(value) => updateContacto('telefono', value)}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              </ScrollView>

              {/* Footer con botones */}
              <View style={styles.footer}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={onClose}
                  disabled={loading}
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.submitButton,
                    (!isFormValid || loading) && styles.submitButtonDisabled
                  ]}
                  onPress={handleSubmit}
                  disabled={!isFormValid || loading}
                >
                  <Ionicons 
                    name={editData ? "checkmark-circle" : "add-circle"} 
                    size={20} 
                    color="#000" 
                  />
                  <Text style={styles.submitText}>
                    {editData ? 'Guardar Cambios' : 'Crear Parche'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}


