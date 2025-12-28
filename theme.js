import { StyleSheet, Platform } from 'react-native';

/**
 * Sistema de diseño centralizado para Rollemos Pues!!!
 * Basado en el diseño web (patinaje/assets/css/styles.css y utilities.css)
 * Adaptado para React Native
 */

// ============================================
// COLORES
// ============================================
export const colors = {
  // Colores principales
  primary: '#4DD7D0',        // Cian/aguamarina
  secondary: '#D26BFF',      // Magenta/lila
  
  // Fondos (dark mode por defecto)
  background: {
    dark: '#0B0F14',
    light: '#F7F9FB',
    surface: 'rgba(255, 255, 255, 0.06)',
    surface2: 'rgba(255, 255, 255, 0.1)',
    primary: '#0B0F14',  // Alias para compatibilidad
  },
  
  // Textos
  text: {
    primary: '#E6EEF5',
    secondary: '#A8B3BE',
    muted: '#A8B3BE',
    dark: '#101418',          // Para tema claro
    mutedDark: '#495469',     // Para tema claro
  },
  
  // Efectos glass morphism
  glass: {
    background: 'rgba(255, 255, 255, 0.06)',
    border: 'rgba(255, 255, 255, 0.08)',
    backdrop: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Gradientes (para usar con expo-linear-gradient si se instala)
  gradients: {
    primary: ['#4DD7D0', '#D26BFF'],  // De cian a magenta
    primaryAngle: 135,                 // Grados
    accent: ['rgba(77, 215, 208, 0.25)', 'transparent'],
    accentSecondary: ['rgba(210, 107, 255, 0.2)', 'transparent'],
  },
  
  // Estados
  success: '#4DD7D0',
  error: '#FF5252',
  warning: '#FFB74D',
  info: '#64B5F6',
  
  // Navegación (tabs)
  tabs: {
    active: '#E91E63',        // Rosa/pink
    inactive: '#808080',      // Gris
  },
  
  // Transparencias útiles
  alpha: {
    primary10: 'rgba(77, 215, 208, 0.1)',
    primary15: 'rgba(77, 215, 208, 0.15)',
    primary35: 'rgba(77, 215, 208, 0.35)',
    white06: 'rgba(255, 255, 255, 0.06)',
    white08: 'rgba(255, 255, 255, 0.08)',
    white10: 'rgba(255, 255, 255, 0.1)',
    white12: 'rgba(255, 255, 255, 0.12)',
    white15: 'rgba(255, 255, 255, 0.15)',
    white20: 'rgba(255, 255, 255, 0.2)',
    black50: 'rgba(0, 0, 0, 0.5)',
    black35: 'rgba(0, 0, 0, 0.35)',
  },
  
  // ALIASES PARA COMPATIBILIDAD CON CÓDIGO EXISTENTE
  card: 'rgba(255, 255, 255, 0.06)',
  border: 'rgba(255, 255, 255, 0.08)',
  primaryLight: 'rgba(77, 215, 208, 0.15)',
  textSecondary: '#A8B3BE',
};

// ============================================
// ESPACIADO
// ============================================
// Basado en el sistema rem del CSS (1rem = 16px)
export const spacing = {
  xs: 4,      // 0.25rem
  sm: 8,      // 0.5rem
  md: 12,     // 0.75rem
  base: 16,   // 1rem
  lg: 24,     // 1.5rem
  xl: 32,     // 2rem
  xxl: 40,    // 2.5rem
  xxxl: 64,   // 4rem
  
  // Aliases comunes
  gap: {
    small: 8,
    medium: 16,
    large: 24,
  },
  padding: {
    small: 8,
    medium: 16,
    card: 16,
    large: 24,
  },
  margin: {
    small: 8,
    medium: 16,
    large: 24,
  },
};

// ============================================
// TIPOGRAFÍA
// ============================================
export const typography = {
  // Familias de fuentes
  fontFamily: {
    // React Native usa fuentes del sistema por defecto
    // Inter → System/Roboto, Poppins → System Bold
    body: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    heading: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
  },
  
  // Tamaños de fuente
  fontSize: {
    xs: 12,     // 0.75rem
    sm: 14,     // 0.875rem
    base: 16,   // 1rem (base del CSS)
    md: 18,     // 1.125rem (lead)
    lg: 20,     // 1.25rem
    xl: 24,     // 1.5rem (title-lg mínimo)
    xxl: 32,    // 2rem (title-xl mínimo)
    xxxl: 40,   // 2.5rem
    display: 48, // 3rem (title-xl máximo)
  },
  
  // Pesos de fuente
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  // Altura de línea
  lineHeight: {
    tight: 1.1,
    normal: 1.2,
    relaxed: 1.5,
    loose: 1.8,
  },
};

// ============================================
// BORDER RADIUS
// ============================================
export const borderRadius = {
  sm: 8,      // Para elementos pequeños
  md: 12,     // radius-lg del CSS
  lg: 16,     // radius-xl del CSS
  xl: 20,     // radius-2xl del CSS
  xxl: 24,    // Para cards grandes
  round: 999, // Completamente redondeado (pills, badges)
  circle: '50%', // Círculos (avatares) - nota: en RN usar width/height iguales + borderRadius la mitad
};

// ============================================
// SOMBRAS Y ELEVACIÓN
// ============================================
// React Native usa elevation (Android) y shadowXXX (iOS)
export const shadows = {
  // Sombra suave
  soft: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 8,
  },
  
  // Sombra para cards
  card: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  
  // Sombra pequeña
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  
  // Sombra media
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Sin sombra
  none: {
    shadowColor: 'transparent',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

// ============================================
// TRANSICIONES Y ANIMACIONES
// ============================================
export const animations = {
  // Duraciones (en milisegundos)
  duration: {
    fast: 150,
    normal: 220,    // --transition del CSS
    medium: 240,    // transition del CSS original
    slow: 400,
  },
  
  // Tipos de easing (para Animated de React Native)
  easing: {
    ease: 'ease',
    easeInOut: 'ease-in-out',
    linear: 'linear',
  },
};

// ============================================
// ESTILOS COMUNES
// ============================================
export const commonStyles = StyleSheet.create({
  // Contenedores
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  
  containerLight: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.dark,
  },
  
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.lg,
  },
  
  // Cards
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.glass.border,
    ...shadows.card,
  },
  
  cardGlass: {
    backgroundColor: colors.glass.background,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.glass.border,
    ...shadows.card,
  },
  
  // Botones
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.surface2,
    paddingVertical: 10,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: spacing.sm,
  },
  
  buttonPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
  },
  
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.alpha.white20,
    paddingVertical: 10,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
  },
  
  // Textos
  textPrimary: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    fontFamily: typography.fontFamily.body,
  },
  
  textSecondary: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
  },
  
  textMuted: {
    color: colors.text.muted,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
  },
  
  // Títulos
  titleXL: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    lineHeight: typography.fontSize.xxxl * typography.lineHeight.tight,
    fontFamily: typography.fontFamily.heading,
  },
  
  titleLG: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    lineHeight: typography.fontSize.xxl * typography.lineHeight.normal,
    fontFamily: typography.fontFamily.heading,
  },
  
  titleMD: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    lineHeight: typography.fontSize.xl * typography.lineHeight.normal,
    fontFamily: typography.fontFamily.heading,
  },
  
  lead: {
    fontSize: typography.fontSize.md,
    color: colors.text.muted,
    lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
  },
  
  // Badges
  badge: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.alpha.primary15,
    borderRadius: borderRadius.round,
    alignSelf: 'flex-start',
  },
  
  badgeText: {
    color: colors.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  
  // Chips
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.alpha.white15,
    borderRadius: borderRadius.round,
  },
  
  chipActive: {
    backgroundColor: colors.background.surface2,
  },
  
  chipText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
  },
  
  // Separadores
  divider: {
    height: 1,
    backgroundColor: colors.glass.border,
    marginVertical: spacing.base,
  },
  
  dividerVertical: {
    width: 1,
    backgroundColor: colors.glass.border,
    marginHorizontal: spacing.base,
  },
  
  // Espaciados comunes
  mt1: { marginTop: spacing.sm },
  mt2: { marginTop: spacing.base },
  mt3: { marginTop: spacing.lg },
  mt4: { marginTop: spacing.xl },
  
  mb1: { marginBottom: spacing.sm },
  mb2: { marginBottom: spacing.base },
  mb3: { marginBottom: spacing.lg },
  mb4: { marginBottom: spacing.xl },
  
  mx1: { marginHorizontal: spacing.sm },
  mx2: { marginHorizontal: spacing.base },
  mx3: { marginHorizontal: spacing.lg },
  
  my1: { marginVertical: spacing.sm },
  my2: { marginVertical: spacing.base },
  my3: { marginVertical: spacing.lg },
  
  p1: { padding: spacing.sm },
  p2: { padding: spacing.base },
  p3: { padding: spacing.lg },
  p4: { padding: spacing.xl },
  
  px1: { paddingHorizontal: spacing.sm },
  px2: { paddingHorizontal: spacing.base },
  px3: { paddingHorizontal: spacing.lg },
  
  py1: { paddingVertical: spacing.sm },
  py2: { paddingVertical: spacing.base },
  py3: { paddingVertical: spacing.lg },
  
  // Layouts
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  column: {
    flexDirection: 'column',
  },
  
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Imágenes
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30, // 50% = mitad del width/height
    borderWidth: 2,
    borderColor: colors.alpha.white15,
  },
  
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.alpha.white15,
  },
  
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.alpha.white15,
  },
});

// ============================================
// EXPORTACIÓN DEL TEMA COMPLETO
// ============================================
export const theme = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  animations,
  commonStyles,
};

// ============================================
// FUNCIÓN PARA OBTENER TEMA DINÁMICO
// ============================================
/**
 * Retorna el objeto de tema según el modo (claro/oscuro)
 * @param {boolean} isDark - Si el tema es oscuro
 * @returns {object} Objeto de tema completo
 */
export const getTheme = (isDark = true) => {
  // Colores dinámicos según el tema
  const dynamicColors = {
    ...colors,
    background: {
      ...colors.background,
      primary: isDark ? '#0B0F14' : '#F7F9FB',
      surface: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
      surface2: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    text: {
      ...colors.text,
      primary: isDark ? '#E6EEF5' : '#101418',
      secondary: isDark ? '#A8B3BE' : '#495469',
      muted: isDark ? '#A8B3BE' : '#495469',
    },
    glass: {
      background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
      border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      backdrop: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    },
    card: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.1)',
  };

  return {
    colors: dynamicColors,
    spacing,
    typography,
    borderRadius,
    shadows,
    animations,
    commonStyles,
  };
};

// Exportación por defecto
export default theme;
