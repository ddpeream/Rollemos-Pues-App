/**
 * SCRIPT CJS PARA MIGRAR DATOS DE GALERIA.JSON A SUPABASE
 * Version CommonJS compatible
 */

const { createClient } = require('@supabase/supabase-js');
const galeriaData = require('../data/galeria.json');

// Variables de entorno (cargar desde .env.local)
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no encontradas');
  console.error('Verifica EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
    
    if (!usuarios || usuarios.length === 0) {
      console.error('❌ No hay usuarios en la BD. Crea usuarios primero.');
      return;
    }

    // Preparar posts para insertar
    const postsToInsert = galeriaData.map((post, index) => {
      // Asignar usuario aleatorio de los existentes
      const randomUser = usuarios[index % usuarios.length];
      
      return {
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
      return;
    }

    console.log('🎉 ¡Migración exitosa!');
    console.log('✅ Posts insertados:', data?.length || 0);
    
    // Mostrar resumen
    data?.forEach((post, index) => {
      console.log(`📸 Post ${index + 1}: ${post.descripcion?.substring(0, 30)}...`);
    });

  } catch (error) {
    console.error('💥 Error en migración:', error);
  }
};

// Ejecutar
migrateGaleriaData().then(() => {
  console.log('🏁 Script completado');
  process.exit(0);
});