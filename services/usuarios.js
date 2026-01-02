/**
 * CRUD de Usuarios
 * Todas las operaciones relacionadas con la tabla 'usuarios'
 */

import { supabase } from '../config/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

/**
 * 🔍 LEER - Obtener todos los usuarios
 */
export const getUsuarios = async () => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*');
    
    if (error) {
      console.error('❌ Error obteniendo usuarios:', error.message);
      return null;
    }
    
    // console.log('✅ Usuarios obtenidos:', data); // Log comentado - demasiado verbose
    console.log(`✅ Usuarios obtenidos: ${data.length} registros cargados`);
    return data;
  } catch (error) {
    console.error('❌ Error en getUsuarios:', error);
    return null;
  }
};

/**
 * 🔍 LEER - Obtener un usuario por ID
 */
export const getUsuarioById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('❌ Error obteniendo usuario:', error.message);
      return null;
    }
    
    console.log('✅ Usuario obtenido:', data);
    return data;
  } catch (error) {
    console.error('❌ Error en getUsuarioById:', error);
    return null;
  }
};

/**
 * 🔍 LEER - Obtener usuario por email
 */
export const getUsuarioByEmail = async (email) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email);
    
    if (error) {
      console.error('❌ Error obteniendo usuario por email:', error.message);
      return null;
    }
    
    // Si hay datos, retornar el primero (debería ser único por email)
    if (data && data.length > 0) {
      console.log('✅ Usuario obtenido por email:', data[0]);
      return data[0];
    }
    
    console.log('ℹ️ Usuario no encontrado para email:', email);
    return null;
  } catch (error) {
    console.error('❌ Error en getUsuarioByEmail:', error);
    return null;
  }
};

/**
 * ✏️ CREAR - Crear un nuevo usuario
 *
 * La contraseña se hashea con bcrypt antes de almacenarla
 */
export const createUsuarioPerfil = async (perfil) => {
  const { data, error } = await supabase
    .from("usuarios")
    .insert([
      {
        id: perfil.id, // mismo id que auth.user.id
        nombre: perfil.nombre,
        email: perfil.email,
        ciudad: perfil.ciudad,
        nivel: perfil.nivel,
        disciplina: perfil.disciplina,
        bio: perfil.bio || null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("❌ Error creando perfil:", error.message);
    return null;
  }

  return data;
};
/**
 * ✏️ ACTUALIZAR - Actualizar datos de un usuario
 */
export const updateUsuario = async (id, usuarioData) => {
  try {
    const updateData = {
      ...usuarioData,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('usuarios')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Error actualizando usuario:', error.message);
      return { success: false, error: error.message };
    }

    console.log('✅ Usuario actualizado:', data[0]);
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('❌ Error en updateUsuario:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 🗑️ ELIMINAR - Eliminar un usuario
 */
export const deleteUsuario = async (id) => {
  try {
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error eliminando usuario:', error.message);
      return { success: false, error: error.message };
    }

    console.log('✅ Usuario eliminado exitosamente');
    return { success: true };
  } catch (error) {
    console.error('❌ Error en deleteUsuario:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 🔐 VALIDAR - Verificar credenciales de login
 * Compara la contraseña hasheada con bcrypt
 */
// export const validateLogin = async (email, password) => {
//   try {
//     const usuario = await getUsuarioByEmail(email);

//     if (!usuario) {
//       console.error('❌ Usuario no encontrado');
//       return { success: false, error: 'Usuario o contraseña incorrectos' };
//     }

//     // Comparar contraseña usando bcrypt
//     console.log('🔐 Verificando contraseña...');
//     const passwordMatch = await bcrypt.compare(password, usuario.password);

//     if (!passwordMatch) {
//       console.error('❌ Contraseña incorrecta');
//       return { success: false, error: 'Usuario o contraseña incorrectos' };
//     }

//     console.log('✅ Login válido para:', email);
//     // No retornar password en la respuesta
//     const { password: _, ...usuarioSeguro } = usuario;
//     return { success: true, data: usuarioSeguro };
//   } catch (error) {
//     console.error('❌ Error en validateLogin:', error);
//     return { success: false, error: error.message };
//   }
// };

/**
 * 📊 STATS - Obtener estadísticas de usuarios
 */
export const getUsuariosStats = async () => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('nivel, disciplina', { count: 'exact' });

    if (error) {
      console.error('❌ Error obteniendo stats:', error.message);
      return null;
    }

    const stats = {
      total: data.length,
      porNivel: {},
      porDisciplina: {},
    };

    data.forEach(usuario => {
      stats.porNivel[usuario.nivel] = (stats.porNivel[usuario.nivel] || 0) + 1;
      stats.porDisciplina[usuario.disciplina] = (stats.porDisciplina[usuario.disciplina] || 0) + 1;
    });

    console.log('✅ Stats de usuarios:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Error en getUsuariosStats:', error);
    return null;
  }
};

/**
 * 🔍 LEER - Obtener usuarios con filtros opcionales
 * Si no se pasan filtros, trae TODOS los usuarios
 * 
 * Filtros soportados:
 * - text: búsqueda de texto en nombre, ciudad o bio
 * - ciudad: filtrar por ciudad exacta
 * - disciplina: filtrar por disciplina exacta
 * - nivel: filtrar por nivel exacto
 * - limit: cantidad de resultados (paginación)
 * - offset: desplazamiento para paginación
 */
export const getUsuariosFiltered = async (filters = {}) => {
  try {
    const {
      text = '',
      ciudad = '',
      disciplina = '',
      nivel = '',
      limit = null,
      offset = 0,
    } = filters;

    console.log('📋 Iniciando búsqueda con filtros:', { text, ciudad, disciplina, nivel, limit, offset });

    let query = supabase
      .from('usuarios')
      .select('*', { count: 'exact' });

    // Aplicar filtros si existen
    if (ciudad) {
      query = query.ilike('ciudad', `%${ciudad}%`); // Case-insensitive search
      console.log('🏙️ Filtrando por ciudad (ILIKE):', ciudad);
    }

    if (disciplina) {
      query = query.ilike('disciplina', `%${disciplina}%`); // Case-insensitive search
      console.log('� Filtrando por disciplina (ILIKE):', disciplina);
    }

    if (nivel) {
      query = query.ilike('nivel', `%${nivel}%`); // Case-insensitive search
      console.log('� Filtrando por nivel (ILIKE):', nivel);
    }

    // Búsqueda de texto en nombre, ciudad o bio (case-insensitive)
    if (text) {
      const searchText = `%${text}%`;
      query = query.or(
        `nombre.ilike.${searchText},ciudad.ilike.${searchText},bio.ilike.${searchText},disciplina.ilike.${searchText}`
      );
      console.log('� Búsqueda de texto en: nombre, ciudad, bio, disciplina. Términos:', text);
    }

    // Aplicar paginación
    if (limit) {
      query = query.range(offset, offset + limit - 1);
      console.log(`📄 Paginación: límite=${limit}, offset=${offset}`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Error en getUsuariosFiltered:', error.message);
      console.error('📌 Detalles del error:', error);
      return { success: false, data: [], total: 0, error: error.message };
    }

    console.log(`✅ Búsqueda completada: ${data?.length || 0} resultados de ${count || 0} totales`);
    
    if (data && data.length > 0) {
      console.log('📊 Primeros resultados:');
      data.slice(0, 3).forEach((usuario, idx) => {
        console.log(`  ${idx + 1}. ${usuario.nombre} (${usuario.ciudad}) - ${usuario.disciplina} (${usuario.nivel})`);
      });
    }

    return { success: true, data: data || [], total: count || 0 };
  } catch (error) {
    console.error('❌ Error en getUsuariosFiltered:', error);
    console.error('📌 Stack:', error.stack);
    return { success: false, data: [], total: 0, error: error.message };
  }
};

/**
 * 📸 UPLOAD - Subir imagen de avatar a Storage
 */
export const uploadAvatarImage = async (imageUri, userId) => {
  try {
    // Validar que el URI existe
    if (!imageUri || !userId) {
      console.error('❌ URI o userID faltante');
      return { success: false, error: 'Datos incompletos' };
    }

    // Crear nombre único para el archivo
    const fileName = `${userId}_${Date.now()}.jpg`;
    const filePath = `${userId}/${fileName}`;

    console.log(`📤 Subiendo imagen: ${filePath}`);
    console.log(`📍 URI: ${imageUri}`);

    // Leer el archivo como base64 (funciona en iOS y Android)
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    console.log(`📦 Base64 creado: ${base64.length} caracteres`);

    // Convertir base64 a ArrayBuffer para Supabase
    const arrayBuffer = decode(base64);

    // Subir a Storage usando ArrayBuffer
    const { data, error } = await supabase.storage
      .from('usuarios-avatares')
      .upload(filePath, arrayBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/jpeg',
      });

    if (error) {
      console.error('❌ Error subiendo imagen:', error.message);
      return { success: false, error: error.message };
    }

    // Obtener URL pública del archivo
    const { data: publicData } = supabase.storage
      .from('usuarios-avatares')
      .getPublicUrl(filePath);

    const publicUrl = publicData?.publicUrl;

    console.log('✅ Imagen subida exitosamente');
    console.log('🔗 URL pública:', publicUrl);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('❌ Error en uploadAvatarImage:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 🗑️ DELETE - Eliminar imagen de avatar de Storage
 */
export const deleteAvatarImage = async (filePath) => {
  try {
    if (!filePath) {
      console.error('❌ FilePath faltante');
      return { success: false, error: 'Path no proporcionado' };
    }

    const { error } = await supabase.storage
      .from('usuarios-avatares')
      .remove([filePath]);

    if (error) {
      console.error('❌ Error eliminando imagen:', error.message);
      return { success: false, error: error.message };
    }

    console.log('✅ Imagen eliminada exitosamente');
    return { success: true };
  } catch (error) {
    console.error('❌ Error en deleteAvatarImage:', error);
    return { success: false, error: error.message };
  }
};
