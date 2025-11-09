/**
 * ✅ VALIDACIÓN
 *
 * Reglas y funciones de validación para formularios.
 */

// ============================================
// REGLAS DE VALIDACIÓN
// ============================================
export const VALIDATION_RULES = {
  // Password
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 128,

  // Email
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Nombre
  NOMBRE_MIN_LENGTH: 2,
  NOMBRE_MAX_LENGTH: 100,

  // Bio
  BIO_MAX_LENGTH: 500,

  // Descripción de post
  POST_DESCRIPCION_MAX_LENGTH: 500,

  // Descripción de parche
  PARCHE_DESCRIPCION_MAX_LENGTH: 1000,

  // Imágenes
  IMAGE_MAX_SIZE_MB: 5,
  IMAGE_MAX_SIZE_BYTES: 5 * 1024 * 1024,
  IMAGE_ACCEPTED_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],

  // Comentarios
  COMENTARIO_MIN_LENGTH: 1,
  COMENTARIO_MAX_LENGTH: 500,
};

// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================

/**
 * Validar email
 */
export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return { valid: false, error: 'El email es requerido' };
  }

  if (!VALIDATION_RULES.EMAIL_REGEX.test(email)) {
    return { valid: false, error: 'El email no es válido' };
  }

  return { valid: true };
};

/**
 * Validar password
 */
export const validatePassword = (password) => {
  if (!password) {
    return { valid: false, error: 'La contraseña es requerida' };
  }

  if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      error: `La contraseña debe tener al menos ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} caracteres`,
    };
  }

  if (password.length > VALIDATION_RULES.PASSWORD_MAX_LENGTH) {
    return {
      valid: false,
      error: `La contraseña no debe exceder ${VALIDATION_RULES.PASSWORD_MAX_LENGTH} caracteres`,
    };
  }

  return { valid: true };
};

/**
 * Validar nombre
 */
export const validateNombre = (nombre) => {
  if (!nombre || !nombre.trim()) {
    return { valid: false, error: 'El nombre es requerido' };
  }

  if (nombre.trim().length < VALIDATION_RULES.NOMBRE_MIN_LENGTH) {
    return {
      valid: false,
      error: `El nombre debe tener al menos ${VALIDATION_RULES.NOMBRE_MIN_LENGTH} caracteres`,
    };
  }

  if (nombre.length > VALIDATION_RULES.NOMBRE_MAX_LENGTH) {
    return {
      valid: false,
      error: `El nombre no debe exceder ${VALIDATION_RULES.NOMBRE_MAX_LENGTH} caracteres`,
    };
  }

  return { valid: true };
};

/**
 * Validar bio
 */
export const validateBio = (bio) => {
  if (!bio) {
    return { valid: true }; // Bio es opcional
  }

  if (bio.length > VALIDATION_RULES.BIO_MAX_LENGTH) {
    return {
      valid: false,
      error: `La biografía no debe exceder ${VALIDATION_RULES.BIO_MAX_LENGTH} caracteres`,
    };
  }

  return { valid: true };
};

/**
 * Validar tamaño de imagen
 */
export const validateImageSize = (sizeInBytes) => {
  if (sizeInBytes > VALIDATION_RULES.IMAGE_MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `La imagen no debe exceder ${VALIDATION_RULES.IMAGE_MAX_SIZE_MB}MB`,
    };
  }

  return { valid: true };
};

/**
 * Validar formato de imagen
 */
export const validateImageFormat = (filename) => {
  const extension = filename.split('.').pop().toLowerCase();

  if (!VALIDATION_RULES.IMAGE_ACCEPTED_FORMATS.includes(extension)) {
    return {
      valid: false,
      error: `Formato no soportado. Formatos aceptados: ${VALIDATION_RULES.IMAGE_ACCEPTED_FORMATS.join(', ')}`,
    };
  }

  return { valid: true };
};

/**
 * Validar comentario
 */
export const validateComentario = (comentario) => {
  if (!comentario || !comentario.trim()) {
    return { valid: false, error: 'El comentario no puede estar vacío' };
  }

  if (comentario.trim().length < VALIDATION_RULES.COMENTARIO_MIN_LENGTH) {
    return { valid: false, error: 'El comentario es muy corto' };
  }

  if (comentario.length > VALIDATION_RULES.COMENTARIO_MAX_LENGTH) {
    return {
      valid: false,
      error: `El comentario no debe exceder ${VALIDATION_RULES.COMENTARIO_MAX_LENGTH} caracteres`,
    };
  }

  return { valid: true };
};
