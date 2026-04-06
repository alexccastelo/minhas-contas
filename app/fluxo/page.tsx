import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { CashFlowChart, type MonthData } from "@/components/cashflow/CashFlowChart";

export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatMesLabel(competencia: string): string {
  // "2026-04-01" ou "2026-04" → "Abr/26"
  const mes = competencia.slice(0, 7);
  const [year, month] = mes.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  const mStr = d.toLocaleDateString("pt-BR", { month: "short" });
  return `${mStr.replace(".", "")}/` + String(year).slice(2);
}

export default async function FluxoPage() {
  const supabase = createServerClient();

  // Busca todos os períodos com perfil
  const { data: periodsData } = await supabase
    .from("monthly_periods")
    .select("id, competencia, profile_id")
    .order("competencia", { ascending: true });

  const periods = periodsData ?? [];
  const periodIds = periods.map((p) => p.id);

  if (periodIds.length === 0) {
    return (
      <main className="mx-auto min-h-screen max-w-lg bg-gray-950 pb-24">
        <Header />
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <p className="text-4xl">📊</p>
          <p className="mt-3 text-lg font-semibold text-gray-300">Nenhum dado ainda</p>
          <p className="mt-1 text-sm text-gray-600">Adicione contas no Dashboard para ver o fluxo.</p>
        </div>
      </main>
    );
  }

  // Busca despesas de todos os períodos
  const { data: expensesData } = await supabase
    .from("expenses")
    .select("period_id, valor, status, tipo")
    .in("period_id", periodIds);

  // Busca entradas de todos os períodos
  const { data: incomeData } = await supabase
    .from("income_entries")
    .select("period_id, valor")
    .in("period_id", periodIds);

  const expenses = expensesData ?? [];
  const incomes = incomeData ?? [];

  // Agrega por período
  const periodMap = new Map<string, {
    competencia: string;
    entradas: number;
    pago: number;
    aPagar: number;
    atrasado: number;
  }>();

  for (const p of periods) {
    periodMap.set(p.id, {
      competencia: p.competencia.slice(0, 7),
      entradas: 0,
      pago: 0,
      aPagar: 0,
      atrasado: 0,
    });
  }

  for (const e of expenses) {
    const m = periodMap.get(e.period_id);
    if (!m) continue;
    const v = e.valor ?? 0;
    if (e.status === "pago") m.pago += v;
    else if (e.tipo === "atrasada") m.atrasado += v;
    else m.aPagar += v;
  }

  for (const i of incomes) {
    const m = periodMap.get(i.period_id);
    if (m) m.entradas += i.valor;
  }

  // Consolida por mês (vários perfis → mesmo mês)
  const mesMap = new Map<string, {
    entradas: number;
    pago: number;
    aPagar: number;
    atrasado: number;
  }>();

  for (const v of periodMap.values()) {
    const cur = mesMap.get(v.competencia) ?? { entradas: 0, pago: 0, aPagar: 0, atrasado: 0 };
    cur.entradas += v.entradas;
    cur.pago += v.pago;
    cur.aPagar += v.aPagar;
    cur.atrasado += v.atrasado;
    mesMap.set(v.competencia, cur);
  }

  // Constrói array ordenado
  const chartData: MonthData[] = Array.from(mesMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([comp, v]) => {
      const saidas = v.pago + v.aPagar + v.atrasado;
      return {
        label: formatMesLabel(comp),
        competencia: comp,
        entradas: v.entradas,
        saidas,
        pago: v.pago,
        aPagar: v.aPagar,
        atrasado: v.atrasado,
        saldo: v.entradas - saidas,
      };
    });

  // Totais gerais
  const totalEntradas = chartData.reduce((s, d) => s + d.entradas, 0);
  const totalSaidas = chartData.reduce((s, d) => s + d.saidas, 0);
  const saldoTotal = totalEntradas - totalSaidas;
  const mediaMensal = chartData.length > 0 ? totalSaidas / chartData.length : 0;

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-gray-950 pb-24">
      <Header />

      {/* Cards de resumo */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-2">
        <SummaryCard label="Total entradas" value={formatCurrency(totalEntradas)} color="text-emerald-400" bg="bg-emerald-500/10" />
        <SummaryCard label="Total saídas" value={formatCurrency(totalSaidas)} color="text-red-400" bg="bg-red-500/10" />
        <SummaryCard
          label="Saldo acumulado"
          value={formatCurrency(saldoTotal)}
          color={saldoTotal >= 0 ? "text-indigo-400" : "text-red-400"}
          bg={saldoTotal >= 0 ? "bg-indigo-500/10" : "bg-red-500/10"}
        />
        <SummaryCard label="Média mensal saídas" value={formatCurrency(mediaMensal)} color="text-amber-400" bg="bg-amber-500/10" />
      </div>

      {/* Gráfico */}
      <div className="mx-4 mt-4">
        <CashFlowChart data={chartData} />
      </div>

      {/* Tabela mês a mês */}
      <section className="mt-4 px-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-gray-600">
          Detalhe por mês
        </p>
        <div className="overflow-hidden rounded-xl bg-gray-800">
          {/* Header */}
          <div className="grid grid-cols-4 gap-2 bg-gray-700/50 px-4 py-2 text-xs font-medium text-gray-500">
            <span>Mês</span>
            <span className="text-right">Entradas</span>
            <span className="text-right">Saídas</span>
            <span className="text-right">Saldo</span>
          </div>
          {/* Linhas */}
          <div className="divide-y divide-gray-700/50">
            {chartData.map((d) => (
              <div key={d.competencia} className="grid grid-cols-4 gap-2 px-4 py-3 text-xs">
                <span className="font-medium text-gray-300 capitalize">{d.label}</span>
                <span className="text-right text-emerald-400">{formatCurrency(d.entradas)}</span>
                <span className="text-right text-red-400">{formatCurrency(d.saidas)}</span>
                <span className={`text-right font-semibold ${d.saldo >= 0 ? "text-indigo-400" : "text-red-400"}`}>
                  {formatCurrency(d.saldo)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detalhe de saídas */}
      <section className="mt-4 px-4 pb-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-gray-600">
          Composição das saídas
        </p>
        <div className="overflow-hidden rounded-xl bg-gray-800">
          <div className="grid grid-cols-4 gap-2 bg-gray-700/50 px-4 py-2 text-xs font-medium text-gray-500">
            <span>Mês</span>
            <span className="text-right text-emerald-500/80">Pago</span>
            <span className="text-right text-sky-500/80">A Pagar</span>
            <span className="text-right text-amber-500/80">Atrasado</span>
          </div>
          <div className="divide-y divide-gray-700/50">
            {chartData.map((d) => (
              <div key={d.competencia} className="grid grid-cols-4 gap-2 px-4 py-3 text-xs">
                <span className="font-medium text-gray-300">{d.label}</span>
                <span className="text-right text-gray-400">{formatCurrency(d.pago)}</span>
                <span className="text-right text-gray-400">{formatCurrency(d.aPagar)}</span>
                <span className={`text-right ${d.atrasado > 0 ? "text-amber-400" : "text-gray-600"}`}>
                  {formatCurrency(d.atrasado)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Header() {
  return (
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
      <h1 className="text-xl font-bold text-gray-100">Fluxo de Caixa</h1>
      <p className="mt-1 text-sm text-gray-500">Entradas × saídas por mês</p>
    </div>
  );
}

function SummaryCard({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <div className={`rounded-xl p-3 ${bg}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}
