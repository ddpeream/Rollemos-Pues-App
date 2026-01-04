-- ============================================
-- Marketplace (productos) + storage bucket
-- ============================================

-- Eliminar tabla si existe (solo para desarrollo)
DROP TABLE IF EXISTS marketplace_productos CASCADE;

CREATE TABLE marketplace_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio NUMERIC NOT NULL,
  categoria TEXT NOT NULL,
  imagenes TEXT[] NOT NULL DEFAULT '{}',
  vendedor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_marketplace_productos_vendedor ON marketplace_productos(vendedor_id);
CREATE INDEX idx_marketplace_productos_categoria ON marketplace_productos(categoria);
CREATE INDEX idx_marketplace_productos_created_at ON marketplace_productos(created_at DESC);

ALTER TABLE marketplace_productos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos ven productos marketplace" ON marketplace_productos;
DROP POLICY IF EXISTS "Usuario crea producto marketplace" ON marketplace_productos;
DROP POLICY IF EXISTS "Usuario edita producto marketplace" ON marketplace_productos;
DROP POLICY IF EXISTS "Usuario elimina producto marketplace" ON marketplace_productos;

CREATE POLICY "Todos ven productos marketplace" ON marketplace_productos
  FOR SELECT USING (true);

CREATE POLICY "Usuario crea producto marketplace" ON marketplace_productos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuario edita producto marketplace" ON marketplace_productos
  FOR UPDATE USING (true);

CREATE POLICY "Usuario elimina producto marketplace" ON marketplace_productos
  FOR DELETE USING (true);

-- updated_at automatico
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_updated_at_marketplace_productos ON marketplace_productos;

CREATE TRIGGER trigger_set_updated_at_marketplace_productos
  BEFORE UPDATE ON marketplace_productos
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ============================================
-- Storage bucket: marketplace-fotos
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('marketplace-fotos', 'marketplace-fotos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Politicas para marketplace-fotos
CREATE POLICY "marketplace_select_public" ON storage.objects
FOR SELECT USING (bucket_id = 'marketplace-fotos');

CREATE POLICY "marketplace_insert_auth" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'marketplace-fotos'
  AND auth.role() = 'authenticated'
);

-- La ruta de archivos es: marketplace/{userId}/archivo.jpg
CREATE POLICY "marketplace_update_own" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'marketplace-fotos'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "marketplace_delete_own" ON storage.objects
FOR DELETE USING (
  bucket_id = 'marketplace-fotos'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- ============================================
-- Verificacion
-- ============================================
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'marketplace_productos';

SELECT policyname, tablename, cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'marketplace_%';
