-- =============================================
-- NOTIFICACIONES PUSH - TRIGGERS PARA COMENTARIOS Y SEGUIDORES
-- =============================================

-- Requiere:
-- - tabla notificaciones (ver setup-db/add_notifications.sql)
-- - tablas galeria, galeria_comentarios, parches, parches_seguidores, usuarios

-- =============================================
-- COMENTARIOS EN GALERIA
-- =============================================

DROP TRIGGER IF EXISTS trigger_insert_comment_notification ON galeria_comentarios;
DROP FUNCTION IF EXISTS insert_comment_notification();

CREATE OR REPLACE FUNCTION insert_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  commenter_name TEXT;
BEGIN
  SELECT usuario_id INTO post_owner_id
  FROM galeria
  WHERE id = NEW.galeria_id;

  IF post_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- No notificar auto-comentario
  IF post_owner_id = NEW.usuario_id THEN
    RETURN NEW;
  END IF;

  SELECT nombre INTO commenter_name
  FROM usuarios
  WHERE id = NEW.usuario_id;

  INSERT INTO notificaciones (
    user_id,
    tipo,
    titulo,
    body,
    galeria_id,
    comentario_id,
    from_user_id,
    data
  ) VALUES (
    post_owner_id,
    'comentario',
    'Nuevo comentario',
    COALESCE(commenter_name, 'Alguien') || ' comento tu foto',
    NEW.galeria_id,
    NEW.id,
    NEW.usuario_id,
    jsonb_build_object(
      'galeria_id', NEW.galeria_id,
      'comentario_id', NEW.id,
      'from_user_id', NEW.usuario_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_comment_notification
AFTER INSERT ON galeria_comentarios
FOR EACH ROW
EXECUTE FUNCTION insert_comment_notification();

-- =============================================
-- SEGUIDORES DE PARCHES
-- =============================================

DROP TRIGGER IF EXISTS trigger_insert_parche_follower_notification ON parches_seguidores;
DROP FUNCTION IF EXISTS insert_parche_follower_notification();

CREATE OR REPLACE FUNCTION insert_parche_follower_notification()
RETURNS TRIGGER AS $$
DECLARE
  parche_owner_id UUID;
  follower_name TEXT;
  parche_nombre TEXT;
BEGIN
  SELECT created_by, nombre INTO parche_owner_id, parche_nombre
  FROM parches
  WHERE id = NEW.parche_id;

  IF parche_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- No notificar auto-follow
  IF parche_owner_id = NEW.usuario_id THEN
    RETURN NEW;
  END IF;

  SELECT nombre INTO follower_name
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
    parche_owner_id,
    'seguidor',
    'Nuevo seguidor',
    COALESCE(follower_name, 'Alguien') || ' siguio tu parche ' || COALESCE(parche_nombre, ''),
    NEW.usuario_id,
    jsonb_build_object(
      'parche_id', NEW.parche_id,
      'from_user_id', NEW.usuario_id,
      'parche_seguidor_id', NEW.id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_parche_follower_notification
AFTER INSERT ON parches_seguidores
FOR EACH ROW
EXECUTE FUNCTION insert_parche_follower_notification();
