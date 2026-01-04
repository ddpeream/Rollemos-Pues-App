/**
 * 🛼 MODAL PARA CREAR RODADA
 * 
 * Formulario con búsqueda de lugares usando Google Places API
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../store/useAppStore';
import { useRodadas } from '../hooks/useRodadas';
import { useAuth } from '../hooks/useAuth';

// Debounce helper
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);
  
  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

const CreateRodadaModal = ({ visible, onClose, onSuccess, parcheId = null }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { 
    crearRodada, 
    buscarLugares, 
    obtenerDetallesLugar,
    placeSearchResults,
    isSearchingPlaces,
    limpiarBusquedaLugares,
    isLoading,
  } = useRodadas();

  // Estado del formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [periodo, setPeriodo] = useState('AM'); // AM o PM
  const [nivelRequerido, setNivelRequerido] = useState('todos');
  
  // Estado para búsqueda de lugares
  const [puntoSalidaQuery, setPuntoSalidaQuery] = useState('');
  const [puntoSalida, setPuntoSalida] = useState(null);
  const [showSalidaResults, setShowSalidaResults] = useState(false);
  
  const [puntoLlegadaQuery, setPuntoLlegadaQuery] = useState('');
  const [puntoLlegada, setPuntoLlegada] = useState(null);
  const [showLlegadaResults, setShowLlegadaResults] = useState(false);
  
  const [activeField, setActiveField] = useState(null); // 'salida' o 'llegada'

  // Debounced search
  const debouncedSearch = useDebounce((query) => {
    buscarLugares(query, { country: 'co' });
  }, 500);

  // Manejar cambio en input de salida
  const handleSalidaChange = (text) => {
    setPuntoSalidaQuery(text);
    setPuntoSalida(null);
    setActiveField('salida');
    setShowSalidaResults(true);
    debouncedSearch(text);
  };

  // Manejar cambio en input de llegada
  const handleLlegadaChange = (text) => {
    setPuntoLlegadaQuery(text);
    setPuntoLlegada(null);
    setActiveField('llegada');
    setShowLlegadaResults(true);
    debouncedSearch(text);
  };

  // Seleccionar lugar
  const handleSelectPlace = async (place, field) => {
    const details = await obtenerDetallesLugar(place.placeId);
    
    if (details) {
      if (field === 'salida') {
        setPuntoSalida(details);
        setPuntoSalidaQuery(details.nombre);
        setShowSalidaResults(false);
      } else {
        setPuntoLlegada(details);
        setPuntoLlegadaQuery(details.nombre);
        setShowLlegadaResults(false);
      }
    }
    
    limpiarBusquedaLugares();
    setActiveField(null);
  };

  // Validar formulario
  const isFormValid = () => {
    return (
      nombre.trim().length >= 3 &&
      puntoSalida !== null &&
      fecha.trim().length > 0 &&
      hora.trim().length > 0
    );
  };

  // Crear rodada
  const handleCreate = async () => {
    if (!isFormValid() || !user?.id) return;

    // Parsear fecha y hora
    let fechaInicio;
    try {
      // Formato esperado: DD/MM/YYYY
      const [dia, mes, anio] = fecha.split('/');
      const [horaNum, minutos] = hora.split(':');
      const isPM = periodo === 'PM';
      
      let hora24 = parseInt(horaNum);
      if (isPM && hora24 !== 12) hora24 += 12;
      if (!isPM && hora24 === 12) hora24 = 0;
      
      fechaInicio = new Date(
        parseInt(anio) || new Date().getFullYear(),
        parseInt(mes) - 1,
        parseInt(dia),
        hora24,
        parseInt(minutos) || 0
      );
    } catch (e) {
      // Si falla el parseo, usar fecha simple
      fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() + 1);
    }

    const horaCompleta = `${hora} ${periodo}`;

    const rodadaData = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      puntoSalida: {
        nombre: puntoSalida.nombre,
        lat: puntoSalida.lat,
        lng: puntoSalida.lng,
        placeId: puntoSalida.placeId,
      },
      puntoLlegada: puntoLlegada ? {
        nombre: puntoLlegada.nombre,
        lat: puntoLlegada.lat,
        lng: puntoLlegada.lng,
        placeId: puntoLlegada.placeId,
      } : null,
      fechaInicio: fechaInicio.toISOString(),
      horaEncuentro: horaCompleta,
      organizadorId: user.id,
      parcheId: parcheId,
      nivelRequerido: nivelRequerido,
    };

    const result = await crearRodada(rodadaData);
    
    if (result.success) {
      // Limpiar formulario
      setNombre('');
      setDescripcion('');
      setFecha('');
      setHora('');
      setPeriodo('AM');
      setPuntoSalida(null);
      setPuntoSalidaQuery('');
      setPuntoLlegada(null);
      setPuntoLlegadaQuery('');
      setNivelRequerido('todos');
      
      onSuccess?.(result.data);
      onClose();
    } else {
      // TODO: Mostrar error
      console.error('Error creando rodada:', result.error);
    }
  };

  // Renderizar item de lugar
  const renderPlaceItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.placeItem, { borderBottomColor: glassBorder }]}
      onPress={() => handleSelectPlace(item, activeField)}
    >
      <Ionicons 
        name="location" 
        size={20} 
        color={theme.colors.primary} 
        style={styles.placeIcon}
      />
      <View style={styles.placeTextContainer}>
        <Text style={[styles.placeMainText, { color: theme.colors.text.primary }]}>
          {item.mainText}
        </Text>
        {item.secondaryText ? (
          <Text style={[styles.placeSecondaryText, { color: theme.colors.text.secondary }]}>
            {item.secondaryText}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const niveles = [
    { value: 'todos', label: 'Todos los niveles' },
    { value: 'principiante', label: 'Principiante' },
    { value: 'intermedio', label: 'Intermedio' },
    { value: 'avanzado', label: 'Avanzado' },
  ];

  // Estilos glassmorphism dinámicos según el tema
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
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <TouchableOpacity
            style={[
              styles.modalContent,
              {
                backgroundColor: glassBackground,
                borderColor: glassBorder,
              },
            ]}
            onPress={() => {}}
            activeOpacity={1}
          >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: glassBorder }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
              Nueva Rodada
            </Text>
            <TouchableOpacity 
              onPress={handleCreate}
              disabled={!isFormValid() || isLoading}
              style={[
                styles.createButton,
                { backgroundColor: isFormValid() ? theme.colors.primary : theme.colors.border }
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.createButtonText}>Crear</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.form}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Nombre */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                Nombre de la rodada *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: inputBackground,
                    borderColor: inputBorder,
                    color: theme.colors.text.primary,
                    borderColor: theme.colors.border,
                  }
                ]}
                placeholder="Ej: Rodada nocturna por El Poblado"
                placeholderTextColor={theme.colors.text.disabled}
                value={nombre}
                onChangeText={setNombre}
                maxLength={100}
              />
            </View>

            {/* Descripción */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                Descripción (opcional)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { 
                    backgroundColor: inputBackground,
                    color: theme.colors.text.primary,
                    borderColor: inputBorder,
                  }
                ]}
                placeholder="Describe la rodada, nivel recomendado, qué llevar..."
                placeholderTextColor={theme.colors.text.disabled}
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>

            {/* Punto de Salida */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                <Ionicons name="flag" size={14} color={theme.colors.success} /> Punto de salida *
              </Text>
              <View style={styles.searchContainer}>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: inputBackground,
                      color: theme.colors.text.primary,
                      borderColor: puntoSalida ? theme.colors.success : inputBorder,
                    }
                  ]}
                  placeholder="Buscar lugar de encuentro..."
                  placeholderTextColor={theme.colors.text.disabled}
                  value={puntoSalidaQuery}
                  onChangeText={handleSalidaChange}
                  onFocus={() => {
                    setActiveField('salida');
                    if (puntoSalidaQuery.length >= 3) {
                      setShowSalidaResults(true);
                    }
                  }}
                />
                {isSearchingPlaces && activeField === 'salida' && (
                  <ActivityIndicator 
                    style={styles.searchIndicator} 
                    size="small" 
                    color={theme.colors.primary} 
                  />
                )}
                {puntoSalida && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={20} 
                    color={theme.colors.success}
                    style={styles.checkIcon}
                  />
                )}
              </View>
              
              {/* Resultados de búsqueda - Salida */}
              {showSalidaResults && activeField === 'salida' && placeSearchResults.length > 0 && (
                <ScrollView 
                  style={[styles.resultsContainer, { backgroundColor: glassBackground, borderColor: glassBorder }]}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                >
                  {placeSearchResults.map((item) => (
                    <React.Fragment key={item.placeId}>
                      {renderPlaceItem({ item })}
                    </React.Fragment>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Punto de Llegada */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                <Ionicons name="flag" size={14} color={theme.colors.error} /> Punto de llegada (opcional)
              </Text>
              <View style={styles.searchContainer}>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: inputBackground,
                      color: theme.colors.text.primary,
                      borderColor: puntoLlegada ? theme.colors.error : inputBorder,
                    }
                  ]}
                  placeholder="Buscar destino final..."
                  placeholderTextColor={theme.colors.text.disabled}
                  value={puntoLlegadaQuery}
                  onChangeText={handleLlegadaChange}
                  onFocus={() => {
                    setActiveField('llegada');
                    if (puntoLlegadaQuery.length >= 3) {
                      setShowLlegadaResults(true);
                    }
                  }}
                />
                {isSearchingPlaces && activeField === 'llegada' && (
                  <ActivityIndicator 
                    style={styles.searchIndicator} 
                    size="small" 
                    color={theme.colors.primary} 
                  />
                )}
                {puntoLlegada && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={20} 
                    color={theme.colors.error}
                    style={styles.checkIcon}
                  />
                )}
              </View>
              
              {/* Resultados de búsqueda - Llegada */}
              {showLlegadaResults && activeField === 'llegada' && placeSearchResults.length > 0 && (
                <ScrollView 
                  style={[styles.resultsContainer, { backgroundColor: glassBackground, borderColor: glassBorder }]}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                >
                  {placeSearchResults.map((item) => (
                    <React.Fragment key={item.placeId}>
                      {renderPlaceItem({ item })}
                    </React.Fragment>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Fecha y Hora */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                  Fecha *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: inputBackground,
                      color: theme.colors.text.primary,
                      borderColor: inputBorder,
                    }
                  ]}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor={theme.colors.text.disabled}
                  value={fecha}
                  onChangeText={setFecha}
                  keyboardType="default"
                  maxLength={10}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                  Hora *
                </Text>
                <View style={styles.horaContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.horaInput,
                      { 
                        backgroundColor: inputBackground,
                        color: theme.colors.text.primary,
                        borderColor: inputBorder,
                      }
                    ]}
                    placeholder="7:00"
                    placeholderTextColor={theme.colors.text.disabled}
                    value={hora}
                    onChangeText={setHora}
                    keyboardType="default"
                    maxLength={5}
                  />
                  <View style={styles.periodoContainer}>
                    <TouchableOpacity
                      style={[
                        styles.periodoButton,
                        styles.periodoButtonLeft,
                        { 
                          backgroundColor: periodo === 'AM' ? theme.colors.primary : inputBackground,
                          borderColor: periodo === 'AM' ? theme.colors.primary : inputBorder,
                        }
                      ]}
                      onPress={() => setPeriodo('AM')}
                    >
                      <Text style={[
                        styles.periodoText,
                        { color: periodo === 'AM' ? '#FFFFFF' : theme.colors.text.secondary }
                      ]}>AM</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.periodoButton,
                        styles.periodoButtonRight,
                        { 
                          backgroundColor: periodo === 'PM' ? theme.colors.primary : inputBackground,
                          borderColor: periodo === 'PM' ? theme.colors.primary : inputBorder,
                        }
                      ]}
                      onPress={() => setPeriodo('PM')}
                    >
                      <Text style={[
                        styles.periodoText,
                        { color: periodo === 'PM' ? '#FFFFFF' : theme.colors.text.secondary }
                      ]}>PM</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Nivel requerido */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                Nivel requerido
              </Text>
              <View style={styles.nivelContainer}>
                {niveles.map((nivel) => (
                  <TouchableOpacity
                    key={nivel.value}
                    style={[
                      styles.nivelOption,
                      { 
                        backgroundColor: nivelRequerido === nivel.value 
                          ? theme.colors.primary 
                          : inputBackground,
                        borderColor: nivelRequerido === nivel.value 
                          ? theme.colors.primary 
                          : inputBorder,
                      }
                    ]}
                    onPress={() => setNivelRequerido(nivel.value)}
                  >
                    <Text 
                      style={[
                        styles.nivelText,
                        { 
                          color: nivelRequerido === nivel.value 
                            ? '#FFF' 
                            : theme.colors.text.primary 
                        }
                      ]}
                    >
                      {nivel.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Espaciado inferior */}
            <View style={{ height: 40 }} />
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  form: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  searchContainer: {
    position: 'relative',
  },
  searchIndicator: {
    position: 'absolute',
    right: 40,
    top: 14,
  },
  checkIcon: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  resultsContainer: {
    marginTop: 4,
    borderRadius: 12,
    maxHeight: 200,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  resultsList: {
    maxHeight: 200,
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  placeIcon: {
    marginRight: 12,
  },
  placeTextContainer: {
    flex: 1,
  },
  placeMainText: {
    fontSize: 15,
    fontWeight: '500',
  },
  placeSecondaryText: {
    fontSize: 13,
    marginTop: 2,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  horaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horaInput: {
    flex: 1,
    marginRight: 8,
  },
  periodoContainer: {
    flexDirection: 'row',
  },
  periodoButton: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
  },
  periodoButtonLeft: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderRightWidth: 0,
  },
  periodoButtonRight: {
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  periodoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  nivelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nivelOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  nivelText: {
    fontSize: 14,
  },
});

export default CreateRodadaModal;


