/**
 * 💾 STORAGE
 *
 * Keys de AsyncStorage y configuración de persistencia.
 */

// ============================================
// ASYNC STORAGE KEYS
// ============================================
export const STORAGE_KEYS = {
  // Zustand store
  STORE: 'rollemos-pues-storage',

  // Tema
  THEME: '@theme',

  // Idioma
  LANGUAGE: '@language',

  // Usuario (legacy - ahora manejado por Zustand)
  USER: '@user',

  // Favoritos (legacy - ahora manejado por Zustand)
  FAVORITE_SKATERS: '@favoriteSkaters',
  FAVORITE_PARCHES: '@favoriteParches',
  FAVORITE_SPOTS: '@favoriteSpots',

  // Onboarding
  ONBOARDING_COMPLETED: '@onboardingCompleted',

  // Cache
  CACHE_PREFIX: '@cache_',
};

// ============================================
// SUPABASE STORAGE BUCKETS
// ============================================
export const STORAGE_BUCKETS = {
  AVATARES: 'usuarios-avatares',
  POSTS: 'posts',
  PARCHES: 'parches-fotos',
  SPOTS: 'spots-fotos',
};

// ============================================
// HELPERS
// ============================================

/**
 * Generar key de cache con timestamp
 */
export const getCacheKey = (key) => {
  return `${STORAGE_KEYS.CACHE_PREFIX}${key}`;
};

/**
 * Verificar si una key es de cache
 */
export const isCacheKey = (key) => {
  return key.startsWith(STORAGE_KEYS.CACHE_PREFIX);
};
