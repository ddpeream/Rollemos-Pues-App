-- ============================================
-- 📦 CONFIGURACIÓN DE STORAGE BUCKETS
-- ============================================
-- Ejecutar este script en el SQL Editor de Supabase
-- Dashboard → SQL Editor → New Query → Pegar y ejecutar

-- 1. Crear los buckets (ejecutar uno por uno si da error)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('usuarios-avatares', 'usuarios-avatares', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('parches-fotos', 'parches-fotos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('spots-fotos', 'spots-fotos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ============================================
-- 2. POLÍTICAS PARA usuarios-avatares
-- ============================================

-- Ver imágenes (público)
CREATE POLICY "avatares_select_public" ON storage.objects
FOR SELECT USING (bucket_id = 'usuarios-avatares');

-- Subir imágenes (usuarios autenticados)
CREATE POLICY "avatares_insert_auth" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'usuarios-avatares' 
  AND auth.role() = 'authenticated'
);

-- Actualizar propias imágenes
CREATE POLICY "avatares_update_own" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'usuarios-avatares' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Borrar propias imágenes
CREATE POLICY "avatares_delete_own" ON storage.objects
FOR DELETE USING (
  bucket_id = 'usuarios-avatares' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- 3. POLÍTICAS PARA posts
-- ============================================

CREATE POLICY "posts_select_public" ON storage.objects
FOR SELECT USING (bucket_id = 'posts');

CREATE POLICY "posts_insert_auth" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'posts' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "posts_update_own" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "posts_delete_own" ON storage.objects
FOR DELETE USING (
  bucket_id = 'posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- 4. POLÍTICAS PARA parches-fotos
-- ============================================

CREATE POLICY "parches_select_public" ON storage.objects
FOR SELECT USING (bucket_id = 'parches-fotos');

CREATE POLICY "parches_insert_auth" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'parches-fotos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "parches_update_auth" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'parches-fotos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "parches_delete_auth" ON storage.objects
FOR DELETE USING (
  bucket_id = 'parches-fotos' 
  AND auth.role() = 'authenticated'
);

-- ============================================
-- 5. POLÍTICAS PARA spots-fotos
-- ============================================

CREATE POLICY "spots_select_public" ON storage.objects
FOR SELECT USING (bucket_id = 'spots-fotos');

CREATE POLICY "spots_insert_auth" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'spots-fotos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "spots_update_auth" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'spots-fotos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "spots_delete_auth" ON storage.objects
FOR DELETE USING (
  bucket_id = 'spots-fotos' 
  AND auth.role() = 'authenticated'
);

-- ============================================
-- ✅ VERIFICAR CONFIGURACIÓN
-- ============================================

-- Ver buckets creados
SELECT id, name, public, created_at FROM storage.buckets;

-- Ver políticas creadas
SELECT policyname, tablename, cmd FROM pg_policies WHERE schemaname = 'storage';
