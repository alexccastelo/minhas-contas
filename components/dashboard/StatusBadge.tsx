import type { ExpenseStatus } from "@/lib/types";

const config: Record<ExpenseStatus, { label: string; className: string }> = {
  pago: {
    label: "Pago",
    className: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25",
  },
  a_pagar: {
    label: "A pagar",
    className: "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/25",
  },
  atrasado: {
    label: "Atrasado",
    className: "bg-red-500/15 text-red-400 ring-1 ring-red-500/25",
  },
};

export function StatusBadge({ status }: { status: ExpenseStatus }) {
  const { label, className } = config[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
