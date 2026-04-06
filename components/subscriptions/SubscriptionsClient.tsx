"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { SubscriptionDrawer } from "./SubscriptionDrawer";
import type { Subscription } from "@/lib/types";

interface SubscriptionsClientProps {
  subscriptions: Subscription[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const categoriaCores: Record<string, string> = {
  AI: "text-violet-400 bg-violet-500/10",
  Cloud: "text-sky-400 bg-sky-500/10",
  Streaming: "text-rose-400 bg-rose-500/10",
  Telecom: "text-amber-400 bg-amber-500/10",
  Devices: "text-cyan-400 bg-cyan-500/10",
  Saúde: "text-emerald-400 bg-emerald-500/10",
  Finanças: "text-yellow-400 bg-yellow-500/10",
  Educação: "text-indigo-400 bg-indigo-500/10",
  Outros: "text-gray-400 bg-gray-500/10",
};

export function SubscriptionsClient({ subscriptions }: SubscriptionsClientProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }

  function openEdit(sub: Subscription) {
    setEditing(sub);
    setDrawerOpen(true);
  }

  async function toggleAtivo(sub: Subscription) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = createClient() as any;
    await sb.from("subscriptions").update({ ativo: !sub.ativo }).eq("id", sub.id);
    router.refresh();
  }

  async function handleDelete(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = createClient() as any;
    await sb.from("subscriptions").delete().eq("id", id);
    router.refresh();
  }

  // Agrupa por categoria
  const porCategoria = subscriptions.reduce<Record<string, Subscription[]>>((acc, s) => {
    if (!acc[s.tipo]) acc[s.tipo] = [];
    acc[s.tipo].push(s);
    return acc;
  }, {});

  const ativas = subscriptions.filter((s) => s.ativo);
  const totalMensal = ativas
    .filter((s) => s.frequencia === "mensal")
    .reduce((sum, s) => sum + s.valor, 0);
  const totalAnual = ativas
    .filter((s) => s.frequencia === "anual")
    .reduce((sum, s) => sum + s.valor, 0);

  return (
    <>
      {/* Resumo */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-indigo-500/10 p-3">
          <p className="text-xs text-gray-500">Mensal (ativas)</p>
          <p className="mt-1 text-sm font-bold text-indigo-400">{formatCurrency(totalMensal)}</p>
        </div>
        <div className="rounded-xl bg-purple-500/10 p-3">
          <p className="text-xs text-gray-500">Anual (ativas)</p>
          <p className="mt-1 text-sm font-bold text-purple-400">{formatCurrency(totalAnual)}</p>
        </div>
      </div>

      {/* Lista por categoria */}
      <div className="mt-4 space-y-4 px-4 pb-28">
        {Object.entries(porCategoria).sort(([a], [b]) => a.localeCompare(b)).map(([cat, items]) => (
          <div key={cat}>
            <div className="mb-2 flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoriaCores[cat] ?? "text-gray-400 bg-gray-500/10"}`}>
                {cat}
              </span>
              <span className="text-xs text-gray-600">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map((sub) => (
                <SubscriptionCard
                  key={sub.id}
                  subscription={sub}
                  onEdit={openEdit}
                  onToggle={toggleAtivo}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        ))}

        {subscriptions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-4xl">📋</p>
            <p className="mt-3 text-lg font-semibold text-gray-300">Nenhuma assinatura</p>
            <p className="mt-1 text-sm text-gray-600">Use o botão + para adicionar.</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={openCreate}
        className="fixed bottom-6 right-1/2 translate-x-1/2 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 shadow-lg shadow-indigo-900/50 transition-transform hover:scale-105 hover:bg-indigo-500 active:scale-95"
        title="Nova assinatura"
      >
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <SubscriptionDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null); }}
        subscription={editing}
      />
    </>
  );
}

function SubscriptionCard({
  subscription: sub,
  onEdit,
  onToggle,
  onDelete,
}: {
  subscription: Subscription;
  onEdit: (s: Subscription) => void;
  onToggle: (s: Subscription) => void;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className={`group flex items-center gap-3 rounded-xl p-3 transition-colors ${
      sub.ativo ? "bg-gray-800 hover:bg-gray-700/80" : "bg-gray-800/40 opacity-60"
    }`}>
      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${sub.ativo ? "text-gray-100" : "text-gray-500"}`}>
          {sub.nome}
        </p>
        <p className="mt-0.5 text-xs text-gray-500">
          {sub.metodo_pagamento}
          {sub.frequencia === "mensal" && sub.dia_vencimento ? ` · dia ${sub.dia_vencimento}` : ""}
          {sub.frequencia === "anual" ? " · anual" : ""}
        </p>
      </div>

      {/* Valor */}
      <span className="flex-none text-sm font-semibold text-gray-200">
        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(sub.valor)}
      </span>

      {/* Ações */}
      <div className="flex flex-none items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(sub)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-600 hover:text-gray-200 transition-colors"
          title="Editar"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>

        {confirming ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => { onDelete(sub.id); setConfirming(false); }}
              className="rounded-lg px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
            >
              Sim
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Não
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
            title="Excluir"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Toggle ativo */}
      <button
        onClick={() => onToggle(sub)}
        className={`flex-none rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
          sub.ativo
            ? "bg-emerald-600 text-white hover:bg-emerald-500"
            : "bg-gray-700 text-gray-400 hover:bg-gray-600"
        }`}
        title={sub.ativo ? "Desativar" : "Ativar"}
      >
        {sub.ativo ? "✓" : "○"}
      </button>
    </div>
  );
}
