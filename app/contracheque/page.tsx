import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { PayslipClient } from "@/components/payslip/PayslipClient";

export const dynamic = "force-dynamic";

// ID fixo do perfil da Maria (seed.sql)
const MARIA_PROFILE_ID = "00000000-0000-0000-0000-000000000002";

export default async function ContrachequeePage() {
  const supabase = createServerClient();

  // Verifica que o perfil existe
  const { data: maria } = await supabase
    .from("profiles")
    .select("id, nome, cor")
    .eq("id", MARIA_PROFILE_ID)
    .maybeSingle();

  if (!maria) notFound();

  // Busca todos os contracheques da Maria, ordenados do mais recente
  const { data: payslipsRaw } = await supabase
    .from("payslip_mirror")
    .select(`
      id,
      salario_bruto,
      bloqueio_judicial,
      previdencia,
      plano_saude,
      liquido,
      period_id,
      monthly_periods!inner(competencia, profile_id)
    `)
    .eq("monthly_periods.profile_id", MARIA_PROFILE_ID)
    .order("period_id", { ascending: false });

  // Busca descontos em folha (Processo Tayson)
  const { data: deducoesRaw } = await supabase
    .from("payroll_deductions")
    .select("*")
    .eq("profile_id", MARIA_PROFILE_ID)
    .order("data", { ascending: true });

  // Normaliza payslips
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payslips = (payslipsRaw ?? []).map((p: any) => ({
    id: p.id as string,
    periodId: p.period_id as string,
    competencia: (p.monthly_periods?.competencia as string ?? "").slice(0, 7), // "YYYY-MM"
    salarioBruto: p.salario_bruto as number,
    bloqueioJudicial: p.bloqueio_judicial as number,
    previdencia: p.previdencia as number,
    planoSaude: p.plano_saude as number,
    liquido: p.liquido as number,
  }));

  // Normaliza deduções
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deducoes = (deducoesRaw ?? []).map((d: any) => ({
    id: d.id as string,
    data: d.data as string,
    descricao: d.descricao as string,
    valor: d.valor as number,
    saldoDevedor: d.saldo_devedor as number,
  }));

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-gray-950 pb-24">
      {/* Header */}
      <div className="bg-gray-900 px-4 pb-4 pt-5">
        <div className="flex items-center gap-2 mb-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full flex-none" style={{ backgroundColor: maria.cor }} />
          <h1 className="text-xl font-bold text-gray-100">Contracheque</h1>
        </div>
        <p className="mt-1 text-sm text-gray-500">{maria.nome}</p>
      </div>

      <PayslipClient
        mariaProfileId={MARIA_PROFILE_ID}
        payslips={payslips}
        deducoes={deducoes}
      />
    </main>
  );
}
