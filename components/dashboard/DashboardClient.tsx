"use client";

import { useState } from "react";
import { SectionTitle } from "./SectionTitle";
import { TimelineCard } from "./TimelineCard";
import { ExpenseDrawer } from "@/components/expenses/ExpenseDrawer";
import type { Expense, Profile, ExpenseStatus } from "@/lib/types";

interface DashboardClientProps {
  profiles: Profile[];
  profileMap: Record<string, Profile>;
  venceHoje: Expense[];
  proximos7ByDate: Record<string, Expense[]>;
  atrasadas: Expense[];
  isEmpty: boolean;
}

function formatDateBR(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function DashboardClient({
  profiles,
  profileMap,
  venceHoje,
  proximos7ByDate,
  atrasadas,
  isEmpty,
}: DashboardClientProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  function openCreate() {
    setEditingExpense(null);
    setDrawerOpen(true);
  }

  function openEdit(expense: Expense) {
    setEditingExpense(expense);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingExpense(null);
  }

  return (
    <>
      {/* Vence Hoje */}
      {venceHoje.length > 0 && (
        <section className="mt-2">
          <SectionTitle title="Vence Hoje" count={venceHoje.length} icon="🔴" accentColor="text-red-400" />
          <div className="space-y-2 px-4 pb-2">
            {venceHoje.map((expense) => (
              <TimelineCard
                key={expense.id}
                expense={{ ...expense, status: expense.status as ExpenseStatus }}
                profile={profileMap[expense.profile_id]}
                onEdit={openEdit}
              />
            ))}
          </div>
        </section>
      )}

      {/* Próximos 7 dias */}
      {Object.keys(proximos7ByDate).length > 0 && (
        <section className="mt-2">
          <SectionTitle
            title="Próximos 7 dias"
            count={Object.values(proximos7ByDate).flat().length}
            icon="📅"
            accentColor="text-sky-400"
          />
          <div className="space-y-4 px-4 pb-2">
            {Object.entries(proximos7ByDate).map(([dateStr, items]) => {
              const date = new Date(dateStr + "T12:00:00");
              return (
                <div key={dateStr}>
                  <p className="mb-1.5 text-xs font-medium text-gray-500">{formatDateBR(date)}</p>
                  <div className="space-y-2">
                    {items.map((expense) => (
                      <TimelineCard
                        key={expense.id}
                        expense={{ ...expense, status: expense.status as ExpenseStatus }}
                        profile={profileMap[expense.profile_id]}
                        onEdit={openEdit}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Atrasadas */}
      {atrasadas.length > 0 && (
        <section className="mt-2">
          <SectionTitle title="Atrasadas" count={atrasadas.length} icon="⚠️" accentColor="text-amber-400" />
          <div className="space-y-2 px-4 pb-4">
            {atrasadas.map((expense) => (
              <TimelineCard
                key={expense.id}
                expense={{ ...expense, status: expense.status as ExpenseStatus }}
                profile={profileMap[expense.profile_id]}
                onEdit={openEdit}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-4xl">🎉</p>
          <p className="mt-3 text-lg font-semibold text-gray-300">Tudo em dia!</p>
          <p className="mt-1 text-sm text-gray-600">Nenhuma conta pendente nos próximos 7 dias.</p>
        </div>
      )}

      {/* FAB — Nova conta */}
      <button
        onClick={openCreate}
        className="fixed bottom-6 right-1/2 translate-x-1/2 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 shadow-lg shadow-indigo-900/50 transition-transform hover:scale-105 hover:bg-indigo-500 active:scale-95"
        style={{ maxWidth: "calc(512px / 2 + 28px)" }}
        title="Nova conta"
      >
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Bottom sheet */}
      <ExpenseDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        profiles={profiles}
        expense={editingExpense}
      />
    </>
  );
}
