-- =============================================
-- NOTIFICACIONES PUSH - TRIGGER PARA LIKES
-- =============================================

-- Requiere:
-- - tabla notificaciones (ver setup-db/add_notifications.sql)
-- - tablas galeria, galeria_likes, usuarios (ver setup-db/setup_supabase.sql)

-- Elimina trigger y funcion si ya existen
DROP TRIGGER IF EXISTS trigger_insert_like_notification ON galeria_likes;
DROP FUNCTION IF EXISTS insert_like_notification();

-- Inserta una notificacion cuando alguien da like
CREATE OR REPLACE FUNCTION insert_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  liker_name TEXT;
BEGIN
  -- Obtener el propietario del post
  SELECT usuario_id INTO post_owner_id
  FROM galeria
  WHERE id = NEW.galeria_id;

  IF post_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- No notificar auto-like
  IF post_owner_id = NEW.usuario_id THEN
    RETURN NEW;
  END IF;

  SELECT nombre INTO liker_name
  FROM usuarios
  WHERE id = NEW.usuario_id;

  INSERT INTO notificaciones (
    user_id,
    tipo,
    titulo,
    body,
    galeria_id,
    from_user_id,
    data
  ) VALUES (
    post_owner_id,
    'like',
    'Nuevo like',
    COALESCE(liker_name, 'Alguien') || ' dio like a tu foto',
    NEW.galeria_id,
    NEW.usuario_id,
    jsonb_build_object(
      'galeria_id', NEW.galeria_id,
      'from_user_id', NEW.usuario_id,
      'galeria_like_id', NEW.id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificaciones de like
CREATE TRIGGER trigger_insert_like_notification
AFTER INSERT ON galeria_likes
FOR EACH ROW
EXECUTE FUNCTION insert_like_notification();
