/**
 * 📊 OPCIONES Y CONSTANTES
 *
 * Valores constantes usados en toda la aplicación
 * para niveles, disciplinas, dificultades, etc.
 */

// ============================================
// NIVELES DE PATINAJE
// ============================================
export const NIVELES = [
  { id: 'principiante', label: 'Principiante', icon: '🛹', value: 'principiante' },
  { id: 'intermedio', label: 'Intermedio', icon: '⭐', value: 'intermedio' },
  { id: 'avanzado', label: 'Avanzado', icon: '🏆', value: 'avanzado' },
  { id: 'profesional', label: 'Profesional', icon: '👑', value: 'profesional' },
];

// ============================================
// DISCIPLINAS DE PATINAJE
// ============================================
export const DISCIPLINAS = [
  { id: 'street', label: 'Street', icon: '🛣️', value: 'street' },
  { id: 'park', label: 'Park', icon: '🎡', value: 'park' },
  { id: 'freestyle', label: 'Freestyle', icon: '🎪', value: 'freestyle' },
  { id: 'speed', label: 'Speed', icon: '⚡', value: 'speed' },
  { id: 'downhill', label: 'Downhill', icon: '⬇️', value: 'downhill' },
  { id: 'cruising', label: 'Cruising', icon: '🌊', value: 'cruising' },
  { id: 'slalom', label: 'Slalom', icon: '🎯', value: 'slalom' },
];

// ============================================
// DIFICULTADES DE SPOTS
// ============================================
export const DIFICULTADES = [
  { id: 'baja', label: 'Baja', icon: '🟢', value: 'baja', color: '#4DD7D0' },
  { id: 'media', label: 'Media', icon: '🟡', value: 'media', color: '#FFB74D' },
  { id: 'alta', label: 'Alta', icon: '🔴', value: 'alta', color: '#EF4444' },
];

// ============================================
// TIPOS DE SPOTS
// ============================================
export const TIPOS_SPOT = [
  { id: 'skatepark', label: 'Skatepark', icon: '🏞️', value: 'skatepark' },
  { id: 'plaza', label: 'Plaza', icon: '🏛️', value: 'plaza' },
  { id: 'calle', label: 'Calle', icon: '🛣️', value: 'calle' },
  { id: 'rampa', label: 'Rampa', icon: '📐', value: 'rampa' },
  { id: 'bowl', label: 'Bowl', icon: '🥣', value: 'bowl' },
  { id: 'carril_bici', label: 'Carril Bici', icon: '🚴', value: 'carril_bici' },
];

// ============================================
// IDIOMAS DISPONIBLES
// ============================================
export const IDIOMAS = [
  { id: 'es', label: 'Español', flag: '🇪🇸', value: 'es' },
  { id: 'en', label: 'English', flag: '🇬🇧', value: 'en' },
  { id: 'fr', label: 'Français', flag: '🇫🇷', value: 'fr' },
];

// ============================================
// HELPERS
// ============================================

/**
 * Obtener objeto completo de nivel por ID
 */
export const getNivelById = (id) => {
  return NIVELES.find(n => n.id === id) || NIVELES[0];
};

/**
 * Obtener objeto completo de disciplina por ID
 */
export const getDisciplinaById = (id) => {
  return DISCIPLINAS.find(d => d.id === id) || DISCIPLINAS[0];
};

/**
 * Obtener objeto completo de dificultad por ID
 */
export const getDificultadById = (id) => {
  return DIFICULTADES.find(d => d.id === id) || DIFICULTADES[0];
};

/**
 * Obtener objeto completo de tipo de spot por ID
 */
export const getTipoSpotById = (id) => {
  return TIPOS_SPOT.find(t => t.id === id) || TIPOS_SPOT[0];
};

/**
 * Obtener idioma por ID
 */
export const getIdiomaById = (id) => {
  return IDIOMAS.find(i => i.id === id) || IDIOMAS[0];
};
