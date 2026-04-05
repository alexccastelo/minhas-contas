"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { StatusBadge } from "./StatusBadge";
import type { Expense, Profile } from "@/lib/types";

interface TimelineCardProps {
  expense: Expense;
  profile: Profile;
  onEdit?: (expense: Expense) => void;
}

export function formatCurrency(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function TimelineCard({ expense, profile, onEdit }: TimelineCardProps) {
  const router = useRouter();
  const [status, setStatus] = useState(expense.status);
  const [loading, setLoading] = useState(false);

  // Mês atual para o link da visão mensal
  const mesAtual = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  async function darBaixa() {
    if (status === "pago" || loading) return;
    setLoading(true);
    setStatus("pago"); // otimista

    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("expenses")
      .update({ status: "pago", pago_em: new Date().toISOString() })
      .eq("id", expense.id);

    if (error) {
      setStatus(expense.status); // reverte
    } else {
      router.refresh(); // re-busca dados do Server Component
    }
    setLoading(false);
  }

  return (
    <div
      className={`group flex items-center gap-3 rounded-xl p-3 transition-colors ${
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
        {/* Nome do perfil como link para a visão mensal */}
        <Link
          href={`/perfil/${profile.id}/${mesAtual}`}
          className="mt-0.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {profile.nome}
        </Link>
      </div>

      {/* Valor + Status */}
      <div className="flex flex-none flex-col items-end gap-1">
        <span className="text-sm font-semibold text-gray-200">
          {formatCurrency(expense.valor)}
        </span>
        <StatusBadge status={status} />
      </div>

      {/* Ações: edit + delete aparecem no hover */}
      {status !== "pago" && onEdit && (
        <div className="flex flex-none items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(expense)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-600 hover:text-gray-200 transition-colors"
            title="Editar"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <DeleteButton expenseId={expense.id} />
        </div>
      )}

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

// DeleteButton inline com confirmação
function DeleteButton({ expenseId }: { expenseId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("expenses").delete().eq("id", expenseId);
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="rounded-lg px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          {loading ? "…" : "Sim"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Não
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
      title="Excluir"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}
