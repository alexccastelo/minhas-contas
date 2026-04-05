import Link from "next/link";
import type { Profile } from "@/lib/types";

interface MonthlyHeaderProps {
  profile: Profile;
  mes: string; // "YYYY-MM"
  totalAPagar: number;
  totalPago: number;
  totalAtrasado: number;
  totalEntradas: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatMes(mes: string) {
  const [year, month] = mes.split("-");
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
    new Date(parseInt(year), parseInt(month) - 1, 1)
  );
}

function prevMes(mes: string) {
  const [year, month] = mes.split("-").map(Number);
  const d = new Date(year, month - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMes(mes: string) {
  const [year, month] = mes.split("-").map(Number);
  const d = new Date(year, month, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function MonthlyHeader({
  profile,
  mes,
  totalAPagar,
  totalPago,
  totalAtrasado,
  totalEntradas,
}: MonthlyHeaderProps) {
  const saldo = totalEntradas - totalAPagar - totalAtrasado;
  const total = totalAPagar + totalPago + totalAtrasado;

  return (
    <div className="bg-gray-900 px-4 pb-4 pt-5">
      {/* Voltar + perfil */}
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

      {/* Nome do perfil */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: profile.cor }} />
        <h1 className="text-xl font-bold text-gray-100">{profile.nome}</h1>
      </div>

      {/* Navegação de mês */}
      <div className="mt-2 flex items-center gap-3">
        <Link
          href={`/perfil/${profile.id}/${prevMes(mes)}`}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <p className="flex-1 text-center text-sm font-medium capitalize text-gray-300">
          {formatMes(mes)}
        </p>
        <Link
          href={`/perfil/${profile.id}/${nextMes(mes)}`}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Cards de resumo */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <SummaryCard label="A Pagar" value={formatCurrency(totalAPagar)} color="text-sky-400" bg="bg-sky-500/10" />
        <SummaryCard label="Pago" value={formatCurrency(totalPago)} color="text-emerald-400" bg="bg-emerald-500/10" />
        <SummaryCard label="Atrasado" value={formatCurrency(totalAtrasado)} color="text-red-400" bg="bg-red-500/10" />
        <SummaryCard
          label="Saldo Est."
          value={formatCurrency(saldo)}
          color={saldo >= 0 ? "text-emerald-400" : "text-red-400"}
          bg={saldo >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}
        />
      </div>

      {/* Total */}
      <div className="mt-2 flex items-center justify-between rounded-xl bg-gray-800 px-4 py-2.5">
        <span className="text-xs text-gray-500">Total do mês</span>
        <span className="text-sm font-bold text-gray-200">{formatCurrency(total)}</span>
      </div>
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
