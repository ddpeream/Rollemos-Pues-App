/**
 * 🛹 Utilidades para Parches/Crews
 */

/**
 * Valida los datos de un parche antes de crearlo
 * @param {Object} data - Datos del parche
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validatePatchData = (data) => {
  const errors = [];

  // Validar nombre (requerido)
  if (!data.nombre || data.nombre.trim().length < 3) {
    errors.push('El nombre debe tener al menos 3 caracteres');
  }

  if (data.nombre && data.nombre.length > 50) {
    errors.push('El nombre no puede tener más de 50 caracteres');
  }

  // Ciudad es opcional pero si se ingresa debe ser válida
  if (data.ciudad && data.ciudad.trim().length > 0 && data.ciudad.trim().length < 2) {
    errors.push('La ciudad debe tener al menos 2 caracteres');
  }

  // Disciplinas son opcionales (removida validación obligatoria)

  // Validar descripción (opcional pero con límite)
  if (data.descripcion && data.descripcion.length > 500) {
    errors.push('La descripción no puede tener más de 500 caracteres');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Formatea las disciplinas para mostrar
 * @param {string|Array} disciplinas - Disciplinas del parche
 * @returns {Array} - Array de disciplinas
 */
export const formatDisciplinas = (disciplinas) => {
  if (typeof disciplinas === 'string') {
    return disciplinas.split(',').map(d => d.trim()).filter(Boolean);
  }
  if (Array.isArray(disciplinas)) {
    return disciplinas.filter(Boolean);
  }
  return [];
};

/**
 * Obtiene el icono para una disciplina
 * @param {string} disciplina - Nombre de la disciplina
 * @returns {string} - Nombre del icono de Ionicons
 */
export const getDisciplinaIcon = (disciplina) => {
  const icons = {
    'Street': 'trail-sign',
    'Park': 'business',
    'Vert': 'trending-up',
    'Freestyle': 'flash',
    'Downhill': 'arrow-down',
    'Slalom': 'git-compare',
    'Aggressive': 'flame',
    'Fitness': 'fitness',
    'Hockey': 'disc',
    'Dance': 'musical-notes',
  };
  return icons[disciplina] || 'ellipse';
};

export default {
  validatePatchData,
  formatDisciplinas,
  getDisciplinaIcon,
};
