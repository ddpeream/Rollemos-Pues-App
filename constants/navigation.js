/**
 * 🧭 NAVEGACIÓN
 *
 * Constantes para nombres de rutas de navegación.
 * Esto previene errores de tipeo y facilita refactorizaciones.
 */

// ============================================
// PANTALLAS PRINCIPALES (TABS)
// ============================================
export const SCREENS = {
  // Auth Stack
  AUTH_SCREEN: 'AuthScreen',
  SIGNUP_SCREEN: 'SignupScreen',

  // Main Stack
  MAIN_TABS: 'MainTabs',

  // Tabs
  INICIO: 'Inicio',
  PATINADORES: 'Patinadores',
  PARCHES: 'Parches',
  SPOTS: 'Spots',
  GALERIA: 'Galería',

  // Modales
  PERFIL: 'Perfil',
  EDITAR_PERFIL: 'EditarPerfil',
  
  // Rodadas
  RODADAS: 'Rodadas',
  RODADA_DETALLE: 'RodadaDetalle',
  CREATE_RODADA: 'CreateRodada',
};

// ============================================
// STACKS
// ============================================
export const STACKS = {
  AUTH: 'AuthStack',
  MAIN: 'MainStack',
};

// ============================================
// NAVEGACIÓN HELPERS
// ============================================
export const isAuthScreen = (screenName) => {
  return [SCREENS.AUTH_SCREEN, SCREENS.SIGNUP_SCREEN].includes(screenName);
};

export const isMainScreen = (screenName) => {
  return [
    SCREENS.INICIO,
    SCREENS.PATINADORES,
    SCREENS.PARCHES,
    SCREENS.SPOTS,
    SCREENS.GALERIA,
  ].includes(screenName);
};

export const isModalScreen = (screenName) => {
  return [
    SCREENS.PERFIL,
    SCREENS.EDITAR_PERFIL,
  ].includes(screenName);
};
