-- =============================================
-- NOTIFICACIONES PUSH - TRIGGER PARA RODADAS
-- =============================================

-- Requiere:
-- - tabla notificaciones (ver setup-db/add_notifications.sql)
-- - tablas rodadas, rodadas_participantes, usuarios (ver setup-db/setup_supabase.sql)

-- 1) Asegurar tipo 'rodada' en la tabla notificaciones
ALTER TABLE notificaciones
  DROP CONSTRAINT IF EXISTS notificaciones_tipo_check;

ALTER TABLE notificaciones
  ADD CONSTRAINT notificaciones_tipo_check
  CHECK (tipo IN ('like', 'comentario', 'seguidor', 'mencion', 'sistema', 'rodada'));

-- 2) Trigger: insertar notificacion cuando alguien se une a una rodada
DROP TRIGGER IF EXISTS trigger_insert_rodada_join_notification ON rodadas_participantes;
DROP FUNCTION IF EXISTS insert_rodada_join_notification();

CREATE OR REPLACE FUNCTION insert_rodada_join_notification()
RETURNS TRIGGER AS $$
DECLARE
  organizer_id UUID;
  user_name TEXT;
  rodada_nombre TEXT;
BEGIN
  SELECT organizador_id, nombre INTO organizer_id, rodada_nombre
  FROM rodadas
  WHERE id = NEW.rodada_id;

  IF organizer_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- No notificar si el organizador se une a su propia rodada
  IF organizer_id = NEW.usuario_id THEN
    RETURN NEW;
  END IF;

  SELECT nombre INTO user_name
  FROM usuarios
  WHERE id = NEW.usuario_id;

  INSERT INTO notificaciones (
    user_id,
    tipo,
    titulo,
    body,
    from_user_id,
    data
  ) VALUES (
    organizer_id,
    'rodada',
    'Nuevo participante',
    COALESCE(user_name, 'Alguien') || ' se unio a tu rodada ' || COALESCE(rodada_nombre, ''),
    NEW.usuario_id,
    jsonb_build_object(
      'rodada_id', NEW.rodada_id,
      'from_user_id', NEW.usuario_id,
      'rodada_participante_id', NEW.id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_rodada_join_notification
AFTER INSERT ON rodadas_participantes
FOR EACH ROW
EXECUTE FUNCTION insert_rodada_join_notification();
