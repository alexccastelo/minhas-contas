"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { StatusBadge } from "./StatusBadge";
import type { Expense, Profile } from "@/lib/types";

interface TimelineCardProps {
  expense: Expense;
  profile: Profile;
}

function formatCurrency(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function TimelineCard({ expense, profile }: TimelineCardProps) {
  const [status, setStatus] = useState(expense.status);
  const [loading, setLoading] = useState(false);

  async function darBaixa() {
    if (status === "pago" || loading) return;
    setLoading(true);
    // Atualização otimista
    setStatus("pago");

    const supabase = createClient();
    const { error } = await supabase
      .from("expenses")
      .update({ status: "pago", pago_em: new Date().toISOString() })
      .eq("id", expense.id);

    if (error) {
      // Reverte se falhou
      setStatus(expense.status);
    }
    setLoading(false);
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${
        status === "pago"
          ? "bg-gray-800/40 opacity-60"
          : "bg-gray-800 hover:bg-gray-700/80"
      }`}
    >
      {/* Cor do perfil */}
      <div
        className="h-9 w-1 flex-none rounded-full"
        style={{ backgroundColor: profile.cor }}
      />

      {/* Conteúdo */}
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium ${
            status === "pago" ? "line-through text-gray-500" : "text-gray-100"
          }`}
        >
          {expense.descricao}
        </p>
        <p className="mt-0.5 text-xs text-gray-500">{profile.nome}</p>
      </div>

      {/* Valor + Status */}
      <div className="flex flex-none flex-col items-end gap-1">
        <span className="text-sm font-semibold text-gray-200">
          {formatCurrency(expense.valor)}
        </span>
        <StatusBadge status={status} />
      </div>

      {/* Botão dar baixa */}
      {status !== "pago" && (
        <button
          onClick={darBaixa}
          disabled={loading}
          className="flex-none rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 active:bg-emerald-700"
        >
          {loading ? "…" : "✓"}
        </button>
      )}
    </div>
  );
}
