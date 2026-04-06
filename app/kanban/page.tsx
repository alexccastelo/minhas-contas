import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import type { Expense, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

function calcPrevMes(mes: string) {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function calcNextMes(mes: string) {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function formatMesLong(mes: string) {
  const [y, m] = mes.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" })
    .format(new Date(y, m - 1, 1));
}

interface PageProps {
  searchParams: Promise<{ mes?: string }>;
}

export default async function KanbanPage({ searchParams }: PageProps) {
  const { mes: mesParam } = await searchParams;
  const today = new Date();
  const mesAtual = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const mes = mesParam && /^\d{4}-\d{2}$/.test(mesParam) ? mesParam : mesAtual;
  const todayStr = today.toISOString().split("T")[0];

  const supabase = createServerClient();

  // Busca períodos do mês selecionado (todos os perfis)
  const { data: periodsData } = await supabase
    .from("monthly_periods")
    .select("id, profile_id")
    .eq("competencia", `${mes}-01`);

  const periods = periodsData ?? [];
  const periodIds = periods.map((p) => p.id);

  // Busca todas as despesas desses períodos
  let expenses: Expense[] = [];
  if (periodIds.length > 0) {
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .in("period_id", periodIds)
      .order("vencimento", { ascending: true });
    expenses = data ?? [];
  }

  // Busca perfis
  const { data: profilesData } = await supabase.from("profiles").select("*");
  const profileMap: Record<string, Profile> = Object.fromEntries(
    (profilesData ?? []).map((p: Profile) => [p.id, p])
  );

  // Contadores por coluna (para o header)
  const atrasadas = expenses.filter((e) => e.status !== "pago" && e.vencimento < todayStr);
  const hoje = expenses.filter((e) => e.status !== "pago" && e.vencimento === todayStr);
  const aVencer = expenses.filter((e) => e.status !== "pago" && e.vencimento > todayStr);
  const pagas = expenses.filter((e) => e.status === "pago");

  const prevMes = calcPrevMes(mes);
  const nextMes = calcNextMes(mes);

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 px-4 pb-3 pt-5">
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

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-100">Kanban</h1>
            <p className="mt-0.5 text-sm capitalize text-gray-500">{formatMesLong(mes)}</p>
          </div>

          {/* Navegação de mês */}
          <div className="flex items-center gap-1">
            <Link
              href={`/kanban?mes=${prevMes}`}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            {mes !== mesAtual && (
              <Link
                href="/kanban"
                className="rounded-lg px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
              >
                Hoje
              </Link>
            )}
            <Link
              href={`/kanban?mes=${nextMes}`}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Mini resumo */}
        <div className="mt-3 flex gap-3">
          <Pill label="Atrasado" count={atrasadas.length} color="text-amber-400 bg-amber-500/10" />
          <Pill label="Hoje" count={hoje.length} color="text-sky-400 bg-sky-500/10" />
          <Pill label="A Vencer" count={aVencer.length} color="text-gray-400 bg-gray-700" />
          <Pill label="Pago" count={pagas.length} color="text-emerald-400 bg-emerald-500/10" />
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-4xl">📭</p>
          <p className="mt-3 text-lg font-semibold text-gray-300">Nenhuma conta neste mês</p>
          <p className="mt-1 text-sm text-gray-600">
            Gere o período na{" "}
            <Link href="/dashboard" className="text-indigo-400 hover:underline">
              visão mensal
            </Link>
            .
          </p>
        </div>
      ) : (
        <KanbanBoard
          expenses={expenses}
          profileMap={profileMap}
          todayStr={todayStr}
          mes={mes}
        />
      )}
    </main>
  );
}

function Pill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${color}`}>
      <span className="font-bold">{count}</span>
      <span className="opacity-70">{label}</span>
    </div>
  );
}
