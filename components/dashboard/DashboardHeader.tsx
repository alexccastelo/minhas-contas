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
      {/* Data */}
      <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
        {formatDate(today)}
      </p>
      <h1 className="mt-1 text-2xl font-bold text-gray-100">Minhas Contas</h1>

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
