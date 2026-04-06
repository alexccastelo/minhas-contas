-- ------------------------------------------------------------
-- Bucket para comprovantes de pagamento
-- Execute no SQL Editor do Supabase
-- ------------------------------------------------------------

-- Cria o bucket (público: arquivos acessíveis via URL direta)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comprovantes',
  'comprovantes',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Política: permitir upload (INSERT)
CREATE POLICY "comprovantes_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'comprovantes');

-- Política: permitir leitura (SELECT)
CREATE POLICY "comprovantes_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'comprovantes');

-- Política: permitir deleção (DELETE)
CREATE POLICY "comprovantes_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'comprovantes');
