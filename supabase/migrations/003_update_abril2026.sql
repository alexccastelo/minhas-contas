-- ============================================================
-- 003_update_abril2026.sql
-- Atualização com dados revisados da planilha
-- Execute no SQL Editor do Supabase
-- ============================================================

BEGIN;

-- ============================================================
-- PARTE 1: Corrigir despesas de Abril — Alex/Cinthya
-- ============================================================

-- Seguro Logan: data corrigida (03 → 06) e marcado como pago
UPDATE expenses
SET vencimento = '2026-04-06', status = 'pago', pago_em = now(),
    observacao = 'Déb. Aut. Santander Cinthya'
WHERE period_id = '10000000-0000-0000-0000-000000000001'
  AND descricao = 'Seguro Logan' AND vencimento = '2026-04-03';

-- Cartão Santander Cinthya: valor real (350,94) e marcado como pago
UPDATE expenses
SET valor = 350.94, status = 'pago', pago_em = now()
WHERE period_id = '10000000-0000-0000-0000-000000000001'
  AND descricao = 'Cartão Santander Cinthya' AND vencimento = '2026-04-04';

-- Assinaturas: total atualizado (novas assinaturas adicionadas)
UPDATE expenses
SET valor = 2699.01
WHERE period_id = '10000000-0000-0000-0000-000000000001'
  AND descricao = 'Assinaturas' AND vencimento = '2026-04-30';

-- ============================================================
-- PARTE 2: Corrigir despesas de Abril — Maria
-- ============================================================

-- Férias Lu: era um único registro de R$ 1.448,79
-- Agora são dois: R$ 1.000,00 (04/04, a_pagar) + R$ 448,79 (05/04, pago)
UPDATE expenses
SET valor = 1000.00, status = 'a_pagar', pago_em = NULL
WHERE period_id = '10000000-0000-0000-0000-000000000002'
  AND descricao = 'Férias Lu (15 dias)' AND vencimento = '2026-04-04';

-- Insere a segunda parcela das férias (05/04)
INSERT INTO expenses (period_id, profile_id, descricao, vencimento, valor, status, tipo, pago_em)
SELECT
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  'Férias Lu (15 dias)', '2026-04-05', 448.79, 'pago', 'normal', now()
WHERE NOT EXISTS (
  SELECT 1 FROM expenses
  WHERE period_id = '10000000-0000-0000-0000-000000000002'
    AND descricao = 'Férias Lu (15 dias)' AND vencimento = '2026-04-05'
);

-- ============================================================
-- PARTE 3: Recriar todas as assinaturas (muitas mudanças)
-- ============================================================

-- Remove todas e re-insere do zero (expenses não referenciam subscription_id no seed)
DELETE FROM subscriptions;

-- Mensais (31)
INSERT INTO subscriptions (nome, tipo, dia_vencimento, frequencia, metodo_pagamento, valor, ativo) VALUES
  ('Globoplay',                'Streaming',  1,  'mensal', 'Nubank',    78.90, true),
  ('Microsoft 365',            'Cloud',      1,  'mensal', 'Nubank',    60.00, true),
  ('Claude AI',                'AI',         2,  'mensal', 'Nubank',   118.40, true),
  ('Revolut Premium',          'Finanças',   2,  'mensal', 'Revolut',   19.99, true),
  ('CamScanner',               'Outros',     2,  'mensal', 'Nubank',    16.90, true),
  ('YouTube Premium',          'Streaming',  3,  'mensal', 'Nubank',    53.90, true),
  ('ChatGPT',                  'AI',         3,  'mensal', 'Nubank',    95.99, true),
  ('Allugator - S25',          'Devices',    5,  'mensal', 'Nubank',   337.03, true),
  ('Allugator - iPhone 16',    'Devices',    5,  'mensal', 'Nubank',   436.14, true),
  ('Splash and Go (YT)',       'Outros',     7,  'mensal', 'Nubank',    19.99, true),
  ('Google Workspace',         'Cloud',      7,  'mensal', 'Nubank',    78.40, true),
  ('TIM - 7501',               'Telecom',    7,  'mensal', 'Nubank',    73.90, true),
  ('Time Fit',                 'Saúde',     10,  'mensal', 'Nubank',   189.90, true),
  ('aaPanel',                  'Cloud',     13,  'mensal', 'Nubank',   199.40, true),
  ('Servhost',                 'Cloud',     16,  'mensal', 'Nubank',    70.32, true),
  ('Editora Globo',            'Outros',    19,  'mensal', 'Nubank',     1.90, true),
  ('Manual do Mundo (YT)',     'Outros',    22,  'mensal', 'Nubank',     1.99, true),
  ('Autizando (IG)',           'Outros',    23,  'mensal', 'Nubank',    16.99, true),
  ('Clube iFood',              'Outros',    24,  'mensal', 'Nubank',    12.90, true),
  ('Serasa',                   'Finanças',  26,  'mensal', 'Nubank',    19.90, true),
  ('X (@brunoclz)',            'Outros',    26,  'mensal', 'Nubank',     5.00, true),
  ('X (@etherialexplore)',     'Outros',    26,  'mensal', 'Nubank',    12.00, true),
  ('Hostinger',                'Cloud',     27,  'mensal', 'Nubank',    71.06, true),
  ('TIM - 9141',               'Telecom',   28,  'mensal', 'Nubank',   129.99, true),
  ('Petlove',                  'Outros',    28,  'mensal', 'Nubank',   272.63, true),
  ('Google One',               'Cloud',     28,  'mensal', 'Nubank',    96.99, true),
  ('Telegram (alexccastelo)',  'Outros',    28,  'mensal', 'Nubank',    19.90, true),
  ('Apple One',                'Outros',    29,  'mensal', 'Nubank',    99.90, true),
  ('Meli+',                    'Outros',    30,  'mensal', 'Nubank',    59.90, true),
  ('Car Scanner',              'Outros',    30,  'mensal', 'Nubank',    18.90, true),
  ('Google Play Pass',         'Outros',    31,  'mensal', 'Nubank',     9.90, true);

-- Anuais (5)
INSERT INTO subscriptions (nome, tipo, frequencia, metodo_pagamento, valor, data_venc_anual, ativo) VALUES
  ('Instant Save',    'Outros',    'anual', 'Nubank',  35.90, '2026-05-18', true),
  ('Sam''s Club',     'Outros',    'anual', 'Nubank', 175.00, '2026-06-03', true),
  ('F1 TV',           'Streaming', 'anual', 'Nubank', 409.00, '2027-02-27', true),
  ('Flightradar 24',  'Outros',    'anual', 'Nubank', 112.90, '2027-03-02', true),
  ('Domínio nexum.id','Cloud',     'anual', 'Nubank',  87.99, '2027-03-04', true);

COMMIT;
