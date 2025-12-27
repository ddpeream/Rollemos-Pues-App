/**
 * 🔐 useAuth Hook
 *
 * Hook personalizado para manejar toda la lógica de autenticación
 * con Supabase Auth.
 *
 * Características:
 * - Login con email/password
 * - Registro de nuevos usuarios
 * - Logout
 * - Sincronización con tabla usuarios
 * - Manejo de estados de carga y errores
 */

import { useState } from 'react';
import { supabase } from '../config/supabase';
import { getUsuarioByEmail } from '../utils/usuarios';
import { useAppStore } from '../store/useAppStore';

export const useAuth = () => {
  const setUser = useAppStore((state) => state.setUser);
  const logout = useAppStore((state) => state.logout);
  const user = useAppStore((state) => state.user);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * 🔓 Login con email y password
   */
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Iniciando login con Supabase Auth...');

      // Autenticar con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        console.error('❌ Error de autenticación:', authError.message);

        // Mensajes más amigables
        let errorMessage = 'Credenciales inválidas';
        if (authError.message.includes('Invalid login credentials')) {
          errorMessage = 'Email o contraseña incorrectos';
        } else if (authError.message.includes('Email not confirmed')) {
          errorMessage = 'Por favor confirma tu email antes de iniciar sesión';
        }

        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      console.log('✅ Autenticación exitosa:', authData.user.email);

      // Obtener datos completos del usuario desde la tabla usuarios
      const usuario = await getUsuarioByEmail(authData.user.email);

      if (!usuario) {
        console.error('❌ Usuario no encontrado en la tabla usuarios');
        setError('No se encontraron los datos del usuario');
        return { success: false, error: 'No se encontraron los datos del usuario' };
      }

      // Guardar usuario en Zustand (sin password)
      const { password: _, ...usuarioSeguro } = usuario;
      setUser(usuarioSeguro);

      console.log('✅ Usuario guardado en store:', usuarioSeguro.nombre);

      return { success: true, data: usuarioSeguro };

    } catch (err) {
      console.error('❌ Error en login:', err);
      const errorMessage = 'Error al iniciar sesión. Intenta nuevamente.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * 📝 Registro de nuevo usuario
   */
  const register = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Registrando usuario con Supabase Auth...');

      const { nombre, email, password, ciudad, nivel, disciplina, bio, avatar_url } = userData;

      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            nombre: nombre.trim(),
          },
          emailRedirectTo: undefined, // Deshabilitar confirmación por email en desarrollo
        },
      });

      if (authError) {
        console.error('❌ Error en Supabase Auth:', authError.message);

        let errorMessage = authError.message;
        if (authError.message.includes('already registered')) {
          errorMessage = 'Este email ya está registrado';
        }

        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      console.log('✅ Usuario creado en Supabase Auth:', authData.user?.id);

      // 2. Crear registro en tabla usuarios (sin password)
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .insert([
          {
            id: authData.user.id, // Usar el mismo ID de Supabase Auth
            nombre: nombre.trim(),
            email: email.trim(),
            ciudad: ciudad.trim(),
            nivel: nivel,
            disciplina: disciplina,
            bio: bio?.trim() || null,
            avatar_url: avatar_url || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (usuarioError) {
        console.error('❌ Error creando registro de usuario:', usuarioError.message);
        setError('No se pudo completar el registro');
        return { success: false, error: 'No se pudo completar el registro' };
      }

      console.log('✅ Registro de usuario creado');

      // Establecer el usuario en el store (ya está autenticado)
      setUser(usuarioData);

      console.log('✅ Registro completado exitosamente');

      return { success: true, data: usuarioData };

    } catch (err) {
      console.error('❌ Error en register:', err);
      const errorMessage = 'Ocurrió un error al crear la cuenta';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🚪 Cerrar sesión
   */
  const handleLogout = async () => {
    setLoading(true);
    setError(null);

    try {
      await logout();
      return { success: true };
    } catch (err) {
      console.error('❌ Error en logout:', err);
      const errorMessage = 'Error al cerrar sesión';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    // Estado
    user,
    isAuthenticated,
    loading,
    error,

    // Métodos
    login,
    register,
    logout: handleLogout,
    clearError: () => setError(null),
  };
};

export default useAuth;
