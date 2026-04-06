import Link from "next/link";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

interface DashboardHeaderProps {
  totalAPagar: number;
  totalAtrasado: number;
  totalEntradas: number;
  today: Date;
}

export function DashboardHeader({
  totalAPagar,
  totalAtrasado,
  totalEntradas,
  today,
}: DashboardHeaderProps) {
  const saldo = totalEntradas - totalAPagar - totalAtrasado;

  return (
    <div className="bg-gray-900 px-4 pb-4 pt-6">
      {/* Data + link assinaturas */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
            {formatDate(today)}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-100">Minhas Contas</h1>
        </div>
        <div className="flex flex-col items-end gap-1 mt-1">
          <Link
            href="/assinaturas"
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Assinaturas
          </Link>
          <Link
            href="/emprestimos"
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Empréstimos
          </Link>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <SummaryCard
          label="A Pagar"
          value={formatCurrency(totalAPagar)}
          color="text-sky-400"
          bgColor="bg-sky-500/10"
        />
        <SummaryCard
          label="Atrasado"
          value={formatCurrency(totalAtrasado)}
          color="text-red-400"
          bgColor="bg-red-500/10"
        />
        <SummaryCard
          label="Saldo Est."
          value={formatCurrency(saldo)}
          color={saldo >= 0 ? "text-emerald-400" : "text-red-400"}
          bgColor={saldo >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}
        />
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
  bgColor,
}: {
  label: string;
  value: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className={`rounded-xl p-3 ${bgColor}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}
