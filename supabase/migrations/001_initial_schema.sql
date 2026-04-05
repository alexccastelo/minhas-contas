-- ============================================================
-- 001_initial_schema.sql
-- Sistema de Gestão Financeira — Minhas Contas
-- ============================================================

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- profiles: centros de custo (Alex/Cinthya, Maria)
-- ------------------------------------------------------------
CREATE TABLE profiles (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome      text NOT NULL,
  cor       text NOT NULL DEFAULT '#6366f1', -- cor de destaque no dashboard
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- subscriptions: assinaturas mensais e anuais
-- ------------------------------------------------------------
CREATE TABLE subscriptions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome             text NOT NULL,
  tipo             text NOT NULL,              -- AI, Cloud, Streaming, Telecom, Devices…
  dia_vencimento   int,                        -- 1-31 (para mensais)
  frequencia       text NOT NULL DEFAULT 'mensal', -- 'mensal' | 'anual'
  metodo_pagamento text NOT NULL DEFAULT 'Nubank',
  valor            numeric(10,2) NOT NULL,
  data_venc_anual  date,                       -- apenas para frequencia='anual'
  ativo            boolean NOT NULL DEFAULT true,
  criado_em        timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- monthly_periods: competência mensal por perfil
-- ------------------------------------------------------------
CREATE TABLE monthly_periods (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  competencia date NOT NULL,                   -- primeiro dia do mês: 2026-04-01
  criado_em  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, competencia)
);

-- ------------------------------------------------------------
-- expenses: contas a pagar (normais, assinaturas importadas, atrasadas)
-- ------------------------------------------------------------
CREATE TABLE expenses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id       uuid NOT NULL REFERENCES monthly_periods(id) ON DELETE CASCADE,
  profile_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  descricao       text NOT NULL,
  vencimento      date NOT NULL,
  valor           numeric(10,2),
  status          text NOT NULL DEFAULT 'a_pagar', -- 'a_pagar' | 'pago' | 'atrasado'
  observacao      text,
  tipo            text NOT NULL DEFAULT 'normal',  -- 'normal' | 'assinatura' | 'atrasada'
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  comprovante_url text,
  criado_em       timestamptz NOT NULL DEFAULT now(),
  pago_em         timestamptz
);

CREATE INDEX idx_expenses_vencimento ON expenses(vencimento);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_profile_id ON expenses(profile_id);

-- ------------------------------------------------------------
-- loans: empréstimos (parcelas mensais)
-- ------------------------------------------------------------
CREATE TABLE loans (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  descricao        text NOT NULL,
  valor_emprestado numeric(10,2),
  vencimento_atual date,
  ultimo_vencimento date,
  parcela_mensal   numeric(10,2),
  status           text NOT NULL DEFAULT 'a_pagar', -- 'a_pagar' | 'pago'
  criado_em        timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- income_entries: entradas/receitas esperadas por mês
-- ------------------------------------------------------------
CREATE TABLE income_entries (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id  uuid NOT NULL REFERENCES monthly_periods(id) ON DELETE CASCADE,
  descricao  text NOT NULL,
  valor      numeric(10,2) NOT NULL,
  criado_em  timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- payroll_deductions: descontos em folha (Proc. Tayson / Bloqueio Judicial)
-- ------------------------------------------------------------
CREATE TABLE payroll_deductions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  data           date NOT NULL,
  descricao      text NOT NULL,
  valor          numeric(10,2) NOT NULL,
  saldo_devedor  numeric(10,2) NOT NULL,
  criado_em      timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- payslip_mirror: espelho do contracheque (Maria)
-- ------------------------------------------------------------
CREATE TABLE payslip_mirror (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id         uuid NOT NULL REFERENCES monthly_periods(id) ON DELETE CASCADE,
  salario_bruto     numeric(10,2) NOT NULL,
  bloqueio_judicial numeric(10,2) NOT NULL DEFAULT 0,
  previdencia       numeric(10,2) NOT NULL DEFAULT 0,
  plano_saude       numeric(10,2) NOT NULL DEFAULT 0,
  liquido           numeric(10,2) GENERATED ALWAYS AS
                    (salario_bruto - bloqueio_judicial - previdencia - plano_saude)
                    STORED,
  criado_em         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (period_id)
);
