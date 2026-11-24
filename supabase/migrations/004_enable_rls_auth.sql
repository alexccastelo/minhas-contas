-- ============================================================
-- 004_enable_rls_auth.sql
-- Fecha o acesso anônimo: RLS em todas as tabelas + bucket privado.
-- Só usuários autenticados E cadastrados em app_members acessam dados.
-- (A Edge Function notify-daily usa service_role e ignora RLS.)
-- ============================================================

-- ------------------------------------------------------------
-- Membros autorizados (allowlist). Mesmo que alguém consiga criar
-- uma conta no Auth, sem estar aqui não vê nada.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_members (
  user_id   uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  criado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_members ENABLE ROW LEVEL SECURITY;
-- sem políticas: invisível pela API; gerenciado só via SQL/dashboard

-- Função fora do schema exposto pela API
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.is_member()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_members WHERE user_id = (SELECT auth.uid())
  );
$$;
REVOKE ALL ON FUNCTION private.is_member() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_member() TO authenticated;

-- ------------------------------------------------------------
-- RLS + política única por tabela (membros podem tudo)
-- ------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles', 'subscriptions', 'monthly_periods', 'expenses',
    'loans', 'income_entries', 'payroll_deductions', 'payslip_mirror'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS members_all ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY members_all ON public.%I FOR ALL TO authenticated
         USING ((SELECT private.is_member()))
         WITH CHECK ((SELECT private.is_member()))', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- Storage: bucket comprovantes privado, só membros
-- ------------------------------------------------------------
UPDATE storage.buckets SET public = false WHERE id = 'comprovantes';

DROP POLICY IF EXISTS "comprovantes_insert" ON storage.objects;
DROP POLICY IF EXISTS "comprovantes_select" ON storage.objects;
DROP POLICY IF EXISTS "comprovantes_delete" ON storage.objects;
DROP POLICY IF EXISTS "comprovantes_update" ON storage.objects;

CREATE POLICY "comprovantes_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'comprovantes' AND (SELECT private.is_member()));

CREATE POLICY "comprovantes_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'comprovantes' AND (SELECT private.is_member()));

CREATE POLICY "comprovantes_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'comprovantes' AND (SELECT private.is_member()))
  WITH CHECK (bucket_id = 'comprovantes' AND (SELECT private.is_member()));

CREATE POLICY "comprovantes_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'comprovantes' AND (SELECT private.is_member()));

-- ------------------------------------------------------------
-- DEPOIS de criar os usuários em Authentication > Users, rode:
--   INSERT INTO public.app_members (user_id)
--   SELECT id FROM auth.users WHERE email IN ('<email-1>', '<email-2>');
-- ------------------------------------------------------------
