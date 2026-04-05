"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { Expense, Profile, ExpenseStatus, ExpenseTipo } from "@/lib/types";

interface ExpenseDrawerProps {
  open: boolean;
  onClose: () => void;
  profiles: Profile[];
  expense?: Expense | null; // se fornecido = modo edit
}

const statusOptions: { value: ExpenseStatus; label: string }[] = [
  { value: "a_pagar", label: "A pagar" },
  { value: "pago", label: "Pago" },
  { value: "atrasado", label: "Atrasado" },
];

const tipoOptions: { value: ExpenseTipo; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "assinatura", label: "Assinatura" },
  { value: "atrasada", label: "Atrasada" },
];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export function ExpenseDrawer({ open, onClose, profiles, expense }: ExpenseDrawerProps) {
  const router = useRouter();
  const isEdit = !!expense;

  const [profileId, setProfileId] = useState(profiles[0]?.id ?? "");
  const [descricao, setDescricao] = useState("");
  const [vencimento, setVencimento] = useState(todayStr());
  const [valor, setValor] = useState("");
  const [status, setStatus] = useState<ExpenseStatus>("a_pagar");
  const [tipo, setTipo] = useState<ExpenseTipo>("normal");
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preenche formulário no modo edit
  useEffect(() => {
    if (expense) {
      setProfileId(expense.profile_id);
      setDescricao(expense.descricao);
      setVencimento(expense.vencimento);
      setValor(expense.valor?.toString() ?? "");
      setStatus(expense.status);
      setTipo(expense.tipo);
      setObservacao(expense.observacao ?? "");
    } else {
      setProfileId(profiles[0]?.id ?? "");
      setDescricao("");
      setVencimento(todayStr());
      setValor("");
      setStatus("a_pagar");
      setTipo("normal");
      setObservacao("");
    }
    setError(null);
  }, [expense, open, profiles]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descricao.trim() || !vencimento) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    try {
      if (isEdit) {
        const { error: err } = await sb
          .from("expenses")
          .update({
            profile_id: profileId,
            descricao: descricao.trim(),
            vencimento,
            valor: valor ? parseFloat(valor.replace(",", ".")) : null,
            status,
            tipo,
            observacao: observacao.trim() || null,
            pago_em: status === "pago" ? new Date().toISOString() : null,
          })
          .eq("id", expense!.id);
        if (err) throw err;
      } else {
        // Busca ou cria o period_id para profile + mês
        const competencia = vencimento.slice(0, 7) + "-01"; // "YYYY-MM-01"
        let periodId: string;

        const { data: existing } = await sb
          .from("monthly_periods")
          .select("id")
          .eq("profile_id", profileId)
          .eq("competencia", competencia)
          .maybeSingle();

        if (existing) {
          periodId = existing.id;
        } else {
          const { data: created, error: createErr } = await sb
            .from("monthly_periods")
            .insert({ profile_id: profileId, competencia })
            .select("id")
            .single();
          if (createErr) throw createErr;
          periodId = created.id;
        }

        const { error: err } = await sb.from("expenses").insert({
          period_id: periodId,
          profile_id: profileId,
          descricao: descricao.trim(),
          vencimento,
          valor: valor ? parseFloat(valor.replace(",", ".")) : null,
          status,
          tipo,
          observacao: observacao.trim() || null,
          pago_em: status === "pago" ? new Date().toISOString() : null,
        });
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
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Bottom sheet */}
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
            {isEdit ? "Editar conta" : "Nova conta"}
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
        <form onSubmit={handleSubmit} className="space-y-3 px-4 pb-8">
          {/* Perfil */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Perfil</label>
            <select
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              className="w-full rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Descrição *</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Conta de luz"
              required
              className="w-full rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Vencimento + Valor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Vencimento *</label>
              <input
                type="date"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                required
                className="w-full rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

          {/* Status + Tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ExpenseStatus)}
                className="w-full rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as ExpenseTipo)}
                className="w-full rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {tipoOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Observação */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Observação</label>
            <input
              type="text"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Opcional"
              className="w-full rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Erro */}
          {error && (
            <p className="rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-400">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Salvando…" : isEdit ? "Salvar alterações" : "Adicionar conta"}
          </button>
        </form>
      </div>
    </>
  );
}
