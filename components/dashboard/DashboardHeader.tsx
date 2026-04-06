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

const NAV_LINKS = [
  {
    href: "/kanban",
    label: "Kanban",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
  },
  {
    href: "/fluxo",
    label: "Fluxo",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: "/assinaturas",
    label: "Assinaturas",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    href: "/emprestimos",
    label: "Empréstimos",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: "/contracheque",
    label: "Contracheque",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export function DashboardHeader({
  totalAPagar,
  totalAtrasado,
  totalEntradas,
  today,
}: DashboardHeaderProps) {
  const saldo = totalEntradas - totalAPagar - totalAtrasado;

  return (
    <div className="bg-gray-900 pt-6 pb-3">
      {/* Título */}
      <div className="px-4">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
          {formatDate(today)}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-gray-100">Minhas Contas</h1>
      </div>

      {/* Cards de resumo */}
      <div className="mt-4 grid grid-cols-3 gap-2 px-4">
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

      {/* Nav horizontal scrollável */}
      <nav className="mt-3 flex gap-1 overflow-x-auto px-4 pb-1 scrollbar-none">
        {NAV_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex flex-none items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors whitespace-nowrap"
          >
            {l.icon}
            {l.label}
          </Link>
        ))}
      </nav>
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
