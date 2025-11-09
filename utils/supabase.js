import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Obtener variables de entorno con fallbacks
const getSupabaseConfig = () => {
  // Primero intentar desde process.env (desarrollo)
  let url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  let key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  // Si no están disponibles, usar desde Constants.expoConfig (producción)
  if (!url || !key) {
    url = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL;
    key = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  }

  // Valores por defecto como último recurso
  if (!url || !key) {
    url = 'https://zehzpbeytopyryyiptgn.supabase.co';
    key = 'sb_publishable_7jmFLoP24BnyYiWa76TabA_eS54r5nv';
  }

  return { url, key };
};

const { url: SUPABASE_URL, key: SUPABASE_ANON_KEY } = getSupabaseConfig();

// Validar que las variables de entorno existan
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  throw new Error('Configuración de Supabase faltante');
}

console.log('🔌 Iniciando conexión a Supabase...');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Cliente Supabase creado exitosamente');
console.log('🌐 URL:', SUPABASE_URL);

// Prueba de conexión
supabase
  .from('galeria')
  .select('count', { count: 'exact', head: true })
  .then((response) => {
    if (response.error) {
      console.error('❌ Error al conectar:', response.error.message);
    } else {
      console.log('✅ Conexión a Supabase exitosa!');
      console.log('📊 Tabla "galeria" accesible');
    }
  })
  .catch((err) => {
    console.error('❌ Error fatal:', err.message);
  });

