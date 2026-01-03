-- =============================================
-- NOTIFICACIONES PUSH - SOLO AGREGAR
-- =============================================

-- 1. Agregar columna expo_push_token a usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

CREATE INDEX IF NOT EXISTS idx_usuarios_expo_push_token 
ON usuarios(expo_push_token) 
WHERE expo_push_token IS NOT NULL;

-- 2. Crear tabla notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('like', 'comentario', 'seguidor', 'mencion', 'sistema')),
  titulo TEXT NOT NULL,
  body TEXT NOT NULL,
  galeria_id UUID REFERENCES galeria(id) ON DELETE CASCADE,
  comentario_id UUID REFERENCES galeria_comentarios(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  data JSONB DEFAULT '{}'::jsonb,
  leida BOOLEAN DEFAULT FALSE,
  enviada BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_notificaciones_user_id ON notificaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON notificaciones(tipo);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida) WHERE leida = FALSE;
CREATE INDEX IF NOT EXISTS idx_notificaciones_created_at ON notificaciones(created_at DESC);

-- 4. RLS
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notificaciones;
DROP POLICY IF EXISTS "Users can update own notifications" ON notificaciones;
DROP POLICY IF EXISTS "Service role can insert notifications" ON notificaciones;

CREATE POLICY "Users can view own notifications"
  ON notificaciones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notificaciones FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications"
  ON notificaciones FOR INSERT
  WITH CHECK (true);

-- 5. Realtime
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notificaciones;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;
