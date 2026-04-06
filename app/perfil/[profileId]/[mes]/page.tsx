import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { MonthlyHeader } from "@/components/monthly/MonthlyHeader";
import { GenerateNextMonthButton } from "@/components/monthly/GenerateNextMonthButton";
import { SectionTitle } from "@/components/dashboard/SectionTitle";
import { TimelineCard } from "@/components/dashboard/TimelineCard";
import type { Expense, Profile, ExpenseStatus, IncomeEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDateBR(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "numeric", month: "short" }).format(date);
}

function calcNextMes(mes: string): string {
  const [year, month] = mes.split("-").map(Number);
  const d = new Date(year, month, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface PageProps {
  params: Promise<{ profileId: string; mes: string }>;
}

export default async function PerfilMesPage({ params }: PageProps) {
  const { profileId, mes } = await params;

  // Valida formato do mês "YYYY-MM"
  if (!/^\d{4}-\d{2}$/.test(mes)) notFound();

  const supabase = createServerClient();
  const competencia = `${mes}-01`;
  const nextMes = calcNextMes(mes);
  const nextCompetencia = `${nextMes}-01`;

  // Busca perfil
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();

  if (!profileData) notFound();
  const profile: Profile = profileData;

  // Busca período atual e próximo em paralelo
  const [{ data: periodData }, { data: nextPeriodData }] = await Promise.all([
    supabase
      .from("monthly_periods")
      .select("id")
      .eq("profile_id", profileId)
      .eq("competencia", competencia)
      .maybeSingle(),
    supabase
      .from("monthly_periods")
      .select("id")
      .eq("profile_id", profileId)
      .eq("competencia", nextCompetencia)
      .maybeSingle(),
  ]);

  const periodId: string | null = periodData?.id ?? null;
  const nextPeriodExists = !!nextPeriodData;

  // Busca expenses do período (se existir)
  let expenses: Expense[] = [];
  if (periodId) {
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .eq("period_id", periodId)
      .order("vencimento", { ascending: true });
    expenses = data ?? [];
  }

  // Busca entradas do período
  let incomeEntries: IncomeEntry[] = [];
  if (periodId) {
    const { data } = await supabase
      .from("income_entries")
      .select("*")
      .eq("period_id", periodId);
    incomeEntries = data ?? [];
  }

  // Classifica
  const normais = expenses.filter((e) => e.tipo !== "atrasada");
  const atrasadas = expenses.filter((e) => e.tipo === "atrasada");

  // Para geração do próximo mês
  const assinaturas = expenses.filter((e) => e.tipo === "assinatura" && e.status !== "pago");
  const unpaidParaRolar = expenses.filter(
    (e) => e.status === "a_pagar" && (e.tipo === "normal" || e.tipo === "atrasada")
  );

  // Totais
  const totalAPagar = normais.filter((e) => e.status === "a_pagar").reduce((s, e) => s + (e.valor ?? 0), 0);
  const totalPago = normais.filter((e) => e.status === "pago").reduce((s, e) => s + (e.valor ?? 0), 0);
  const totalAtrasado = atrasadas.filter((e) => e.status === "a_pagar").reduce((s, e) => s + (e.valor ?? 0), 0);
  const totalEntradas = incomeEntries.reduce((s, i) => s + i.valor, 0);

  // Resumo por dia (apenas normais)
  const porDia = normais.reduce<Record<string, Expense[]>>((acc, e) => {
    const key = e.vencimento;
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-gray-950 pb-24">
      <MonthlyHeader
        profile={profile}
        mes={mes}
        totalAPagar={totalAPagar}
        totalPago={totalPago}
        totalAtrasado={totalAtrasado}
        totalEntradas={totalEntradas}
      />

      {/* Contas do mês */}
      {normais.length > 0 && (
        <section className="mt-2">
          <SectionTitle title="Contas do Mês" count={normais.length} icon="📋" accentColor="text-gray-300" />
          <div className="space-y-2 px-4 pb-2">
            {normais.map((expense) => (
              <TimelineCard
                key={expense.id}
                expense={{ ...expense, status: expense.status as ExpenseStatus }}
                profile={profile}
              />
            ))}
          </div>
        </section>
      )}

      {/* Atrasadas */}
      {atrasadas.length > 0 && (
        <section className="mt-2">
          <SectionTitle title="Atrasadas" count={atrasadas.length} icon="⚠️" accentColor="text-amber-400" />
          <div className="space-y-2 px-4 pb-2">
            {atrasadas.map((expense) => (
              <TimelineCard
                key={expense.id}
                expense={{ ...expense, status: expense.status as ExpenseStatus }}
                profile={profile}
              />
            ))}
          </div>
        </section>
      )}

      {/* Resumo por dia */}
      {Object.keys(porDia).length > 0 && (
        <section className="mt-2">
          <SectionTitle title="Resumo por Dia" count={Object.keys(porDia).length} icon="📆" accentColor="text-indigo-400" />
          <div className="space-y-1 px-4 pb-2">
            {Object.entries(porDia).map(([dateStr, items]) => {
              const subtotal = items.reduce((s, e) => s + (e.valor ?? 0), 0);
              const allPago = items.every((e) => e.status === "pago");
              const date = new Date(dateStr + "T12:00:00");
              return (
                <div
                  key={dateStr}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-800/50"
                >
                  <div>
                    <p className="text-xs font-medium text-gray-400">{formatDateBR(date)}</p>
                    <p className="text-xs text-gray-600">{items.length} conta{items.length > 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${allPago ? "text-emerald-400 line-through" : "text-gray-200"}`}>
                      {formatCurrency(subtotal)}
                    </span>
                    {allPago && <span className="text-xs text-emerald-500">✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Entradas / Saldo */}
      {incomeEntries.length > 0 && (
        <section className="mt-2">
          <SectionTitle title="Entradas" count={incomeEntries.length} icon="💰" accentColor="text-emerald-400" />
          <div className="space-y-1 px-4 pb-2">
            {incomeEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-lg px-3 py-2">
                <span className="text-sm text-gray-400">{entry.descricao}</span>
                <span className="text-sm font-semibold text-emerald-400">{formatCurrency(entry.valor)}</span>
              </div>
            ))}
            <div className="mt-1 flex items-center justify-between rounded-xl bg-gray-800 px-3 py-2.5">
              <span className="text-xs font-medium text-gray-400">Total entradas</span>
              <span className="text-sm font-bold text-emerald-400">{formatCurrency(totalEntradas)}</span>
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {expenses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-4xl">📭</p>
          <p className="mt-3 text-lg font-semibold text-gray-300">Nenhuma conta neste mês</p>
          <p className="mt-1 text-sm text-gray-600">Use o Dashboard para adicionar contas.</p>
        </div>
      )}

      {/* Gerar próximo mês */}
      <section className="mt-4 px-4 pb-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-gray-600">Próximo mês</p>
        <GenerateNextMonthButton
          profileId={profileId}
          currentMes={mes}
          nextMes={nextMes}
          currentPeriodId={periodId}
          nextPeriodExists={nextPeriodExists}
          assinaturas={assinaturas}
          unpaidExpenses={unpaidParaRolar}
        />
      </section>
    </main>
  );
}
