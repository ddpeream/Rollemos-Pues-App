/**
 * SCRIPT PARA MIGRAR DATOS DE GALERIA.JSON A SUPABASE
 * Convierte los posts del JSON a la estructura de BD
 */

import { supabase } from '../utils/supabase.js';
import galeriaData from '../data/galeria.json' assert { type: 'json' };

// Función para migrar los datos
const migrateGaleriaData = async () => {
  console.log('🚀 Iniciando migración de galería...');
  
  try {
    // Primero, obtener usuarios existentes
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('id, nombre');

    if (usuariosError) {
      console.error('❌ Error obteniendo usuarios:', usuariosError);
      return;
    }

    console.log('✅ Usuarios encontrados:', usuarios?.length || 0);

    // Preparar posts para insertar
    const postsToInsert = galeriaData.map((post, index) => {
      // Asignar usuario aleatorio de los existentes
      const randomUser = usuarios[index % usuarios.length];
      
      return {
        id: `galeria_${post.id}`, // Prefijo para evitar conflictos
        usuario_id: randomUser.id,
        imagen: post.imagen,
        descripcion: post.descripcion,
        ubicacion: post.ubicacion,
        aspect_ratio: post.aspectRatio || 0.75,
        likes_count: post.likes || 0,
        comentarios_count: post.comentarios || 0,
        created_at: post.fecha,
        updated_at: post.fecha
      };
    });

    console.log('📦 Posts preparados:', postsToInsert.length);

    // Insertar en la base de datos
    const { data, error } = await supabase
      .from('galeria')
      .insert(postsToInsert)
      .select();

    if (error) {
      console.error('❌ Error insertando posts:', error);
      
      // Si es error de duplicado, intentar actualizar
      if (error.code === '23505') { // Duplicate key
        console.log('⚠️ Posts ya existen, intentando upsert...');
        
        for (const post of postsToInsert) {
          const { error: upsertError } = await supabase
            .from('galeria')
            .upsert(post, { onConflict: 'id' });
            
          if (upsertError) {
            console.error('❌ Error en upsert:', upsertError);
          } else {
            console.log('✅ Post actualizado:', post.id);
          }
        }
      }
      return;
    }

    console.log('🎉 ¡Migración exitosa!');
    console.log('✅ Posts insertados:', data?.length || 0);
    
    // Mostrar resumen
    data?.forEach((post, index) => {
      console.log(`📸 Post ${index + 1}: ${post.descripcion.substring(0, 30)}...`);
    });

  } catch (error) {
    console.error('💥 Error en migración:', error);
  }
};

// Ejecutar si es llamado directamente
if (typeof window === 'undefined') {
  migrateGaleriaData();
}

export { migrateGaleriaData };