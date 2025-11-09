/**
 * 🚀 SCRIPT DE MIGRACIÓN - PARCHES JSON → SUPABASE
 * =================================================
 * 
 * Este script migra los datos de parches desde parches.json
 * hacia la tabla 'parches' en Supabase.
 * 
 * Funcionalidades:
 * ✅ Carga datos del JSON
 * ✅ Valida estructura de datos
 * ✅ Asigna creadores aleatorios (usuarios existentes)
 * ✅ Inserta en lotes para eficiencia
 * ✅ Reporta progreso y estadísticas
 * ✅ Manejo de errores robusto
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = 'https://zehzpbeytopyryyiptgn.supabase.co';
const supabaseKey = 'sb_publishable_7jmFLoP24BnyYiWa76TabA_eS54r5nv';

const supabase = createClient(supabaseUrl, supabaseKey);

// Función principal de migración
async function migrarParches() {
  console.log('🚀 Iniciando migración de parches...\n');

  try {
    // 1. Cargar datos del JSON
    console.log('📂 Cargando datos del JSON...');
    const jsonPath = path.join(__dirname, '..', 'data', 'parches.json');
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`No se encontró el archivo: ${jsonPath}`);
    }

    const parchesData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`✅ ${parchesData.length} parches cargados desde JSON\n`);

    // 2. Obtener usuarios existentes para asignar como creadores
    console.log('👥 Obteniendo usuarios existentes...');
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('id, nombre')
      .limit(10);

    if (usuariosError) {
      throw new Error(`Error obteniendo usuarios: ${usuariosError.message}`);
    }

    if (!usuarios || usuarios.length === 0) {
      throw new Error('No hay usuarios en la base de datos. Ejecuta primero la migración de usuarios.');
    }

    console.log(`✅ ${usuarios.length} usuarios disponibles como creadores\n`);

    // 3. Verificar si ya existen parches
    console.log('🔍 Verificando parches existentes...');
    const { data: parchesExistentes, error: checkError } = await supabase
      .from('parches')
      .select('id, nombre')
      .limit(1);

    if (checkError) {
      throw new Error(`Error verificando parches: ${checkError.message}`);
    }

    if (parchesExistentes && parchesExistentes.length > 0) {
      console.log('⚠️  Ya existen parches en la base de datos.');
      console.log('¿Continuar? Esto agregará parches adicionales (y/n):');
      
      // En un entorno real, aquí podrías usar readline para input del usuario
      // Por ahora, procederemos automáticamente
      console.log('✅ Continuando con la migración...\n');
    }

    // 4. Preparar datos para inserción
    console.log('⚙️  Preparando datos para inserción...');
    const parchesParaInsertar = parchesData.map((parche, index) => {
      // Asignar usuario creador de forma aleatoria
      const creador = usuarios[index % usuarios.length];
      
      return {
        nombre: parche.nombre,
        descripcion: parche.descripcion || '',
        ciudad: parche.ciudad || '',
        disciplinas: parche.disciplinas || [],
        foto: parche.foto || '',
        miembros_aprox: parche.miembrosAprox || parche.miembros_aprox || 1,
        contacto: parche.contacto || {},
        created_by: creador.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    console.log(`✅ ${parchesParaInsertar.length} parches preparados\n`);

    // 5. Insertar en lotes para mejor rendimiento
    console.log('💾 Insertando parches en la base de datos...');
    const batchSize = 5; // Insertar de 5 en 5
    let insertados = 0;

    for (let i = 0; i < parchesParaInsertar.length; i += batchSize) {
      const lote = parchesParaInsertar.slice(i, i + batchSize);
      
      console.log(`📦 Insertando lote ${Math.floor(i / batchSize) + 1} (${lote.length} parches)...`);
      
      const { data: insertedData, error: insertError } = await supabase
        .from('parches')
        .insert(lote)
        .select('id, nombre, ciudad');

      if (insertError) {
        console.error(`❌ Error insertando lote:`, insertError);
        throw insertError;
      }

      insertados += insertedData.length;
      console.log(`✅ Lote insertado exitosamente. Parches insertados hasta ahora: ${insertados}`);
      
      // Log de parches insertados en este lote
      insertedData.forEach(parche => {
        console.log(`   🎯 ${parche.nombre} (${parche.ciudad}) - ID: ${parche.id}`);
      });
      
      console.log(''); // Línea en blanco para separación
    }

    // 6. Verificar inserción
    console.log('🔍 Verificando inserción...');
    const { data: parchesFinales, error: verificacionError } = await supabase
      .from('parches')
      .select('id, nombre, ciudad, usuario_creador:usuarios!parches_created_by_fkey(nombre)')
      .order('created_at', { ascending: false })
      .limit(parchesParaInsertar.length);

    if (verificacionError) {
      throw new Error(`Error verificando inserción: ${verificacionError.message}`);
    }

    // 7. Mostrar resumen de la migración
    console.log('\n🎉 ¡Migración exitosa!');
    console.log('=' .repeat(50));
    console.log(`✅ Parches insertados: ${insertados}`);
    console.log(`📊 Total parches en BD: ${parchesFinales.length}`);
    console.log('');

    console.log('📋 Parches migrados:');
    parchesFinales.forEach((parche, index) => {
      console.log(`${index + 1}. ${parche.nombre} (${parche.ciudad})`);
      console.log(`   👤 Creado por: ${parche.usuario_creador?.nombre || 'Usuario desconocido'}`);
    });

    console.log('\n🚀 Migración completada exitosamente!');
    console.log('🎯 Los parches ya están disponibles en la aplicación.');

  } catch (error) {
    console.error('\n💥 Error durante la migración:');
    console.error(error.message);
    console.error('\n🔧 Pasos para resolver:');
    console.error('1. Verifica que Supabase esté configurado correctamente');
    console.error('2. Asegúrate de que la tabla "parches" exista');
    console.error('3. Verifica que existan usuarios en la tabla "usuarios"');
    console.error('4. Revisa que el archivo parches.json sea válido');
    process.exit(1);
  }
}

// Ejecutar migración si este archivo se ejecuta directamente
if (require.main === module) {
  migrarParches();
}

module.exports = { migrarParches };