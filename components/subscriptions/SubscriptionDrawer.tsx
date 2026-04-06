"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { Subscription, Frequencia } from "@/lib/types";

interface SubscriptionDrawerProps {
  open: boolean;
  onClose: () => void;
  subscription?: Subscription | null;
}

const categorias = ["AI", "Cloud", "Streaming", "Telecom", "Devices", "Saúde", "Finanças", "Educação", "Outros"];

export function SubscriptionDrawer({ open, onClose, subscription }: SubscriptionDrawerProps) {
  const router = useRouter();
  const isEdit = !!subscription;

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("Outros");
  const [frequencia, setFrequencia] = useState<Frequencia>("mensal");
  const [diaVencimento, setDiaVencimento] = useState("");
  const [dataVencAnual, setDataVencAnual] = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState("");
  const [valor, setValor] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (subscription) {
      setNome(subscription.nome);
      setTipo(subscription.tipo);
      setFrequencia(subscription.frequencia);
      setDiaVencimento(subscription.dia_vencimento?.toString() ?? "");
      setDataVencAnual(subscription.data_venc_anual ?? "");
      setMetodoPagamento(subscription.metodo_pagamento);
      setValor(subscription.valor?.toString() ?? "");
      setAtivo(subscription.ativo);
    } else {
      setNome("");
      setTipo("Outros");
      setFrequencia("mensal");
      setDiaVencimento("");
      setDataVencAnual("");
      setMetodoPagamento("");
      setValor("");
      setAtivo(true);
    }
    setError(null);
  }, [subscription, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setLoading(true);
    setError(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = createClient() as any;
    const payload = {
      nome: nome.trim(),
      tipo,
      frequencia,
      dia_vencimento: frequencia === "mensal" ? (diaVencimento ? parseInt(diaVencimento) : null) : null,
      data_venc_anual: frequencia === "anual" ? (dataVencAnual || null) : null,
      metodo_pagamento: metodoPagamento.trim(),
      valor: valor ? parseFloat(valor.replace(",", ".")) : 0,
      ativo,
    };

    try {
      if (isEdit) {
        const { error: err } = await sb.from("subscriptions").update(payload).eq("id", subscription!.id);
        if (err) throw err;
      } else {
        const { error: err } = await sb.from("subscriptions").insert(payload);
        if (err) throw err;
      }
      router.refresh();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      )}

      <div
        className={`fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg rounded-t-2xl bg-gray-900 shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-gray-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-base font-semibold text-gray-100">
            {isEdit ? "Editar assinatura" : "Nova assinatura"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 px-4 pb-8 overflow-y-auto max-h-[70vh]">
          {/* Nome */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Nome *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Netflix"
              required
              className="w-full rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Categoria + Frequência */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Categoria</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Frequência</label>
              <select
                value={frequencia}
                onChange={(e) => setFrequencia(e.target.value as Frequencia)}
                className="w-full rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="mensal">Mensal</option>
                <option value="anual">Anual</option>
              </select>
            </div>
          </div>

          {/* Vencimento */}
          {frequencia === "mensal" ? (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Dia vencimento</label>
              <input
                type="number"
                min="1"
                max="31"
                value={diaVencimento}
                onChange={(e) => setDiaVencimento(e.target.value)}
                placeholder="Ex: 15"
                className="w-full rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Data vencimento anual</label>
              <input
                type="date"
                value={dataVencAnual}
                onChange={(e) => setDataVencAnual(e.target.value)}
                className="w-full rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Método + Valor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Método pagamento</label>
              <input
                type="text"
                value={metodoPagamento}
                onChange={(e) => setMetodoPagamento(e.target.value)}
                placeholder="Ex: Nubank"
                className="w-full rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Valor (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Ativo */}
          <div className="flex items-center justify-between rounded-lg bg-gray-800 px-3 py-2.5">
            <span className="text-sm text-gray-300">Ativa</span>
            <button
              type="button"
              onClick={() => setAtivo(!ativo)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                ativo ? "bg-indigo-600" : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  ativo ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Salvando…" : isEdit ? "Salvar alterações" : "Adicionar assinatura"}
          </button>
        </form>
      </div>
    </>
  );
}
