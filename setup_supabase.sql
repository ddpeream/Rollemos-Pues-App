
-- =============================================
-- 0. TABLA: USUARIOS (Usuarios de la app)
-- =============================================


CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  avatar_url TEXT,
  ciudad TEXT,
  nivel TEXT,
  disciplina TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- IMPORTANTE: Este script asume que la tabla 'usuarios' YA EXISTE
-- con la estructura creada previamente en el proyecto.

-- INSTRUCCIONES:
-- 1. Ve a Supabase Dashboard > SQL Editor
-- 2. Copia y pega TODO este archivo
-- 3. Click "RUN" para ejecutar
-- 4. Verificar que las 6 tablas se crearon correctamente



-- =============================================
-- 1. TABLA: GALERIA (Posts de fotos)
-- =============================================

-- Eliminar tabla si existe (solo para desarrollo)
DROP TABLE IF EXISTS galeria CASCADE;

CREATE TABLE galeria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  imagen TEXT NOT NULL,
  descripcion TEXT,
  likes_count INTEGER DEFAULT 0,
  comentarios_count INTEGER DEFAULT 0,
  ubicacion TEXT,
  aspect_ratio NUMERIC DEFAULT 0.75,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_galeria_usuario ON galeria(usuario_id);
CREATE INDEX idx_galeria_created_at ON galeria(created_at DESC);

-- =============================================
-- 2. TABLA: GALERIA_LIKES (Likes en posts)
-- =============================================

-- Eliminar tabla si existe (solo para desarrollo)
DROP TABLE IF EXISTS galeria_likes CASCADE;

CREATE TABLE galeria_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  galeria_id UUID NOT NULL REFERENCES galeria(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(galeria_id, usuario_id)
);

-- Índices para performance
CREATE INDEX idx_galeria_likes_post ON galeria_likes(galeria_id);
CREATE INDEX idx_galeria_likes_user ON galeria_likes(usuario_id);

-- =============================================
-- 3. TABLA: GALERIA_COMENTARIOS (Comentarios)
-- =============================================

-- Eliminar tabla si existe (solo para desarrollo)
DROP TABLE IF EXISTS galeria_comentarios CASCADE;

CREATE TABLE galeria_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  galeria_id UUID NOT NULL REFERENCES galeria(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_comentarios_post ON galeria_comentarios(galeria_id);
CREATE INDEX idx_comentarios_user ON galeria_comentarios(usuario_id);

-- =============================================
-- 4. TABLA: PARCHES (Crews - Opción 1)
-- =============================================

-- Eliminar tabla si existe (solo para desarrollo)
DROP TABLE IF EXISTS parches CASCADE;

CREATE TABLE parches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  foto TEXT,
  fotos TEXT[] DEFAULT '{}',
  disciplinas TEXT[] NOT NULL,
  descripcion TEXT,
  miembros_aprox INTEGER,
  contacto JSONB,
  created_by UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_parches_created_by ON parches(created_by);
CREATE INDEX idx_parches_ciudad ON parches(ciudad);
CREATE INDEX idx_parches_is_global ON parches(is_global);

-- =============================================
-- 5. TABLA: SPOTS (Lugares para patinar)
-- =============================================

-- Eliminar tabla si existe (solo para desarrollo)
DROP TABLE IF EXISTS spots CASCADE;

CREATE TABLE spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  tipo TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  dificultad TEXT,
  foto TEXT,
  descripcion TEXT,
  created_by UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_spots_ciudad ON spots(ciudad);
CREATE INDEX idx_spots_tipo ON spots(tipo);
CREATE INDEX idx_spots_created_by ON spots(created_by);

-- =============================================
-- 6. TABLA: SPOTS_FAVORITOS (Spots guardados)
-- =============================================

-- Eliminar tabla si existe (solo para desarrollo)
DROP TABLE IF EXISTS spots_favoritos CASCADE;

CREATE TABLE spots_favoritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(usuario_id, spot_id)
);

-- Índices para performance
CREATE INDEX idx_spots_fav_user ON spots_favoritos(usuario_id);
CREATE INDEX idx_spots_fav_spot ON spots_favoritos(spot_id);

-- =============================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE galeria ENABLE ROW LEVEL SECURITY;
ALTER TABLE galeria_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE galeria_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE parches ENABLE ROW LEVEL SECURITY;
ALTER TABLE spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE spots_favoritos ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - GALERIA
-- =============================================

-- Eliminar policies existentes si las hay (por si acaso)
DROP POLICY IF EXISTS "Todos pueden ver galeria" ON galeria;
DROP POLICY IF EXISTS "Usuario puede crear post" ON galeria;
DROP POLICY IF EXISTS "Autor puede editar post" ON galeria;
DROP POLICY IF EXISTS "Autor puede eliminar post" ON galeria;

-- Todos pueden ver posts
CREATE POLICY "Todos pueden ver galeria" ON galeria
  FOR SELECT USING (true);

-- Solo usuario autenticado puede crear (sin auth por ahora)
CREATE POLICY "Usuario puede crear post" ON galeria
  FOR INSERT WITH CHECK (true);

-- Solo el autor puede editar (sin auth por ahora)
CREATE POLICY "Autor puede editar post" ON galeria
  FOR UPDATE USING (true);

-- Solo el autor puede eliminar (sin auth por ahora)
CREATE POLICY "Autor puede eliminar post" ON galeria
  FOR DELETE USING (true);

-- =============================================
-- RLS POLICIES - GALERIA_LIKES
-- =============================================

-- Eliminar policies existentes si las hay
DROP POLICY IF EXISTS "Todos ven likes" ON galeria_likes;
DROP POLICY IF EXISTS "Usuario da like" ON galeria_likes;
DROP POLICY IF EXISTS "Usuario quita like" ON galeria_likes;

-- Todos pueden ver likes
CREATE POLICY "Todos ven likes" ON galeria_likes
  FOR SELECT USING (true);

-- Usuario puede dar like
CREATE POLICY "Usuario da like" ON galeria_likes
  FOR INSERT WITH CHECK (true);

-- Usuario puede quitar su like
CREATE POLICY "Usuario quita like" ON galeria_likes
  FOR DELETE USING (true);

-- =============================================
-- RLS POLICIES - GALERIA_COMENTARIOS
-- =============================================

-- Eliminar policies existentes si las hay
DROP POLICY IF EXISTS "Todos ven comentarios" ON galeria_comentarios;
DROP POLICY IF EXISTS "Usuario comenta" ON galeria_comentarios;
DROP POLICY IF EXISTS "Usuario edita comentario" ON galeria_comentarios;
DROP POLICY IF EXISTS "Usuario elimina comentario" ON galeria_comentarios;

-- Todos pueden ver comentarios
CREATE POLICY "Todos ven comentarios" ON galeria_comentarios
  FOR SELECT USING (true);

-- Usuario puede comentar
CREATE POLICY "Usuario comenta" ON galeria_comentarios
  FOR INSERT WITH CHECK (true);

-- Usuario puede editar su comentario
CREATE POLICY "Usuario edita comentario" ON galeria_comentarios
  FOR UPDATE USING (true);

-- Usuario puede eliminar su comentario
CREATE POLICY "Usuario elimina comentario" ON galeria_comentarios
  FOR DELETE USING (true);

-- =============================================
-- RLS POLICIES - PARCHES
-- =============================================

-- Eliminar policies existentes si las hay
DROP POLICY IF EXISTS "Todos ven parches" ON parches;
DROP POLICY IF EXISTS "Usuario crea parche" ON parches;
DROP POLICY IF EXISTS "Autor edita parche" ON parches;
DROP POLICY IF EXISTS "Autor elimina parche" ON parches;

-- Todos pueden ver parches
CREATE POLICY "Todos ven parches" ON parches
  FOR SELECT USING (true);

-- Usuario puede crear parche
CREATE POLICY "Usuario crea parche" ON parches
  FOR INSERT WITH CHECK (true);

-- Autor puede editar su parche
CREATE POLICY "Autor edita parche" ON parches
  FOR UPDATE USING (true);

-- Autor puede eliminar su parche
CREATE POLICY "Autor elimina parche" ON parches
  FOR DELETE USING (true);

-- =============================================
-- RLS POLICIES - SPOTS
-- =============================================

-- Eliminar policies existentes si las hay
DROP POLICY IF EXISTS "Todos ven spots" ON spots;
DROP POLICY IF EXISTS "Usuario crea spot" ON spots;
DROP POLICY IF EXISTS "Autor edita spot" ON spots;
DROP POLICY IF EXISTS "Autor elimina spot" ON spots;

-- Todos pueden ver spots
CREATE POLICY "Todos ven spots" ON spots
  FOR SELECT USING (true);

-- Usuario puede crear spot
CREATE POLICY "Usuario crea spot" ON spots
  FOR INSERT WITH CHECK (true);

-- Autor puede editar su spot
CREATE POLICY "Autor edita spot" ON spots
  FOR UPDATE USING (true);

-- Autor puede eliminar su spot
CREATE POLICY "Autor elimina spot" ON spots
  FOR DELETE USING (true);

-- =============================================
-- RLS POLICIES - SPOTS_FAVORITOS
-- =============================================

-- Eliminar policies existentes si las hay
DROP POLICY IF EXISTS "Usuario ve favoritos" ON spots_favoritos;
DROP POLICY IF EXISTS "Usuario marca favorito" ON spots_favoritos;
DROP POLICY IF EXISTS "Usuario quita favorito" ON spots_favoritos;

-- Usuario ve sus favoritos
CREATE POLICY "Usuario ve favoritos" ON spots_favoritos
  FOR SELECT USING (true);

-- Usuario puede marcar favorito
CREATE POLICY "Usuario marca favorito" ON spots_favoritos
  FOR INSERT WITH CHECK (true);

-- Usuario puede quitar favorito
CREATE POLICY "Usuario quita favorito" ON spots_favoritos
  FOR DELETE USING (true);

-- =============================================
-- FUNCIONES PARA ACTUALIZAR CONTADORES
-- =============================================

-- Eliminar triggers existentes si los hay
DROP TRIGGER IF EXISTS trigger_update_galeria_likes_count ON galeria_likes;
DROP TRIGGER IF EXISTS trigger_update_galeria_comentarios_count ON galeria_comentarios;

-- Función para actualizar likes_count
CREATE OR REPLACE FUNCTION update_galeria_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE galeria 
    SET likes_count = (
      SELECT COUNT(*) FROM galeria_likes 
      WHERE galeria_id = NEW.galeria_id
    )
    WHERE id = NEW.galeria_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE galeria 
    SET likes_count = (
      SELECT COUNT(*) FROM galeria_likes 
      WHERE galeria_id = OLD.galeria_id
    )
    WHERE id = OLD.galeria_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para likes_count
CREATE TRIGGER trigger_update_galeria_likes_count
  AFTER INSERT OR DELETE ON galeria_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_galeria_likes_count();

-- Función para actualizar comentarios_count
CREATE OR REPLACE FUNCTION update_galeria_comentarios_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE galeria 
    SET comentarios_count = (
      SELECT COUNT(*) FROM galeria_comentarios 
      WHERE galeria_id = NEW.galeria_id
    )
    WHERE id = NEW.galeria_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE galeria 
    SET comentarios_count = (
      SELECT COUNT(*) FROM galeria_comentarios 
      WHERE galeria_id = OLD.galeria_id
    )
    WHERE id = OLD.galeria_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para comentarios_count
CREATE TRIGGER trigger_update_galeria_comentarios_count
  AFTER INSERT OR DELETE ON galeria_comentarios
  FOR EACH ROW
  EXECUTE FUNCTION update_galeria_comentarios_count();

-- =============================================
-- VERIFICACIÓN FINAL
-- =============================================

-- Ver todas las tablas creadas
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('galeria', 'galeria_likes', 'galeria_comentarios', 'parches', 'spots', 'spots_favoritos')
ORDER BY tablename;

-- Ver policies creadas
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('galeria', 'galeria_likes', 'galeria_comentarios', 'parches', 'spots', 'spots_favoritos')
ORDER BY tablename, policyname;

-- =============================================
-- ✅ LISTO! 
-- Ejecuta este archivo completo en Supabase SQL Editor
-- =============================================

-- =============================================
-- 7. TABLA: TRACKING_LIVE (Ubicaciones en tiempo real)
-- =============================================

-- Tabla para ubicar patinadores activos en el mapa (1 fila por usuario)
CREATE TABLE IF NOT EXISTS tracking_live (
  user_id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  speed NUMERIC,
  heading NUMERIC,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indices para consultas r‡pidas
CREATE INDEX IF NOT EXISTS idx_tracking_live_active ON tracking_live(is_active);
CREATE INDEX IF NOT EXISTS idx_tracking_live_updated ON tracking_live(updated_at DESC);

-- Habilitar RLS
ALTER TABLE tracking_live ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Todos pueden ver tracking live" ON tracking_live;
DROP POLICY IF EXISTS "Usuario crea tracking live" ON tracking_live;
DROP POLICY IF EXISTS "Usuario actualiza tracking live" ON tracking_live;
DROP POLICY IF EXISTS "Usuario elimina tracking live" ON tracking_live;

CREATE POLICY "Todos pueden ver tracking live" ON tracking_live
  FOR SELECT USING (true);

CREATE POLICY "Usuario crea tracking live" ON tracking_live
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuario actualiza tracking live" ON tracking_live
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuario elimina tracking live" ON tracking_live
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Verificaci¾n tracking_live
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'tracking_live';


-- =============================================
-- REALTIME: PUBLICATION PARA tracking_live
-- =============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.tracking_live;
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END IF;
END
$$;

-- =============================================
-- 8. TABLA: PARCHES_SEGUIDORES (Seguidores de parches/crews)
-- =============================================

DROP TABLE IF EXISTS parches_seguidores CASCADE;

CREATE TABLE parches_seguidores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parche_id UUID NOT NULL REFERENCES parches(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parche_id, usuario_id)
);

-- Índices para performance
CREATE INDEX idx_parches_seguidores_parche ON parches_seguidores(parche_id);
CREATE INDEX idx_parches_seguidores_usuario ON parches_seguidores(usuario_id);

-- Habilitar RLS
ALTER TABLE parches_seguidores ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Todos ven seguidores de parches" ON parches_seguidores;
DROP POLICY IF EXISTS "Usuario sigue parche" ON parches_seguidores;
DROP POLICY IF EXISTS "Usuario deja de seguir parche" ON parches_seguidores;

CREATE POLICY "Todos ven seguidores de parches" ON parches_seguidores
  FOR SELECT USING (true);

CREATE POLICY "Usuario sigue parche" ON parches_seguidores
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuario deja de seguir parche" ON parches_seguidores
  FOR DELETE USING (true);

-- =============================================
-- 9. TABLA: RODADAS (Eventos/Quedadas de grupo)
-- =============================================

DROP TABLE IF EXISTS rodadas_participantes CASCADE;
DROP TABLE IF EXISTS rodadas CASCADE;

CREATE TABLE rodadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  
  -- Punto de salida (obligatorio)
  punto_salida_nombre TEXT NOT NULL,
  punto_salida_lat NUMERIC NOT NULL,
  punto_salida_lng NUMERIC NOT NULL,
  punto_salida_place_id TEXT,
  
  -- Punto de llegada (opcional, puede ser igual a salida)
  punto_llegada_nombre TEXT,
  punto_llegada_lat NUMERIC,
  punto_llegada_lng NUMERIC,
  punto_llegada_place_id TEXT,
  
  -- Fecha y hora
  fecha_inicio TIMESTAMPTZ NOT NULL,
  hora_encuentro TEXT, -- Ej: "7:00 AM"
  
  -- Organizador
  organizador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  
  -- Parche asociado (opcional)
  parche_id UUID REFERENCES parches(id) ON DELETE SET NULL,
  
  -- Estado del evento
  estado TEXT DEFAULT 'programada' CHECK (estado IN ('programada', 'en_curso', 'finalizada', 'cancelada')),
  
  -- Detalles adicionales
  nivel_requerido TEXT, -- principiante, intermedio, avanzado, todos
  distancia_estimada NUMERIC, -- en km
  duracion_estimada INTEGER, -- en minutos
  imagen TEXT, -- URL de imagen del evento
  
  -- Contadores
  participantes_count INTEGER DEFAULT 0,
  max_participantes INTEGER, -- NULL = sin límite
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_rodadas_organizador ON rodadas(organizador_id);
CREATE INDEX idx_rodadas_parche ON rodadas(parche_id);
CREATE INDEX idx_rodadas_fecha ON rodadas(fecha_inicio);
CREATE INDEX idx_rodadas_estado ON rodadas(estado);
CREATE INDEX idx_rodadas_ubicacion ON rodadas(punto_salida_lat, punto_salida_lng);

-- Habilitar RLS
ALTER TABLE rodadas ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Todos ven rodadas" ON rodadas;
DROP POLICY IF EXISTS "Usuario crea rodada" ON rodadas;
DROP POLICY IF EXISTS "Organizador edita rodada" ON rodadas;
DROP POLICY IF EXISTS "Organizador elimina rodada" ON rodadas;

CREATE POLICY "Todos ven rodadas" ON rodadas
  FOR SELECT USING (true);

CREATE POLICY "Usuario crea rodada" ON rodadas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Organizador edita rodada" ON rodadas
  FOR UPDATE USING (true);

CREATE POLICY "Organizador elimina rodada" ON rodadas
  FOR DELETE USING (true);

-- =============================================
-- 10. TABLA: RODADAS_PARTICIPANTES (Usuarios en rodadas)
-- =============================================

CREATE TABLE rodadas_participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rodada_id UUID NOT NULL REFERENCES rodadas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  estado TEXT DEFAULT 'confirmado' CHECK (estado IN ('confirmado', 'pendiente', 'cancelado')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(rodada_id, usuario_id)
);

-- Índices para performance
CREATE INDEX idx_rodadas_participantes_rodada ON rodadas_participantes(rodada_id);
CREATE INDEX idx_rodadas_participantes_usuario ON rodadas_participantes(usuario_id);
CREATE INDEX idx_rodadas_participantes_estado ON rodadas_participantes(estado);

-- Habilitar RLS
ALTER TABLE rodadas_participantes ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Todos ven participantes" ON rodadas_participantes;
DROP POLICY IF EXISTS "Usuario se une a rodada" ON rodadas_participantes;
DROP POLICY IF EXISTS "Usuario actualiza participacion" ON rodadas_participantes;
DROP POLICY IF EXISTS "Usuario sale de rodada" ON rodadas_participantes;

CREATE POLICY "Todos ven participantes" ON rodadas_participantes
  FOR SELECT USING (true);

CREATE POLICY "Usuario se une a rodada" ON rodadas_participantes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuario actualiza participacion" ON rodadas_participantes
  FOR UPDATE USING (true);

CREATE POLICY "Usuario sale de rodada" ON rodadas_participantes
  FOR DELETE USING (true);

-- =============================================
-- FUNCIÓN PARA ACTUALIZAR CONTADOR DE PARTICIPANTES
-- =============================================

DROP TRIGGER IF EXISTS trigger_update_rodadas_participantes_count ON rodadas_participantes;

CREATE OR REPLACE FUNCTION update_rodadas_participantes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE rodadas 
    SET participantes_count = (
      SELECT COUNT(*) FROM rodadas_participantes 
      WHERE rodada_id = NEW.rodada_id AND estado = 'confirmado'
    )
    WHERE id = NEW.rodada_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE rodadas 
    SET participantes_count = (
      SELECT COUNT(*) FROM rodadas_participantes 
      WHERE rodada_id = OLD.rodada_id AND estado = 'confirmado'
    )
    WHERE id = OLD.rodada_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE rodadas 
    SET participantes_count = (
      SELECT COUNT(*) FROM rodadas_participantes 
      WHERE rodada_id = NEW.rodada_id AND estado = 'confirmado'
    )
    WHERE id = NEW.rodada_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para participantes_count
CREATE TRIGGER trigger_update_rodadas_participantes_count
  AFTER INSERT OR DELETE OR UPDATE ON rodadas_participantes
  FOR EACH ROW
  EXECUTE FUNCTION update_rodadas_participantes_count();

-- =============================================
-- REALTIME: PUBLICATION PARA rodadas
-- =============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.rodadas;
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.rodadas_participantes;
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END IF;
END
$$;

-- =============================================
-- VERIFICACIÓN FINAL - TODAS LAS TABLAS
-- =============================================

SELECT 
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'usuarios',
    'galeria', 
    'galeria_likes', 
    'galeria_comentarios', 
    'parches', 
    'parches_seguidores',
    'spots', 
    'spots_favoritos',
    'tracking_live',
    'rodadas',
    'rodadas_participantes'
  )
ORDER BY tablename;

-- =============================================
-- ✅ LISTO! 
-- Ejecuta este archivo completo en Supabase SQL Editor
-- =============================================

-- =============================================
-- MIGRACIONES IDEMPOTENTES (se pueden ejecutar múltiples veces)
-- Agregan columnas nuevas si no existen
-- =============================================

-- Agregar columna fotos a parches (para galería de imágenes del crew)
ALTER TABLE parches ADD COLUMN IF NOT EXISTS fotos TEXT[] DEFAULT '{}';

