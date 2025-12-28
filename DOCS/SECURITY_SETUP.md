# 🔒 CONFIGURACIÓN DE SEGURIDAD - Row Level Security (RLS)

Este documento contiene **TODOS** los scripts SQL necesarios para configurar la seguridad de tu base de datos Supabase.

## ⚠️ IMPORTANTE

**DEBES ejecutar estos scripts en tu panel de Supabase** antes de lanzar la aplicación en producción. Sin estos scripts, cualquier persona puede leer, modificar o eliminar datos de tu base de datos.

---

## 📋 TABLA DE CONTENIDOS

1. [Preparación](#preparación)
2. [Tabla: usuarios](#tabla-usuarios)
3. [Tabla: parches](#tabla-parches)
4. [Tabla: galeria](#tabla-galeria)
5. [Tabla: galeria_likes](#tabla-galeria_likes)
6. [Tabla: galeria_comentarios](#tabla-galeria_comentarios)
7. [Tabla: spots](#tabla-spots)
8. [Storage Buckets](#storage-buckets)
9. [Verificación](#verificación)

---

## 🚀 PREPARACIÓN

### Paso 1: Acceder al panel de Supabase

1. Ve a https://supabase.com
2. Ingresa a tu proyecto
3. En el menú lateral, ve a **SQL Editor**
4. Crea un nuevo query

### Paso 2: Eliminar la columna password de la tabla usuarios

Ya que ahora usamos Supabase Auth, la columna `password` en la tabla `usuarios` ya no es necesaria y representa un riesgo de seguridad.

```sql
-- Eliminar la columna password (las contraseñas ahora están en Supabase Auth)
ALTER TABLE usuarios DROP COLUMN IF EXISTS password;
```

---

## 👤 TABLA: usuarios

### Habilitar RLS

```sql
-- Habilitar Row Level Security en la tabla usuarios
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
```

### Políticas de Seguridad

```sql
-- 1. LECTURA: Todos pueden ver todos los perfiles públicos
CREATE POLICY "Los perfiles son públicos para lectura"
ON usuarios
FOR SELECT
USING (true);

-- 2. INSERCIÓN: Solo usuarios autenticados pueden crear su propio perfil
-- El ID del registro debe coincidir con el ID del usuario autenticado
CREATE POLICY "Los usuarios pueden crear su propio perfil"
ON usuarios
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 3. ACTUALIZACIÓN: Los usuarios solo pueden actualizar su propio perfil
CREATE POLICY "Los usuarios solo pueden actualizar su propio perfil"
ON usuarios
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. ELIMINACIÓN: Los usuarios solo pueden eliminar su propio perfil
CREATE POLICY "Los usuarios solo pueden eliminar su propio perfil"
ON usuarios
FOR DELETE
USING (auth.uid() = id);
```

---

## 👥 TABLA: parches

### Habilitar RLS

```sql
-- Habilitar Row Level Security en la tabla parches
ALTER TABLE parches ENABLE ROW LEVEL SECURITY;
```

### Políticas de Seguridad

```sql
-- 1. LECTURA: Todos pueden ver todos los parches
CREATE POLICY "Los parches son públicos para lectura"
ON parches
FOR SELECT
USING (true);

-- 2. INSERCIÓN: Solo usuarios autenticados pueden crear parches
CREATE POLICY "Usuarios autenticados pueden crear parches"
ON parches
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- 3. ACTUALIZACIÓN: Solo el creador puede editar su parche
CREATE POLICY "Solo el creador puede editar su parche"
ON parches
FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- 4. ELIMINACIÓN: Solo el creador puede eliminar su parche
CREATE POLICY "Solo el creador puede eliminar su parche"
ON parches
FOR DELETE
USING (auth.uid() = created_by);
```

---

## 📷 TABLA: galeria

### Habilitar RLS

```sql
-- Habilitar Row Level Security en la tabla galeria
ALTER TABLE galeria ENABLE ROW LEVEL SECURITY;
```

### Políticas de Seguridad

```sql
-- 1. LECTURA: Todos pueden ver todas las publicaciones
CREATE POLICY "Las publicaciones son públicas para lectura"
ON galeria
FOR SELECT
USING (true);

-- 2. INSERCIÓN: Solo usuarios autenticados pueden crear publicaciones
CREATE POLICY "Usuarios autenticados pueden crear publicaciones"
ON galeria
FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

-- 3. ACTUALIZACIÓN: Solo el autor puede editar su publicación
CREATE POLICY "Solo el autor puede editar su publicación"
ON galeria
FOR UPDATE
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

-- 4. ELIMINACIÓN: Solo el autor puede eliminar su publicación
CREATE POLICY "Solo el autor puede eliminar su publicación"
ON galeria
FOR DELETE
USING (auth.uid() = usuario_id);
```

---

## ❤️ TABLA: galeria_likes

### Habilitar RLS

```sql
-- Habilitar Row Level Security en la tabla galeria_likes
ALTER TABLE galeria_likes ENABLE ROW LEVEL SECURITY;
```

### Políticas de Seguridad

```sql
-- 1. LECTURA: Todos pueden ver los likes
CREATE POLICY "Los likes son públicos para lectura"
ON galeria_likes
FOR SELECT
USING (true);

-- 2. INSERCIÓN: Solo usuarios autenticados pueden dar like
CREATE POLICY "Usuarios autenticados pueden dar like"
ON galeria_likes
FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

-- 3. ELIMINACIÓN: Los usuarios solo pueden eliminar sus propios likes
CREATE POLICY "Los usuarios solo pueden eliminar sus propios likes"
ON galeria_likes
FOR DELETE
USING (auth.uid() = usuario_id);
```

---

## 💬 TABLA: galeria_comentarios

### Habilitar RLS

```sql
-- Habilitar Row Level Security en la tabla galeria_comentarios
ALTER TABLE galeria_comentarios ENABLE ROW LEVEL SECURITY;
```

### Políticas de Seguridad

```sql
-- 1. LECTURA: Todos pueden ver los comentarios
CREATE POLICY "Los comentarios son públicos para lectura"
ON galeria_comentarios
FOR SELECT
USING (true);

-- 2. INSERCIÓN: Solo usuarios autenticados pueden comentar
CREATE POLICY "Usuarios autenticados pueden comentar"
ON galeria_comentarios
FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

-- 3. ACTUALIZACIÓN: Solo el autor puede editar su comentario
CREATE POLICY "Solo el autor puede editar su comentario"
ON galeria_comentarios
FOR UPDATE
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

-- 4. ELIMINACIÓN: El autor del comentario o el autor del post pueden eliminarlo
CREATE POLICY "El autor del comentario o del post pueden eliminar"
ON galeria_comentarios
FOR DELETE
USING (
  auth.uid() = usuario_id OR
  auth.uid() IN (
    SELECT usuario_id FROM galeria WHERE id = galeria_comentarios.post_id
  )
);
```

---

## 📍 TABLA: spots

### Habilitar RLS

```sql
-- Habilitar Row Level Security en la tabla spots
ALTER TABLE spots ENABLE ROW LEVEL SECURITY;
```

### Políticas de Seguridad

```sql
-- 1. LECTURA: Todos pueden ver todos los spots
CREATE POLICY "Los spots son públicos para lectura"
ON spots
FOR SELECT
USING (true);

-- 2. INSERCIÓN: Solo usuarios autenticados pueden agregar spots
-- (Opcional: puedes hacer que solo admins puedan crear spots)
CREATE POLICY "Usuarios autenticados pueden agregar spots"
ON spots
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- 3. ACTUALIZACIÓN: Solo usuarios autenticados pueden actualizar spots
-- (Opcional: restringir a admins solamente)
CREATE POLICY "Usuarios autenticados pueden actualizar spots"
ON spots
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 4. ELIMINACIÓN: Solo usuarios autenticados pueden eliminar spots
-- (Opcional: restringir a admins solamente)
CREATE POLICY "Usuarios autenticados pueden eliminar spots"
ON spots
FOR DELETE
USING (auth.role() = 'authenticated');
```

---

## 🗄️ STORAGE BUCKETS

### Bucket: usuarios-avatares

Configura las políticas para el bucket de avatares:

```sql
-- 1. LECTURA: Los avatares son públicos
CREATE POLICY "Los avatares son públicos"
ON storage.objects FOR SELECT
USING (bucket_id = 'usuarios-avatares');

-- 2. INSERCIÓN: Los usuarios pueden subir su propio avatar
-- El nombre del archivo debe empezar con el user_id
CREATE POLICY "Los usuarios pueden subir su propio avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'usuarios-avatares' AND
  (storage.foldername(name))[1] = 'avatares' AND
  auth.uid()::text = (string_to_array(storage.filename(name), '_'))[1]
);

-- 3. ACTUALIZACIÓN: Los usuarios pueden actualizar su propio avatar
CREATE POLICY "Los usuarios pueden actualizar su propio avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'usuarios-avatares' AND
  auth.uid()::text = (string_to_array(storage.filename(name), '_'))[1]
);

-- 4. ELIMINACIÓN: Los usuarios pueden eliminar su propio avatar
CREATE POLICY "Los usuarios pueden eliminar su propio avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'usuarios-avatares' AND
  auth.uid()::text = (string_to_array(storage.filename(name), '_'))[1]
);
```

### Bucket: posts

Configura las políticas para el bucket de posts de galería:

```sql
-- 1. LECTURA: Las imágenes de posts son públicas
CREATE POLICY "Las imágenes de posts son públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'posts');

-- 2. INSERCIÓN: Los usuarios pueden subir imágenes a sus posts
CREATE POLICY "Los usuarios pueden subir imágenes a sus posts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = 'posts' AND
  auth.uid()::text = (string_to_array(storage.filename(name), '_'))[1]
);

-- 3. ELIMINACIÓN: Los usuarios pueden eliminar sus propias imágenes
CREATE POLICY "Los usuarios pueden eliminar sus propias imágenes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'posts' AND
  auth.uid()::text = (string_to_array(storage.filename(name), '_'))[1]
);
```

---

## ✅ VERIFICACIÓN

### Script para verificar que RLS está habilitado

Ejecuta este query para verificar que todas las tablas tienen RLS habilitado:

```sql
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('usuarios', 'parches', 'galeria', 'galeria_likes', 'galeria_comentarios', 'spots')
ORDER BY tablename;
```

**Resultado esperado**: Todas las tablas deben tener `rowsecurity = true`

### Script para listar todas las políticas

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 🧪 TESTING

### Cómo probar que RLS funciona correctamente

1. **Sin autenticación**:
   ```sql
   -- Esto debería fallar (no se puede insertar sin autenticación)
   INSERT INTO usuarios (id, nombre, email) VALUES (uuid_generate_v4(), 'Test', 'test@test.com');
   ```

2. **Con autenticación (simular)**:
   ```sql
   -- Esto debería funcionar (RLS permite lectura pública)
   SELECT * FROM usuarios LIMIT 5;
   ```

---

## 🚨 IMPORTANTE: MIGRACION DE USUARIOS EXISTENTES

Si ya tienes usuarios en la base de datos con la columna `password`, **DEBES** migrarlos a Supabase Auth antes de eliminar la columna. Aquí hay un script de ayuda:

```sql
-- NOTA: Este script debe ejecutarse con cuidado y adaptarse a tu caso
-- NO lo ejecutes directamente sin revisar

-- Ejemplo de cómo migrar usuarios existentes (ADAPTAR SEGÚN TU CASO)
DO $$
DECLARE
  usuario RECORD;
BEGIN
  FOR usuario IN SELECT id, email FROM usuarios WHERE email IS NOT NULL LOOP
    -- Aquí deberías usar la API de Supabase Auth para crear usuarios
    -- No se puede hacer directamente desde SQL
    RAISE NOTICE 'Usuario a migrar: % (ID: %)', usuario.email, usuario.id;
  END LOOP;
END $$;
```

**Recomendación**: Para migrar usuarios existentes, contacta al soporte de Supabase o usa un script en Node.js con el Admin API.

---

## 📞 SOPORTE

Si tienes problemas configurando RLS:

1. Revisa los logs de Supabase
2. Verifica que el usuario esté autenticado con `auth.uid()`
3. Consulta la documentación oficial: https://supabase.com/docs/guides/auth/row-level-security

---

## ✅ CHECKLIST

- [ ] Ejecutar script para eliminar columna `password`
- [ ] Habilitar RLS en todas las tablas
- [ ] Aplicar políticas de usuarios
- [ ] Aplicar políticas de parches
- [ ] Aplicar políticas de galería
- [ ] Aplicar políticas de likes
- [ ] Aplicar políticas de comentarios
- [ ] Aplicar políticas de spots
- [ ] Configurar políticas de Storage para avatares
- [ ] Configurar políticas de Storage para posts
- [ ] Ejecutar script de verificación
- [ ] Probar creación de cuenta desde la app
- [ ] Probar login desde la app
- [ ] Probar que no se puede editar contenido de otros usuarios

---

**Fecha de creación**: 2025-11-02
**Versión**: 1.0
**Autor**: Sistema de Seguridad Rollemos Pues
