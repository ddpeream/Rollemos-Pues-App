/**
 * Store Global de la Aplicación - Zustand
 * 
 * Este es el store principal que maneja todo el estado global de la app.
 * Incluye persistencia automática con AsyncStorage.
 * 
 * Secciones:
 * 1. Theme (tema claro/oscuro)
 * 2. Language (idioma de la app)
 * 3. User (datos de usuario - futuro)
 * 4. Favorites (favoritos - futuro)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { supabase } from '../config/supabase';
import { getTheme } from '../theme';
import i18n from '../i18n';

// ============================================
// STORE PRINCIPAL
// ============================================

export const useAppStore = create(
  persist(
    (set, get) => ({
      // ==========================================
      // 🎨 THEME STATE
      // ==========================================
      isDark: true,
      theme: getTheme(true),
      isThemeLoading: true,

      // Inicializar tema desde el sistema o storage
      initializeTheme: async () => {
        try {
          const savedTheme = await AsyncStorage.getItem('@theme');
          if (savedTheme !== null) {
            const isDark = savedTheme === 'dark';
            set({
              isDark,
              theme: getTheme(isDark),
              isThemeLoading: false,
            });
          } else {
            // Usar tema del sistema si no hay guardado
            const systemTheme = Appearance.getColorScheme();
            const isDark = systemTheme === 'dark';
            set({
              isDark,
              theme: getTheme(isDark),
              isThemeLoading: false,
            });
          }
        } catch (error) {
          console.error('Error initializing theme:', error);
          set({ isThemeLoading: false });
        }
      },

      // Toggle entre tema claro y oscuro
      toggleTheme: async () => {
        const newIsDark = !get().isDark;
        
        set({
          isDark: newIsDark,
          theme: getTheme(newIsDark),
        });

        try {
          await AsyncStorage.setItem('@theme', newIsDark ? 'dark' : 'light');
        } catch (error) {
          console.error('Error saving theme:', error);
        }
      },

      // Establecer tema específico
      setTheme: async (isDark) => {
        
        set({
          isDark,
          theme: getTheme(isDark),
        });

        try {
          await AsyncStorage.setItem('@theme', isDark ? 'dark' : 'light');
        } catch (error) {
          console.error('Error saving theme:', error);
        }
      },

      // ==========================================
      // 🌍 LANGUAGE STATE
      // ==========================================
      language: 'es',
      isLanguageLoading: true,

      // Inicializar idioma desde storage
      initializeLanguage: async () => {
        try {
          const savedLanguage = await AsyncStorage.getItem('@language');
          if (savedLanguage !== null) {
            set({
              language: savedLanguage,
              isLanguageLoading: false,
            });
            i18n.changeLanguage(savedLanguage);
          } else {
            set({
              language: i18n.language || 'es',
              isLanguageLoading: false,
            });
          }
        } catch (error) {
          console.error('Error initializing language:', error);
          set({ isLanguageLoading: false });
        }
      },

      // Cambiar idioma
      setLanguage: async (newLanguage) => {
        set({ language: newLanguage });
        i18n.changeLanguage(newLanguage);

        try {
          await AsyncStorage.setItem('@language', newLanguage);
        } catch (error) {
          console.error('Error saving language:', error);
        }
      },

      // ==========================================
      // 👤 USER STATE & AUTH
      // ==========================================
      user: null,
      isAuthenticated: false,
      authLoading: true,

      // Inicializar sesión desde Supabase Auth
      initializeAuth: async () => {
        try {
          console.log('🔐 Inicializando autenticación con Supabase...');

          // Obtener sesión actual
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            console.error('❌ Error obteniendo sesión:', error.message);
            set({ authLoading: false });
            return;
          }

          if (session?.user) {
            console.log('✅ Sesión activa encontrada:', session.user.email);

            // Obtener datos del usuario desde la tabla usuarios
            const { data: userData, error: userError } = await supabase
              .from('usuarios')
              .select('*')
              .eq('email', session.user.email)
              .single();

            if (userError) {
              console.error('❌ Error obteniendo datos de usuario:', userError.message);
            } else if (userData) {
              console.log('✅ Datos de usuario cargados:', userData.nombre);
              set({
                user: userData,
                isAuthenticated: true,
                authLoading: false,
              });
              return;
            }
          }

          console.log('ℹ️ No hay sesión activa');
          set({ authLoading: false });

        } catch (error) {
          console.error('❌ Error en initializeAuth:', error);
          set({ authLoading: false });
        }
      },

      // Listener de cambios de autenticación
      setupAuthListener: () => {
        console.log('👂 Configurando listener de cambios de auth...');

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔔 Evento de auth:', event);

            if (event === 'SIGNED_IN' && session?.user) {
              console.log('✅ Usuario autenticado:', session.user.email);

              // Cargar datos del usuario
              const { data: userData } = await supabase
                .from('usuarios')
                .select('*')
                .eq('email', session.user.email)
                .single();

              if (userData) {
                set({
                  user: userData,
                  isAuthenticated: true,
                });
              }
            } else if (event === 'SIGNED_OUT') {
              console.log('👋 Usuario ha cerrado sesión');
              set({
                user: null,
                isAuthenticated: false,
              });
            } else if (event === 'TOKEN_REFRESHED') {
              console.log('🔄 Token renovado');
            }
          }
        );

        return subscription;
      },

      setUser: (userData) => set({ user: userData, isAuthenticated: !!userData }),

      logout: async () => {
        try {
          console.log('🚪 Cerrando sesión...');
          const { error } = await supabase.auth.signOut();

          if (error) {
            console.error('❌ Error al cerrar sesión:', error.message);
          } else {
            console.log('✅ Sesión cerrada correctamente');
          }

          // Limpiar estado local
          set({ user: null, isAuthenticated: false });

        } catch (error) {
          console.error('❌ Error en logout:', error);
          // Limpiar estado incluso si hay error
          set({ user: null, isAuthenticated: false });
        }
      },

      // ==========================================
      // ⭐ FAVORITES STATE (para futuro)
      // ==========================================
      favoriteSkaters: [],
      favoriteParches: [],
      favoriteSpots: [],

      // Agregar a favoritos
      addFavoriteSkater: (skaterId) => {
        const favorites = get().favoriteSkaters;
        if (!favorites.includes(skaterId)) {
          set({ favoriteSkaters: [...favorites, skaterId] });
        }
      },

      removeFavoriteSkater: (skaterId) => {
        set({
          favoriteSkaters: get().favoriteSkaters.filter(id => id !== skaterId),
        });
      },

      toggleFavoriteSkater: (skaterId) => {
        const favorites = get().favoriteSkaters;
        if (favorites.includes(skaterId)) {
          get().removeFavoriteSkater(skaterId);
        } else {
          get().addFavoriteSkater(skaterId);
        }
      },

      // Similar para Parches
      addFavoriteParche: (parcheId) => {
        const favorites = get().favoriteParches;
        if (!favorites.includes(parcheId)) {
          set({ favoriteParches: [...favorites, parcheId] });
        }
      },

      removeFavoriteParche: (parcheId) => {
        set({
          favoriteParches: get().favoriteParches.filter(id => id !== parcheId),
        });
      },

      toggleFavoriteParche: (parcheId) => {
        const favorites = get().favoriteParches;
        if (favorites.includes(parcheId)) {
          get().removeFavoriteParche(parcheId);
        } else {
          get().addFavoriteParche(parcheId);
        }
      },

      // Similar para Spots
      addFavoriteSpot: (spotId) => {
        const favorites = get().favoriteSpots;
        if (!favorites.includes(spotId)) {
          set({ favoriteSpots: [...favorites, spotId] });
        }
      },

      removeFavoriteSpot: (spotId) => {
        set({
          favoriteSpots: get().favoriteSpots.filter(id => id !== spotId),
        });
      },

      toggleFavoriteSpot: (spotId) => {
        const favorites = get().favoriteSpots;
        if (favorites.includes(spotId)) {
          get().removeFavoriteSpot(spotId);
        } else {
          get().addFavoriteSpot(spotId);
        }
      },

      // Helpers para verificar favoritos
      isFavoriteSkater: (skaterId) => get().favoriteSkaters.includes(skaterId),
      isFavoriteParche: (parcheId) => get().favoriteParches.includes(parcheId),
      isFavoriteSpot: (spotId) => get().favoriteSpots.includes(spotId),

      // ==========================================
      // 🔧 UTILITY ACTIONS
      // ==========================================

      // Inicializar toda la app
      initializeApp: async () => {
        await Promise.all([
          get().initializeTheme(),
          get().initializeLanguage(),
          get().initializeAuth(),
        ]);

        // Configurar listener después de inicializar
        get().setupAuthListener();
      },

      // Reset completo (para testing o logout)
      resetStore: () => {
        set({
          isDark: true,
          theme: darkTheme,
          language: 'es',
          user: null,
          isAuthenticated: false,
          favoriteSkaters: [],
          favoriteParches: [],
          favoriteSpots: [],
        });
      },
    }),
    {
      name: 'rollemos-pues-storage', // Nombre único para AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
      
      // Particionar qué se persiste (theme y language no, porque tienen su propia lógica)
      partialize: (state) => ({
        favoriteSkaters: state.favoriteSkaters,
        favoriteParches: state.favoriteParches,
        favoriteSpots: state.favoriteSpots,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ==========================================
// 🎯 HOOKS DE CONVENIENCIA
// ==========================================

// Hook para acceder solo al tema
export const useTheme = () => {
  const isDark = useAppStore((state) => state.isDark);
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const setTheme = useAppStore((state) => state.setTheme);
  const isThemeLoading = useAppStore((state) => state.isThemeLoading);

  return { isDark, theme, toggleTheme, setTheme, isThemeLoading };
};

// Hook para acceder solo al idioma
export const useLanguage = () => {
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const isLanguageLoading = useAppStore((state) => state.isLanguageLoading);

  return { language, setLanguage, isLanguageLoading };
};

// Hook para acceder solo a favoritos
export const useFavorites = () => {
  const favoriteSkaters = useAppStore((state) => state.favoriteSkaters);
  const favoriteParches = useAppStore((state) => state.favoriteParches);
  const favoriteSpots = useAppStore((state) => state.favoriteSpots);
  
  const toggleFavoriteSkater = useAppStore((state) => state.toggleFavoriteSkater);
  const toggleFavoriteParche = useAppStore((state) => state.toggleFavoriteParche);
  const toggleFavoriteSpot = useAppStore((state) => state.toggleFavoriteSpot);
  
  const isFavoriteSkater = useAppStore((state) => state.isFavoriteSkater);
  const isFavoriteParche = useAppStore((state) => state.isFavoriteParche);
  const isFavoriteSpot = useAppStore((state) => state.isFavoriteSpot);

  return {
    favoriteSkaters,
    favoriteParches,
    favoriteSpots,
    toggleFavoriteSkater,
    toggleFavoriteParche,
    toggleFavoriteSpot,
    isFavoriteSkater,
    isFavoriteParche,
    isFavoriteSpot,
  };
};

// Hook para acceder solo al usuario
export const useUser = () => {
  const user = useAppStore((state) => state.user);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const setUser = useAppStore((state) => state.setUser);
  const logout = useAppStore((state) => state.logout);

  return { user, isAuthenticated, setUser, logout };
};

// Export default para compatibilidad
export default useAppStore;
