"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface MonthData {
  label: string;       // "Abr/26"
  competencia: string; // "2026-04"
  entradas: number;
  saidas: number;      // total de despesas do mês
  pago: number;
  aPagar: number;
  atrasado: number;
  saldo: number;       // entradas - saidas
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

// Tooltip customizado para dark mode
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 p-3 shadow-xl text-xs space-y-1.5 min-w-[180px]">
      <p className="font-semibold text-gray-200 mb-2">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full flex-none" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-400">{entry.name}</span>
          </div>
          <span className="font-medium text-gray-200">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

interface CashFlowChartProps {
  data: MonthData[];
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-2xl bg-gray-800 py-16">
        <p className="text-sm text-gray-500">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gray-800 p-4">
      <p className="mb-4 text-xs font-medium uppercase tracking-widest text-gray-500">
        Entradas × Saídas
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "11px", color: "#9ca3af", paddingTop: "12px" }}
          />
          <Bar dataKey="entradas" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="saidas" name="Saídas" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Line
            type="monotone"
            dataKey="saldo"
            name="Saldo est."
            stroke="#818cf8"
            strokeWidth={2}
            dot={{ fill: "#818cf8", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
