export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ExpenseStatus = "a_pagar" | "pago" | "atrasado";
export type ExpenseTipo = "normal" | "assinatura" | "atrasada";
export type LoanStatus = "a_pagar" | "pago";
export type Frequencia = "mensal" | "anual";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nome: string;
          cor: string;
          criado_em: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "id" | "criado_em"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      subscriptions: {
        Row: {
          id: string;
          nome: string;
          tipo: string;
          dia_vencimento: number | null;
          frequencia: Frequencia;
          metodo_pagamento: string;
          valor: number;
          data_venc_anual: string | null;
          ativo: boolean;
          criado_em: string;
        };
        Insert: Omit<Database["public"]["Tables"]["subscriptions"]["Row"], "id" | "criado_em"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
      };
      monthly_periods: {
        Row: {
          id: string;
          profile_id: string;
          competencia: string;
          criado_em: string;
        };
        Insert: Omit<Database["public"]["Tables"]["monthly_periods"]["Row"], "id" | "criado_em"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["monthly_periods"]["Insert"]>;
      };
      expenses: {
        Row: {
          id: string;
          period_id: string;
          profile_id: string;
          descricao: string;
          vencimento: string;
          valor: number | null;
          status: ExpenseStatus;
          observacao: string | null;
          tipo: ExpenseTipo;
          subscription_id: string | null;
          comprovante_url: string | null;
          criado_em: string;
          pago_em: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["expenses"]["Row"], "id" | "criado_em"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
      };
      loans: {
        Row: {
          id: string;
          profile_id: string;
          descricao: string;
          valor_emprestado: number | null;
          vencimento_atual: string | null;
          ultimo_vencimento: string | null;
          parcela_mensal: number | null;
          status: LoanStatus;
          criado_em: string;
        };
        Insert: Omit<Database["public"]["Tables"]["loans"]["Row"], "id" | "criado_em"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["loans"]["Insert"]>;
      };
      income_entries: {
        Row: {
          id: string;
          period_id: string;
          descricao: string;
          valor: number;
          criado_em: string;
        };
        Insert: Omit<Database["public"]["Tables"]["income_entries"]["Row"], "id" | "criado_em"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["income_entries"]["Insert"]>;
      };
      payroll_deductions: {
        Row: {
          id: string;
          profile_id: string;
          data: string;
          descricao: string;
          valor: number;
          saldo_devedor: number;
          criado_em: string;
        };
        Insert: Omit<Database["public"]["Tables"]["payroll_deductions"]["Row"], "id" | "criado_em"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["payroll_deductions"]["Insert"]>;
      };
      payslip_mirror: {
        Row: {
          id: string;
          period_id: string;
          salario_bruto: number;
          bloqueio_judicial: number;
          previdencia: number;
          plano_saude: number;
          liquido: number;
          criado_em: string;
        };
        Insert: Omit<Database["public"]["Tables"]["payslip_mirror"]["Row"], "id" | "criado_em" | "liquido"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["payslip_mirror"]["Insert"]>;
      };
    };
  };
}

// Tipos derivados para uso nos componentes
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"] & {
  profiles?: Profile;
};
export type Loan = Database["public"]["Tables"]["loans"]["Row"];
export type IncomeEntry = Database["public"]["Tables"]["income_entries"]["Row"];
export type MonthlyPeriod = Database["public"]["Tables"]["monthly_periods"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
