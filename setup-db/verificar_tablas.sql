-- =============================================
-- VERIFICACIÓN DE TABLAS CREADAS
-- Para ejecutar en Supabase SQL Editor
-- =============================================

-- 1. VERIFICAR TODAS LAS TABLAS PRINCIPALES
SELECT 
  table_name as "Tabla",
  table_type as "Tipo"
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('usuarios', 'galeria', 'galeria_likes', 'galeria_comentarios', 'parches', 'spots', 'spots_favoritos')
ORDER BY table_name;

-- 2. CONTAR COLUMNAS POR TABLA
SELECT 
  table_name as "Tabla",
  COUNT(*) as "Columnas"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('usuarios', 'galeria', 'galeria_likes', 'galeria_comentarios', 'parches', 'spots', 'spots_favoritos')
GROUP BY table_name
ORDER BY table_name;

-- 3. VERIFICAR ÍNDICES CREADOS
SELECT 
  schemaname as "Schema",
  tablename as "Tabla", 
  indexname as "Índice"
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename IN ('galeria', 'galeria_likes', 'galeria_comentarios', 'parches', 'spots', 'spots_favoritos')
ORDER BY tablename, indexname;

-- 4. VERIFICAR RLS POLICIES
SELECT 
  tablename as "Tabla",
  policyname as "Policy",
  cmd as "Comando"
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('galeria', 'galeria_likes', 'galeria_comentarios', 'parches', 'spots', 'spots_favoritos')
ORDER BY tablename, policyname;

-- 5. VERIFICAR TRIGGERS
SELECT 
  event_object_table as "Tabla",
  trigger_name as "Trigger",
  event_manipulation as "Evento"
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('galeria_likes', 'galeria_comentarios')
ORDER BY event_object_table, trigger_name;

-- 6. VERIFICAR RELACIONES (FOREIGN KEYS)
SELECT 
  tc.table_name as "Tabla", 
  kcu.column_name as "Columna",
  ccu.table_name as "Tabla_Referenciada",
  ccu.column_name as "Columna_Referenciada"
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema='public'
  AND tc.table_name IN ('galeria', 'galeria_likes', 'galeria_comentarios', 'parches', 'spots', 'spots_favoritos')
ORDER BY tc.table_name, kcu.column_name;

-- =============================================
-- RESULTADO ESPERADO:
-- 
-- TABLAS (7 total):
-- - usuarios (ya existía)
-- - galeria
-- - galeria_likes  
-- - galeria_comentarios
-- - parches
-- - spots
-- - spots_favoritos
--
-- ÍNDICES: ~12 índices total
-- POLICIES: ~20 policies total  
-- TRIGGERS: 2 triggers
-- FOREIGN KEYS: ~6 relaciones
-- =============================================