-- Remote schema baseline captured from Supabase project fmkwqfnvtpuqtpgkengs.
-- This migration contains schema and application infrastructure only; it contains no user rows.
-- Apply it only to a fresh Supabase database. The production project is marked separately as already baselined.
--
-- The remote trigger public.notificaciones_insert_push is intentionally excluded because its definition
-- embeds a service-role credential. Recreate that integration through secret-backed deployment configuration.

SET search_path = public, extensions;

-- -----------------------------------------------------------------------------
-- Public tables
-- -----------------------------------------------------------------------------

CREATE TABLE public.comunidades (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  ciudad text,
  foto text,
  tags text[],
  is_public boolean DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  fotos text[]);

CREATE TABLE public.comunidades_lideres (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  comunidad_id uuid NOT NULL,
  usuario_id uuid NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now());

CREATE TABLE public.comunidades_seguidores (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  comunidad_id uuid NOT NULL,
  usuario_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now());

CREATE TABLE public.galeria (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  usuario_id uuid NOT NULL,
  imagen text NOT NULL,
  descripcion text,
  likes_count integer DEFAULT 0,
  comentarios_count integer DEFAULT 0,
  ubicacion text,
  aspect_ratio numeric DEFAULT 0.75,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now());

CREATE TABLE public.galeria_comentarios (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  galeria_id uuid NOT NULL,
  usuario_id uuid NOT NULL,
  texto text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now());

CREATE TABLE public.galeria_likes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  galeria_id uuid NOT NULL,
  usuario_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now());

CREATE TABLE public.marketplace_productos (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  whatsapp text,
  precio numeric NOT NULL,
  categoria text NOT NULL,
  imagenes text[] DEFAULT '{}'::text[] NOT NULL,
  vendedor_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now());

CREATE TABLE public.notificaciones (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  tipo text NOT NULL,
  titulo text NOT NULL,
  body text NOT NULL,
  galeria_id uuid,
  comentario_id uuid,
  from_user_id uuid,
  data jsonb DEFAULT '{}'::jsonb,
  leida boolean DEFAULT false,
  enviada boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now());

CREATE TABLE public.parches (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  nombre text NOT NULL,
  ciudad text NOT NULL,
  foto text,
  fotos text[] DEFAULT '{}'::text[],
  disciplinas text[] NOT NULL,
  descripcion text,
  miembros_aprox integer,
  contacto jsonb,
  created_by uuid NOT NULL,
  is_global boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now());

CREATE TABLE public.parches_seguidores (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  parche_id uuid NOT NULL,
  usuario_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now());

CREATE TABLE public.rodadas (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  punto_salida_nombre text NOT NULL,
  punto_salida_lat numeric NOT NULL,
  punto_salida_lng numeric NOT NULL,
  punto_salida_place_id text,
  punto_llegada_nombre text,
  punto_llegada_lat numeric,
  punto_llegada_lng numeric,
  punto_llegada_place_id text,
  fecha_inicio timestamp with time zone NOT NULL,
  hora_encuentro text,
  organizador_id uuid NOT NULL,
  parche_id uuid,
  estado text DEFAULT 'programada'::text,
  nivel_requerido text,
  distancia_estimada numeric,
  duracion_estimada integer,
  imagen text,
  participantes_count integer DEFAULT 0,
  max_participantes integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  comunidad_id uuid,
  tipo text DEFAULT 'rodada'::text);

CREATE TABLE public.rodadas_participantes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  rodada_id uuid NOT NULL,
  usuario_id uuid NOT NULL,
  estado text DEFAULT 'confirmado'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now());

CREATE TABLE public.spots (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  nombre text NOT NULL,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  tipo text NOT NULL,
  ciudad text NOT NULL,
  dificultad text,
  foto text,
  descripcion text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now());

CREATE TABLE public.spots_favoritos (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  usuario_id uuid NOT NULL,
  spot_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now());

CREATE TABLE public.tracking_live (
  user_id uuid NOT NULL,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  speed numeric,
  heading numeric,
  is_active boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now());

CREATE TABLE public.usuarios (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  email text NOT NULL,
  nombre text NOT NULL,
  avatar_url text,
  ciudad text,
  nivel text,
  disciplina text,
  bio text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  expo_push_token text);

-- -----------------------------------------------------------------------------
-- Table constraints
-- -----------------------------------------------------------------------------

ALTER TABLE ONLY public.comunidades ADD CONSTRAINT comunidades_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.comunidades_lideres ADD CONSTRAINT comunidades_lideres_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.comunidades_seguidores ADD CONSTRAINT comunidades_seguidores_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.galeria ADD CONSTRAINT galeria_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.galeria_comentarios ADD CONSTRAINT galeria_comentarios_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.galeria_likes ADD CONSTRAINT galeria_likes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.marketplace_productos ADD CONSTRAINT marketplace_productos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.notificaciones ADD CONSTRAINT notificaciones_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.parches ADD CONSTRAINT parches_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.parches_seguidores ADD CONSTRAINT parches_seguidores_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.rodadas ADD CONSTRAINT rodadas_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.rodadas_participantes ADD CONSTRAINT rodadas_participantes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.spots ADD CONSTRAINT spots_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.spots_favoritos ADD CONSTRAINT spots_favoritos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tracking_live ADD CONSTRAINT tracking_live_pkey PRIMARY KEY (user_id);

ALTER TABLE ONLY public.usuarios ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.comunidades_lideres ADD CONSTRAINT comunidades_lideres_comunidad_id_usuario_id_key UNIQUE (comunidad_id, usuario_id);

ALTER TABLE ONLY public.comunidades_seguidores ADD CONSTRAINT comunidades_seguidores_comunidad_id_usuario_id_key UNIQUE (comunidad_id, usuario_id);

ALTER TABLE ONLY public.galeria_likes ADD CONSTRAINT galeria_likes_galeria_id_usuario_id_key UNIQUE (galeria_id, usuario_id);

ALTER TABLE ONLY public.parches_seguidores ADD CONSTRAINT parches_seguidores_parche_id_usuario_id_key UNIQUE (parche_id, usuario_id);

ALTER TABLE ONLY public.rodadas_participantes ADD CONSTRAINT rodadas_participantes_rodada_id_usuario_id_key UNIQUE (rodada_id, usuario_id);

ALTER TABLE ONLY public.spots_favoritos ADD CONSTRAINT spots_favoritos_usuario_id_spot_id_key UNIQUE (usuario_id, spot_id);

ALTER TABLE ONLY public.usuarios ADD CONSTRAINT usuarios_email_key UNIQUE (email);

ALTER TABLE ONLY public.notificaciones ADD CONSTRAINT notificaciones_tipo_check CHECK (tipo = ANY (ARRAY['like'::text, 'comentario'::text, 'seguidor'::text, 'mencion'::text, 'sistema'::text, 'rodada'::text]));

ALTER TABLE ONLY public.rodadas ADD CONSTRAINT rodadas_estado_check CHECK (estado = ANY (ARRAY['programada'::text, 'en_curso'::text, 'finalizada'::text, 'cancelada'::text]));

ALTER TABLE ONLY public.rodadas ADD CONSTRAINT rodadas_tipo_check CHECK (tipo = ANY (ARRAY['rodada'::text, 'entreno'::text]));

ALTER TABLE ONLY public.rodadas_participantes ADD CONSTRAINT rodadas_participantes_estado_check CHECK (estado = ANY (ARRAY['confirmado'::text, 'pendiente'::text, 'cancelado'::text]));

ALTER TABLE ONLY public.comunidades ADD CONSTRAINT comunidades_created_by_fkey FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.comunidades_lideres ADD CONSTRAINT comunidades_lideres_comunidad_id_fkey FOREIGN KEY (comunidad_id) REFERENCES comunidades(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.comunidades_lideres ADD CONSTRAINT comunidades_lideres_created_by_fkey FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.comunidades_lideres ADD CONSTRAINT comunidades_lideres_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.comunidades_seguidores ADD CONSTRAINT comunidades_seguidores_comunidad_id_fkey FOREIGN KEY (comunidad_id) REFERENCES comunidades(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.comunidades_seguidores ADD CONSTRAINT comunidades_seguidores_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.galeria ADD CONSTRAINT galeria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.galeria_comentarios ADD CONSTRAINT galeria_comentarios_galeria_id_fkey FOREIGN KEY (galeria_id) REFERENCES galeria(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.galeria_comentarios ADD CONSTRAINT galeria_comentarios_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.galeria_likes ADD CONSTRAINT galeria_likes_galeria_id_fkey FOREIGN KEY (galeria_id) REFERENCES galeria(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.galeria_likes ADD CONSTRAINT galeria_likes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.marketplace_productos ADD CONSTRAINT marketplace_productos_vendedor_id_fkey FOREIGN KEY (vendedor_id) REFERENCES usuarios(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.notificaciones ADD CONSTRAINT notificaciones_comentario_id_fkey FOREIGN KEY (comentario_id) REFERENCES galeria_comentarios(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.notificaciones ADD CONSTRAINT notificaciones_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES usuarios(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.notificaciones ADD CONSTRAINT notificaciones_galeria_id_fkey FOREIGN KEY (galeria_id) REFERENCES galeria(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.notificaciones ADD CONSTRAINT notificaciones_user_id_fkey FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.parches ADD CONSTRAINT parches_created_by_fkey FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.parches_seguidores ADD CONSTRAINT parches_seguidores_parche_id_fkey FOREIGN KEY (parche_id) REFERENCES parches(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.parches_seguidores ADD CONSTRAINT parches_seguidores_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.rodadas ADD CONSTRAINT rodadas_comunidad_id_fkey FOREIGN KEY (comunidad_id) REFERENCES comunidades(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.rodadas ADD CONSTRAINT rodadas_organizador_id_fkey FOREIGN KEY (organizador_id) REFERENCES usuarios(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.rodadas ADD CONSTRAINT rodadas_parche_id_fkey FOREIGN KEY (parche_id) REFERENCES parches(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.rodadas_participantes ADD CONSTRAINT rodadas_participantes_rodada_id_fkey FOREIGN KEY (rodada_id) REFERENCES rodadas(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.rodadas_participantes ADD CONSTRAINT rodadas_participantes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.spots ADD CONSTRAINT spots_created_by_fkey FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.spots_favoritos ADD CONSTRAINT spots_favoritos_spot_id_fkey FOREIGN KEY (spot_id) REFERENCES spots(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.spots_favoritos ADD CONSTRAINT spots_favoritos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.tracking_live ADD CONSTRAINT tracking_live_user_id_fkey FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE;
-- -----------------------------------------------------------------------------
-- Standalone indexes
-- -----------------------------------------------------------------------------

CREATE INDEX idx_comunidades_ciudad ON public.comunidades USING btree (ciudad);

CREATE INDEX idx_comunidades_created_by ON public.comunidades USING btree (created_by);

CREATE INDEX idx_comunidades_public ON public.comunidades USING btree (is_public);

CREATE INDEX idx_comunidades_lideres_comunidad ON public.comunidades_lideres USING btree (comunidad_id);

CREATE INDEX idx_comunidades_lideres_usuario ON public.comunidades_lideres USING btree (usuario_id);

CREATE INDEX idx_comunidades_seguidores_comunidad ON public.comunidades_seguidores USING btree (comunidad_id);

CREATE INDEX idx_comunidades_seguidores_usuario ON public.comunidades_seguidores USING btree (usuario_id);

CREATE INDEX idx_galeria_created_at ON public.galeria USING btree (created_at DESC);

CREATE INDEX idx_galeria_usuario ON public.galeria USING btree (usuario_id);

CREATE INDEX idx_comentarios_post ON public.galeria_comentarios USING btree (galeria_id);

CREATE INDEX idx_comentarios_user ON public.galeria_comentarios USING btree (usuario_id);

CREATE INDEX idx_galeria_likes_post ON public.galeria_likes USING btree (galeria_id);

CREATE INDEX idx_galeria_likes_user ON public.galeria_likes USING btree (usuario_id);

CREATE INDEX idx_marketplace_productos_categoria ON public.marketplace_productos USING btree (categoria);

CREATE INDEX idx_marketplace_productos_created_at ON public.marketplace_productos USING btree (created_at DESC);

CREATE INDEX idx_marketplace_productos_vendedor ON public.marketplace_productos USING btree (vendedor_id);

CREATE INDEX idx_notificaciones_created_at ON public.notificaciones USING btree (created_at DESC);

CREATE INDEX idx_notificaciones_leida ON public.notificaciones USING btree (leida) WHERE (leida = false);

CREATE INDEX idx_notificaciones_tipo ON public.notificaciones USING btree (tipo);

CREATE INDEX idx_notificaciones_user_id ON public.notificaciones USING btree (user_id);

CREATE INDEX idx_parches_ciudad ON public.parches USING btree (ciudad);

CREATE INDEX idx_parches_created_by ON public.parches USING btree (created_by);

CREATE INDEX idx_parches_is_global ON public.parches USING btree (is_global);

CREATE INDEX idx_parches_seguidores_parche ON public.parches_seguidores USING btree (parche_id);

CREATE INDEX idx_parches_seguidores_usuario ON public.parches_seguidores USING btree (usuario_id);

CREATE INDEX idx_rodadas_comunidad ON public.rodadas USING btree (comunidad_id);

CREATE INDEX idx_rodadas_estado ON public.rodadas USING btree (estado);

CREATE INDEX idx_rodadas_fecha ON public.rodadas USING btree (fecha_inicio);

CREATE INDEX idx_rodadas_organizador ON public.rodadas USING btree (organizador_id);

CREATE INDEX idx_rodadas_parche ON public.rodadas USING btree (parche_id);

CREATE INDEX idx_rodadas_ubicacion ON public.rodadas USING btree (punto_salida_lat, punto_salida_lng);

CREATE INDEX idx_rodadas_participantes_estado ON public.rodadas_participantes USING btree (estado);

CREATE INDEX idx_rodadas_participantes_rodada ON public.rodadas_participantes USING btree (rodada_id);

CREATE INDEX idx_rodadas_participantes_usuario ON public.rodadas_participantes USING btree (usuario_id);

CREATE INDEX idx_spots_ciudad ON public.spots USING btree (ciudad);

CREATE INDEX idx_spots_created_by ON public.spots USING btree (created_by);

CREATE INDEX idx_spots_tipo ON public.spots USING btree (tipo);

CREATE INDEX idx_spots_fav_spot ON public.spots_favoritos USING btree (spot_id);

CREATE INDEX idx_spots_fav_user ON public.spots_favoritos USING btree (usuario_id);

CREATE INDEX idx_tracking_live_active ON public.tracking_live USING btree (is_active);

CREATE INDEX idx_tracking_live_updated ON public.tracking_live USING btree (updated_at DESC);

CREATE INDEX idx_usuarios_expo_push_token ON public.usuarios USING btree (expo_push_token) WHERE (expo_push_token IS NOT NULL);

-- -----------------------------------------------------------------------------
-- Public functions
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.delete_comunidad_leave_notifications()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.insert_comment_notification()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.insert_comunidad_join_notifications()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.insert_comunidad_lider_notifications()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.insert_comunidad_rodada_notifications()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.insert_like_notification()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.insert_parche_follower_notification()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.insert_rodada_join_notification()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_galeria_comentarios_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_galeria_likes_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_rodadas_participantes_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

-- -----------------------------------------------------------------------------
-- Public triggers
-- -----------------------------------------------------------------------------

CREATE TRIGGER trigger_insert_comunidad_lider_notifications AFTER INSERT ON comunidades_lideres FOR EACH ROW EXECUTE FUNCTION insert_comunidad_lider_notifications();

CREATE TRIGGER trigger_delete_comunidad_leave_notifications AFTER DELETE ON comunidades_seguidores FOR EACH ROW EXECUTE FUNCTION delete_comunidad_leave_notifications();

CREATE TRIGGER trigger_insert_comunidad_join_notifications AFTER INSERT ON comunidades_seguidores FOR EACH ROW EXECUTE FUNCTION insert_comunidad_join_notifications();

CREATE TRIGGER trigger_insert_comment_notification AFTER INSERT ON galeria_comentarios FOR EACH ROW EXECUTE FUNCTION insert_comment_notification();

CREATE TRIGGER trigger_update_galeria_comentarios_count AFTER INSERT OR DELETE ON galeria_comentarios FOR EACH ROW EXECUTE FUNCTION update_galeria_comentarios_count();

CREATE TRIGGER trigger_insert_like_notification AFTER INSERT ON galeria_likes FOR EACH ROW EXECUTE FUNCTION insert_like_notification();

CREATE TRIGGER trigger_update_galeria_likes_count AFTER INSERT OR DELETE ON galeria_likes FOR EACH ROW EXECUTE FUNCTION update_galeria_likes_count();

CREATE TRIGGER trigger_set_updated_at_marketplace_productos BEFORE UPDATE ON marketplace_productos FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trigger_insert_parche_follower_notification AFTER INSERT ON parches_seguidores FOR EACH ROW EXECUTE FUNCTION insert_parche_follower_notification();

CREATE TRIGGER trigger_insert_comunidad_rodada_notifications AFTER INSERT ON rodadas FOR EACH ROW EXECUTE FUNCTION insert_comunidad_rodada_notifications();

CREATE TRIGGER trigger_insert_rodada_join_notification AFTER INSERT ON rodadas_participantes FOR EACH ROW EXECUTE FUNCTION insert_rodada_join_notification();

CREATE TRIGGER trigger_update_rodadas_participantes_count AFTER INSERT OR DELETE OR UPDATE ON rodadas_participantes FOR EACH ROW EXECUTE FUNCTION update_rodadas_participantes_count();

-- -----------------------------------------------------------------------------
-- Row level security state
-- -----------------------------------------------------------------------------

ALTER TABLE public.comunidades ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.comunidades_lideres ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.comunidades_seguidores ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.galeria ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.galeria_comentarios ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.galeria_likes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.marketplace_productos ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.parches ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.parches_seguidores ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.rodadas ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.rodadas_participantes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.spots ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.spots_favoritos ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tracking_live ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Public schema policies
-- -----------------------------------------------------------------------------

CREATE POLICY "Autor edita comunidad" ON public.comunidades AS PERMISSIVE FOR UPDATE TO public USING (true);

CREATE POLICY "Autor elimina comunidad" ON public.comunidades AS PERMISSIVE FOR DELETE TO public USING (true);

CREATE POLICY "Todos ven comunidades" ON public.comunidades AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY "Usuario crea comunidad" ON public.comunidades AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Todos ven lideres de comunidades" ON public.comunidades_lideres AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY "Usuario agrega lider de comunidad" ON public.comunidades_lideres AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Usuario elimina lider de comunidad" ON public.comunidades_lideres AS PERMISSIVE FOR DELETE TO public USING (true);

CREATE POLICY "Todos ven seguidores de comunidades" ON public.comunidades_seguidores AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY "Usuario deja de seguir comunidad" ON public.comunidades_seguidores AS PERMISSIVE FOR DELETE TO public USING (true);

CREATE POLICY "Usuario sigue comunidad" ON public.comunidades_seguidores AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Autor puede editar post" ON public.galeria AS PERMISSIVE FOR UPDATE TO public USING (true);

CREATE POLICY "Autor puede eliminar post" ON public.galeria AS PERMISSIVE FOR DELETE TO public USING (true);

CREATE POLICY "Todos pueden ver galeria" ON public.galeria AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY "Usuario puede crear post" ON public.galeria AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Todos ven comentarios" ON public.galeria_comentarios AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY "Usuario comenta" ON public.galeria_comentarios AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Usuario edita comentario" ON public.galeria_comentarios AS PERMISSIVE FOR UPDATE TO public USING (true);

CREATE POLICY "Usuario elimina comentario" ON public.galeria_comentarios AS PERMISSIVE FOR DELETE TO public USING (true);

CREATE POLICY "Todos ven likes" ON public.galeria_likes AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY "Usuario da like" ON public.galeria_likes AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Usuario quita like" ON public.galeria_likes AS PERMISSIVE FOR DELETE TO public USING (true);

CREATE POLICY "Todos ven productos marketplace" ON public.marketplace_productos AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY "Usuario crea producto marketplace" ON public.marketplace_productos AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Usuario edita producto marketplace" ON public.marketplace_productos AS PERMISSIVE FOR UPDATE TO public USING (true);

CREATE POLICY "Usuario elimina producto marketplace" ON public.marketplace_productos AS PERMISSIVE FOR DELETE TO public USING (true);

CREATE POLICY "Service role can insert notifications" ON public.notificaciones AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON public.notificaciones AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));

CREATE POLICY "Users can view own notifications" ON public.notificaciones AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));

CREATE POLICY "Autor edita parche" ON public.parches AS PERMISSIVE FOR UPDATE TO public USING (true);

CREATE POLICY "Autor elimina parche" ON public.parches AS PERMISSIVE FOR DELETE TO public USING (true);

CREATE POLICY "Todos ven parches" ON public.parches AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY "Usuario crea parche" ON public.parches AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Todos ven seguidores de parches" ON public.parches_seguidores AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY "Usuario deja de seguir parche" ON public.parches_seguidores AS PERMISSIVE FOR DELETE TO public USING (true);

CREATE POLICY "Usuario sigue parche" ON public.parches_seguidores AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Organizador edita rodada" ON public.rodadas AS PERMISSIVE FOR UPDATE TO public USING (true);

CREATE POLICY "Organizador elimina rodada" ON public.rodadas AS PERMISSIVE FOR DELETE TO public USING (true);

CREATE POLICY "Todos ven rodadas" ON public.rodadas AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY "Usuario crea rodada" ON public.rodadas AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Todos ven participantes" ON public.rodadas_participantes AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY "Usuario actualiza participacion" ON public.rodadas_participantes AS PERMISSIVE FOR UPDATE TO public USING (true);

CREATE POLICY "Usuario sale de rodada" ON public.rodadas_participantes AS PERMISSIVE FOR DELETE TO public USING (true);

CREATE POLICY "Usuario se une a rodada" ON public.rodadas_participantes AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Autor edita spot" ON public.spots AS PERMISSIVE FOR UPDATE TO public USING (true);

CREATE POLICY "Autor elimina spot" ON public.spots AS PERMISSIVE FOR DELETE TO public USING (true);

CREATE POLICY "Todos ven spots" ON public.spots AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY "Usuario crea spot" ON public.spots AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Usuario marca favorito" ON public.spots_favoritos AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Usuario quita favorito" ON public.spots_favoritos AS PERMISSIVE FOR DELETE TO public USING (true);

CREATE POLICY "Usuario ve favoritos" ON public.spots_favoritos AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY "Todos pueden ver tracking live" ON public.tracking_live AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY "Usuario actualiza tracking live" ON public.tracking_live AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Usuario crea tracking live" ON public.tracking_live AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Usuario elimina tracking live" ON public.tracking_live AS PERMISSIVE FOR DELETE TO authenticated USING ((user_id = auth.uid()));

CREATE POLICY "Todos ven usuarios" ON public.usuarios AS PERMISSIVE FOR SELECT TO public USING (true);

-- -----------------------------------------------------------------------------
-- Application storage policies
-- -----------------------------------------------------------------------------

CREATE POLICY avatares_delete_own ON storage.objects AS PERMISSIVE FOR DELETE TO public USING (((bucket_id = 'usuarios-avatares'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));

CREATE POLICY avatares_insert_auth ON storage.objects AS PERMISSIVE FOR INSERT TO public WITH CHECK (((bucket_id = 'usuarios-avatares'::text) AND (auth.role() = 'authenticated'::text)));

CREATE POLICY avatares_select_public ON storage.objects AS PERMISSIVE FOR SELECT TO public USING ((bucket_id = 'usuarios-avatares'::text));

CREATE POLICY avatares_update_own ON storage.objects AS PERMISSIVE FOR UPDATE TO public USING (((bucket_id = 'usuarios-avatares'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));

CREATE POLICY marketplace_delete_own ON storage.objects AS PERMISSIVE FOR DELETE TO public USING (((bucket_id = 'marketplace-fotos'::text) AND ((auth.uid())::text = (storage.foldername(name))[2])));

CREATE POLICY marketplace_insert_auth ON storage.objects AS PERMISSIVE FOR INSERT TO public WITH CHECK (((bucket_id = 'marketplace-fotos'::text) AND (auth.role() = 'authenticated'::text)));

CREATE POLICY marketplace_select_public ON storage.objects AS PERMISSIVE FOR SELECT TO public USING ((bucket_id = 'marketplace-fotos'::text));

CREATE POLICY marketplace_update_own ON storage.objects AS PERMISSIVE FOR UPDATE TO public USING (((bucket_id = 'marketplace-fotos'::text) AND ((auth.uid())::text = (storage.foldername(name))[2])));

CREATE POLICY parches_delete_auth ON storage.objects AS PERMISSIVE FOR DELETE TO public USING (((bucket_id = 'parches-fotos'::text) AND (auth.role() = 'authenticated'::text)));

CREATE POLICY parches_insert_auth ON storage.objects AS PERMISSIVE FOR INSERT TO public WITH CHECK (((bucket_id = 'parches-fotos'::text) AND (auth.role() = 'authenticated'::text)));

CREATE POLICY parches_select_public ON storage.objects AS PERMISSIVE FOR SELECT TO public USING ((bucket_id = 'parches-fotos'::text));

CREATE POLICY parches_update_auth ON storage.objects AS PERMISSIVE FOR UPDATE TO public USING (((bucket_id = 'parches-fotos'::text) AND (auth.role() = 'authenticated'::text)));

CREATE POLICY posts_delete_own ON storage.objects AS PERMISSIVE FOR DELETE TO public USING (((bucket_id = 'posts'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));

CREATE POLICY posts_insert_auth ON storage.objects AS PERMISSIVE FOR INSERT TO public WITH CHECK (((bucket_id = 'posts'::text) AND (auth.role() = 'authenticated'::text)));

CREATE POLICY posts_select_public ON storage.objects AS PERMISSIVE FOR SELECT TO public USING ((bucket_id = 'posts'::text));

CREATE POLICY posts_update_own ON storage.objects AS PERMISSIVE FOR UPDATE TO public USING (((bucket_id = 'posts'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));

CREATE POLICY spots_delete_auth ON storage.objects AS PERMISSIVE FOR DELETE TO public USING (((bucket_id = 'spots-fotos'::text) AND (auth.role() = 'authenticated'::text)));

CREATE POLICY spots_insert_auth ON storage.objects AS PERMISSIVE FOR INSERT TO public WITH CHECK (((bucket_id = 'spots-fotos'::text) AND (auth.role() = 'authenticated'::text)));

CREATE POLICY spots_select_public ON storage.objects AS PERMISSIVE FOR SELECT TO public USING ((bucket_id = 'spots-fotos'::text));

CREATE POLICY spots_update_auth ON storage.objects AS PERMISSIVE FOR UPDATE TO public USING (((bucket_id = 'spots-fotos'::text) AND (auth.role() = 'authenticated'::text)));

-- -----------------------------------------------------------------------------
-- Table grants
-- -----------------------------------------------------------------------------

GRANT ALL PRIVILEGES ON TABLE public.comunidades TO anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON TABLE public.comunidades_lideres TO anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON TABLE public.comunidades_seguidores TO anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON TABLE public.galeria TO anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON TABLE public.galeria_comentarios TO anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON TABLE public.galeria_likes TO anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON TABLE public.marketplace_productos TO anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON TABLE public.notificaciones TO anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON TABLE public.parches TO anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON TABLE public.parches_seguidores TO anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON TABLE public.rodadas TO anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON TABLE public.rodadas_participantes TO anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON TABLE public.spots TO anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON TABLE public.spots_favoritos TO anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON TABLE public.tracking_live TO anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON TABLE public.usuarios TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Function grants
-- -----------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.delete_comunidad_leave_notifications() TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.insert_comment_notification() TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.insert_comunidad_join_notifications() TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.insert_comunidad_lider_notifications() TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.insert_comunidad_rodada_notifications() TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.insert_like_notification() TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.insert_parche_follower_notification() TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.insert_rodada_join_notification() TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.set_updated_at() TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.update_galeria_comentarios_count() TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.update_galeria_likes_count() TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.update_rodadas_participantes_count() TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Storage bucket configuration
-- -----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, avif_autodetection) VALUES ('marketplace-fotos', 'marketplace-fotos', 't', NULL, NULL, 'f') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types, avif_autodetection = EXCLUDED.avif_autodetection;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, avif_autodetection) VALUES ('parches-fotos', 'parches-fotos', 't', NULL, NULL, 'f') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types, avif_autodetection = EXCLUDED.avif_autodetection;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, avif_autodetection) VALUES ('posts', 'posts', 't', NULL, NULL, 'f') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types, avif_autodetection = EXCLUDED.avif_autodetection;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, avif_autodetection) VALUES ('spots-fotos', 'spots-fotos', 't', NULL, NULL, 'f') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types, avif_autodetection = EXCLUDED.avif_autodetection;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, avif_autodetection) VALUES ('usuarios-avatares', 'usuarios-avatares', 't', NULL, NULL, 'f') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types, avif_autodetection = EXCLUDED.avif_autodetection;

-- -----------------------------------------------------------------------------
-- Realtime publication membership
-- -----------------------------------------------------------------------------

DO $baseline$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.comunidades;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.comunidades_lideres;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.comunidades_seguidores;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notificaciones;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.rodadas;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.rodadas_participantes;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.tracking_live;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END
$baseline$;

RESET search_path;
