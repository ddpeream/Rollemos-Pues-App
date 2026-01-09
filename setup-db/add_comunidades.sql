-- =============================================
-- COMUNIDADES - NUEVAS TABLAS Y RELACIONES
-- =============================================

-- Tabla de comunidades
CREATE TABLE IF NOT EXISTS comunidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  ciudad TEXT,
  foto TEXT,
  fotos TEXT[],
  tags TEXT[],
  is_public BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE comunidades ADD COLUMN IF NOT EXISTS fotos TEXT[];

CREATE INDEX IF NOT EXISTS idx_comunidades_created_by ON comunidades(created_by);
CREATE INDEX IF NOT EXISTS idx_comunidades_ciudad ON comunidades(ciudad);
CREATE INDEX IF NOT EXISTS idx_comunidades_public ON comunidades(is_public);

ALTER TABLE comunidades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos ven comunidades" ON comunidades;
DROP POLICY IF EXISTS "Usuario crea comunidad" ON comunidades;
DROP POLICY IF EXISTS "Autor edita comunidad" ON comunidades;
DROP POLICY IF EXISTS "Autor elimina comunidad" ON comunidades;

CREATE POLICY "Todos ven comunidades" ON comunidades
  FOR SELECT USING (true);

CREATE POLICY "Usuario crea comunidad" ON comunidades
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Autor edita comunidad" ON comunidades
  FOR UPDATE USING (true);

CREATE POLICY "Autor elimina comunidad" ON comunidades
  FOR DELETE USING (true);

-- Lideres de comunidades
CREATE TABLE IF NOT EXISTS comunidades_lideres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comunidad_id UUID NOT NULL REFERENCES comunidades(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_by UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comunidad_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_comunidades_lideres_comunidad ON comunidades_lideres(comunidad_id);
CREATE INDEX IF NOT EXISTS idx_comunidades_lideres_usuario ON comunidades_lideres(usuario_id);

ALTER TABLE comunidades_lideres ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos ven lideres de comunidades" ON comunidades_lideres;
DROP POLICY IF EXISTS "Usuario agrega lider de comunidad" ON comunidades_lideres;
DROP POLICY IF EXISTS "Usuario elimina lider de comunidad" ON comunidades_lideres;

CREATE POLICY "Todos ven lideres de comunidades" ON comunidades_lideres
  FOR SELECT USING (true);

CREATE POLICY "Usuario agrega lider de comunidad" ON comunidades_lideres
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuario elimina lider de comunidad" ON comunidades_lideres
  FOR DELETE USING (true);

-- Seguidores de comunidades
CREATE TABLE IF NOT EXISTS comunidades_seguidores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comunidad_id UUID NOT NULL REFERENCES comunidades(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comunidad_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_comunidades_seguidores_comunidad ON comunidades_seguidores(comunidad_id);
CREATE INDEX IF NOT EXISTS idx_comunidades_seguidores_usuario ON comunidades_seguidores(usuario_id);

ALTER TABLE comunidades_seguidores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos ven seguidores de comunidades" ON comunidades_seguidores;
DROP POLICY IF EXISTS "Usuario sigue comunidad" ON comunidades_seguidores;
DROP POLICY IF EXISTS "Usuario deja de seguir comunidad" ON comunidades_seguidores;

CREATE POLICY "Todos ven seguidores de comunidades" ON comunidades_seguidores
  FOR SELECT USING (true);

CREATE POLICY "Usuario sigue comunidad" ON comunidades_seguidores
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuario deja de seguir comunidad" ON comunidades_seguidores
  FOR DELETE USING (true);

-- Agregar comunidad_id a rodadas
ALTER TABLE rodadas ADD COLUMN IF NOT EXISTS comunidad_id UUID REFERENCES comunidades(id) ON DELETE SET NULL;
ALTER TABLE rodadas ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'rodada' CHECK (tipo IN ('rodada', 'entreno'));
CREATE INDEX IF NOT EXISTS idx_rodadas_comunidad ON rodadas(comunidad_id);

-- Asegurar tipo 'rodada' en notificaciones
ALTER TABLE notificaciones
  DROP CONSTRAINT IF EXISTS notificaciones_tipo_check;

ALTER TABLE notificaciones
  ADD CONSTRAINT notificaciones_tipo_check
  CHECK (tipo IN ('like', 'comentario', 'seguidor', 'mencion', 'sistema', 'rodada'));

-- Trigger para notificar seguidores cuando se crea una rodada en comunidad
DROP TRIGGER IF EXISTS trigger_insert_comunidad_rodada_notifications ON rodadas;
DROP FUNCTION IF EXISTS insert_comunidad_rodada_notifications();

CREATE OR REPLACE FUNCTION insert_comunidad_rodada_notifications()
RETURNS TRIGGER AS $$
DECLARE
  comunidad_nombre TEXT;
BEGIN
  IF NEW.comunidad_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT nombre INTO comunidad_nombre
  FROM comunidades
  WHERE id = NEW.comunidad_id;

  INSERT INTO notificaciones (
    user_id,
    tipo,
    titulo,
    body,
    from_user_id,
    data
  )
  SELECT
    cs.usuario_id,
    'rodada',
    'Nueva rodada en comunidad',
    'Se creo una nueva rodada en ' || COALESCE(comunidad_nombre, ''),
    NEW.organizador_id,
    jsonb_build_object(
      'rodada_id', NEW.id,
      'comunidad_id', NEW.comunidad_id
    )
  FROM comunidades_seguidores cs
  WHERE cs.comunidad_id = NEW.comunidad_id
    AND cs.usuario_id <> NEW.organizador_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_comunidad_rodada_notifications
AFTER INSERT ON rodadas
FOR EACH ROW
EXECUTE FUNCTION insert_comunidad_rodada_notifications();

-- Trigger para notificar cuando agregan un lider
DROP TRIGGER IF EXISTS trigger_insert_comunidad_lider_notifications ON comunidades_lideres;
DROP FUNCTION IF EXISTS insert_comunidad_lider_notifications();

CREATE OR REPLACE FUNCTION insert_comunidad_lider_notifications()
RETURNS TRIGGER AS $$
DECLARE
  comunidad_nombre TEXT;
  actor_nombre TEXT;
BEGIN
  SELECT nombre INTO comunidad_nombre
  FROM comunidades
  WHERE id = NEW.comunidad_id;

  SELECT nombre INTO actor_nombre
  FROM usuarios
  WHERE id = NEW.created_by;

  INSERT INTO notificaciones (
    user_id,
    tipo,
    titulo,
    body,
    from_user_id,
    data
  )
  VALUES (
    NEW.usuario_id,
    'sistema',
    'Ahora eres lider',
    COALESCE(actor_nombre, 'Alguien') || ' te agrego como lider en ' || COALESCE(comunidad_nombre, ''),
    NEW.created_by,
    jsonb_build_object(
      'comunidad_id', NEW.comunidad_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_comunidad_lider_notifications
AFTER INSERT ON comunidades_lideres
FOR EACH ROW
EXECUTE FUNCTION insert_comunidad_lider_notifications();

-- Trigger para notificar cuando alguien se une a una comunidad
DROP TRIGGER IF EXISTS trigger_insert_comunidad_join_notifications ON comunidades_seguidores;
DROP FUNCTION IF EXISTS insert_comunidad_join_notifications();

CREATE OR REPLACE FUNCTION insert_comunidad_join_notifications()
RETURNS TRIGGER AS $$
DECLARE
  comunidad_nombre TEXT;
  usuario_nombre TEXT;
BEGIN
  SELECT nombre INTO comunidad_nombre
  FROM comunidades
  WHERE id = NEW.comunidad_id;

  SELECT nombre INTO usuario_nombre
  FROM usuarios
  WHERE id = NEW.usuario_id;

  INSERT INTO notificaciones (
    user_id,
    tipo,
    titulo,
    body,
    from_user_id,
    data
  )
  SELECT DISTINCT
    destinatario_id,
    'sistema',
    'Nuevo miembro',
    COALESCE(usuario_nombre, 'Alguien') || ' se unio a ' || COALESCE(comunidad_nombre, ''),
    NEW.usuario_id,
    jsonb_build_object(
      'comunidad_id', NEW.comunidad_id
    )
  FROM (
    SELECT c.created_by AS destinatario_id
    FROM comunidades c
    WHERE c.id = NEW.comunidad_id
    UNION
    SELECT cl.usuario_id AS destinatario_id
    FROM comunidades_lideres cl
    WHERE cl.comunidad_id = NEW.comunidad_id
  ) destinatarios
  WHERE destinatario_id IS NOT NULL
    AND destinatario_id <> NEW.usuario_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_comunidad_join_notifications
AFTER INSERT ON comunidades_seguidores
FOR EACH ROW
EXECUTE FUNCTION insert_comunidad_join_notifications();

-- Trigger para notificar cuando alguien sale de una comunidad
DROP TRIGGER IF EXISTS trigger_delete_comunidad_leave_notifications ON comunidades_seguidores;
DROP FUNCTION IF EXISTS delete_comunidad_leave_notifications();

CREATE OR REPLACE FUNCTION delete_comunidad_leave_notifications()
RETURNS TRIGGER AS $$
DECLARE
  comunidad_nombre TEXT;
  usuario_nombre TEXT;
BEGIN
  SELECT nombre INTO comunidad_nombre
  FROM comunidades
  WHERE id = OLD.comunidad_id;

  SELECT nombre INTO usuario_nombre
  FROM usuarios
  WHERE id = OLD.usuario_id;

  INSERT INTO notificaciones (
    user_id,
    tipo,
    titulo,
    body,
    from_user_id,
    data
  )
  SELECT DISTINCT
    destinatario_id,
    'sistema',
    'Miembro se fue',
    COALESCE(usuario_nombre, 'Alguien') || ' salio de ' || COALESCE(comunidad_nombre, ''),
    OLD.usuario_id,
    jsonb_build_object(
      'comunidad_id', OLD.comunidad_id
    )
  FROM (
    SELECT c.created_by AS destinatario_id
    FROM comunidades c
    WHERE c.id = OLD.comunidad_id
    UNION
    SELECT cl.usuario_id AS destinatario_id
    FROM comunidades_lideres cl
    WHERE cl.comunidad_id = OLD.comunidad_id
  ) destinatarios
  WHERE destinatario_id IS NOT NULL
    AND destinatario_id <> OLD.usuario_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_comunidad_leave_notifications
AFTER DELETE ON comunidades_seguidores
FOR EACH ROW
EXECUTE FUNCTION delete_comunidad_leave_notifications();

-- Realtime
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.comunidades;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.comunidades_seguidores;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.comunidades_lideres;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;
