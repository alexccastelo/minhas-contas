"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { Expense, Profile, ExpenseStatus } from "@/lib/types";

interface KanbanBoardProps {
  expenses: Expense[];
  profileMap: Record<string, Profile>;
  todayStr: string; // "YYYY-MM-DD"
  mes: string;       // "YYYY-MM"
}

const COLS = [
  { id: "atrasado", label: "Atrasado", icon: "⚠️", color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10" },
  { id: "hoje",     label: "Vence Hoje", icon: "🔔", color: "text-sky-400",   border: "border-sky-500/30",   bg: "bg-sky-500/10" },
  { id: "avencer",  label: "A Vencer",   icon: "📅", color: "text-gray-300",  border: "border-gray-600",     bg: "bg-gray-800/50" },
  { id: "pago",     label: "Pago",       icon: "✅", color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" },
] as const;

type ColId = typeof COLS[number]["id"];

function classifyExpense(e: Expense, todayStr: string): ColId {
  if (e.status === "pago") return "pago";
  if (e.vencimento < todayStr) return "atrasado";
  if (e.vencimento === todayStr) return "hoje";
  return "avencer";
}

function formatCurrency(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDateBR(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(d);
}

export function KanbanBoard({ expenses, profileMap, todayStr, mes }: KanbanBoardProps) {
  const router = useRouter();
  const [activeCol, setActiveCol] = useState<ColId>("hoje");
  const [localStatuses, setLocalStatuses] = useState<Record<string, ExpenseStatus>>({});

  // Classificação com status local (otimista)
  const classified = useMemo(() => {
    const map: Record<ColId, Expense[]> = { atrasado: [], hoje: [], avencer: [], pago: [] };
    for (const e of expenses) {
      const effectiveStatus = localStatuses[e.id] ?? e.status;
      const effective = { ...e, status: effectiveStatus };
      const col = classifyExpense(effective, todayStr);
      map[col].push(effective);
    }
    // Ordena cada coluna por vencimento
    for (const col of Object.values(map)) {
      col.sort((a, b) => a.vencimento.localeCompare(b.vencimento));
    }
    return map;
  }, [expenses, localStatuses, todayStr]);

  async function changeStatus(expenseId: string, newStatus: ExpenseStatus) {
    // Atualização otimista
    setLocalStatuses((prev) => ({ ...prev, [expenseId]: newStatus }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = createClient() as any;
    const update: Record<string, unknown> = { status: newStatus };
    if (newStatus === "pago") update.pago_em = new Date().toISOString();
    if (newStatus === "a_pagar") update.pago_em = null;

    const { error } = await sb.from("expenses").update(update).eq("id", expenseId);
    if (error) {
      // Reverte otimismo
      setLocalStatuses((prev) => {
        const next = { ...prev };
        delete next[expenseId];
        return next;
      });
    } else {
      router.refresh();
    }
  }

  const currentCol = COLS.find((c) => c.id === activeCol)!;
  const items = classified[activeCol];

  return (
    <div>
      {/* Tabs de colunas */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
        {COLS.map((col) => {
          const count = classified[col.id].length;
          const isActive = col.id === activeCol;
          return (
            <button
              key={col.id}
              onClick={() => setActiveCol(col.id)}
              className={`flex flex-none items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? `${col.bg} ${col.color} ring-1 ${col.border}`
                  : "bg-gray-800 text-gray-500 hover:text-gray-300"
              }`}
            >
              <span>{col.icon}</span>
              <span>{col.label}</span>
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                  isActive ? "bg-white/10" : "bg-gray-700 text-gray-400"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cards da coluna ativa */}
      <div className="px-4 pb-24">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-3xl">{currentCol.icon}</p>
            <p className="mt-3 text-sm font-medium text-gray-500">
              Nenhuma conta em &ldquo;{currentCol.label}&rdquo;
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((expense) => (
              <KanbanCard
                key={expense.id}
                expense={expense}
                profile={profileMap[expense.profile_id]}
                todayStr={todayStr}
                mes={mes}
                onChangeStatus={changeStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── KanbanCard ──────────────────────────────────────────────────────────────

function KanbanCard({
  expense,
  profile,
  todayStr,
  mes,
  onChangeStatus,
}: {
  expense: Expense;
  profile: Profile;
  todayStr: string;
  mes: string;
  onChangeStatus: (id: string, status: ExpenseStatus) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isPago = expense.status === "pago";
  const isAtrasado = expense.vencimento < todayStr && !isPago;

  return (
    <div className={`relative rounded-xl p-3 transition-colors ${
      isPago ? "bg-gray-800/40" : isAtrasado ? "bg-amber-500/5 ring-1 ring-amber-500/20" : "bg-gray-800"
    }`}>
      <div className="flex items-start gap-3">
        {/* Barra de perfil */}
        <div className="mt-0.5 h-full w-1 flex-none self-stretch rounded-full" style={{ backgroundColor: profile?.cor ?? "#6b7280" }} />

        {/* Conteúdo */}
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium leading-tight ${isPago ? "line-through text-gray-500" : "text-gray-100"}`}>
            {expense.descricao}
          </p>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">{profile?.nome}</span>
            <span className="text-xs text-gray-600">·</span>
            <span className={`text-xs ${isAtrasado ? "text-amber-400" : "text-gray-500"}`}>
              {formatDateBR(expense.vencimento)}
            </span>
            {expense.tipo === "assinatura" && (
              <span className="rounded-full bg-indigo-500/15 px-1.5 py-0.5 text-xs text-indigo-400">ass.</span>
            )}
            {expense.tipo === "atrasada" && (
              <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-xs text-amber-400">rolada</span>
            )}
          </div>
        </div>

        {/* Valor + menu de status */}
        <div className="flex flex-none flex-col items-end gap-2">
          <span className={`text-sm font-semibold ${isPago ? "text-gray-500" : "text-gray-200"}`}>
            {formatCurrency(expense.valor)}
          </span>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className={`rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                isPago
                  ? "bg-emerald-500/20 text-emerald-400"
                  : isAtrasado
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-gray-700 text-gray-400"
              }`}
            >
              {isPago ? "Pago ▾" : isAtrasado ? "Atrasado ▾" : "A Pagar ▾"}
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-32 overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-xl">
                  {(["a_pagar", "pago"] as ExpenseStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => { onChangeStatus(expense.id, s); setMenuOpen(false); }}
                      className={`w-full px-3 py-2.5 text-left text-xs transition-colors hover:bg-gray-800 ${
                        expense.status === s ? "text-indigo-400 font-medium" : "text-gray-400"
                      }`}
                    >
                      {s === "a_pagar" ? "☐ A Pagar" : "☑ Pago"}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
