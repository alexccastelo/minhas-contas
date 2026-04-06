"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { Loan, Profile } from "@/lib/types";

interface LoanDrawerProps {
  open: boolean;
  onClose: () => void;
  profiles: Profile[];
  loan?: Loan | null;
}

export function LoanDrawer({ open, onClose, profiles, loan }: LoanDrawerProps) {
  const router = useRouter();
  const isEdit = !!loan;

  const [profileId, setProfileId] = useState(profiles[0]?.id ?? "");
  const [descricao, setDescricao] = useState("");
  const [valorEmprestado, setValorEmprestado] = useState("");
  const [parcelaMensal, setParcelaMensal] = useState("");
  const [vencimentoAtual, setVencimentoAtual] = useState("");
  const [ultimoVencimento, setUltimoVencimento] = useState("");
  const [status, setStatus] = useState<"a_pagar" | "pago">("a_pagar");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loan) {
      setProfileId(loan.profile_id);
      setDescricao(loan.descricao);
      setValorEmprestado(loan.valor_emprestado?.toString() ?? "");
      setParcelaMensal(loan.parcela_mensal?.toString() ?? "");
      setVencimentoAtual(loan.vencimento_atual ?? "");
      setUltimoVencimento(loan.ultimo_vencimento ?? "");
      setStatus(loan.status);
    } else {
      setProfileId(profiles[0]?.id ?? "");
      setDescricao("");
      setValorEmprestado("");
      setParcelaMensal("");
      setVencimentoAtual("");
      setUltimoVencimento("");
      setStatus("a_pagar");
    }
    setError(null);
  }, [loan, open, profiles]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descricao.trim()) return;
    setLoading(true);
    setError(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = createClient() as any;
    const payload = {
      profile_id: profileId,
      descricao: descricao.trim(),
      valor_emprestado: valorEmprestado ? parseFloat(valorEmprestado.replace(",", ".")) : null,
      parcela_mensal: parcelaMensal ? parseFloat(parcelaMensal.replace(",", ".")) : null,
      vencimento_atual: vencimentoAtual || null,
      ultimo_vencimento: ultimoVencimento || null,
      status,
    };

    try {
      if (isEdit) {
        const { error: err } = await sb.from("loans").update(payload).eq("id", loan!.id);
        if (err) throw err;
      } else {
        const { error: err } = await sb.from("loans").insert(payload);
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
            {isEdit ? "Editar empréstimo" : "Novo empréstimo"}
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
        <form onSubmit={handleSubmit} className="space-y-3 px-4 pb-8 overflow-y-auto max-h-[75vh]">
          {/* Perfil */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Perfil</label>
            <select
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              className="w-full rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
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
              placeholder="Ex: Nubank, Shopee…"
              required
              className="w-full rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Valor emprestado + Parcela */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Valor total (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                value={valorEmprestado}
                onChange={(e) => setValorEmprestado(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Parcela mensal (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                value={parcelaMensal}
                onChange={(e) => setParcelaMensal(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Próximo vencimento + Último vencimento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Próx. vencimento</label>
              <input
                type="date"
                value={vencimentoAtual}
                onChange={(e) => setVencimentoAtual(e.target.value)}
                className="w-full rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Último vencimento</label>
              <input
                type="date"
                value={ultimoVencimento}
                onChange={(e) => setUltimoVencimento(e.target.value)}
                className="w-full rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "a_pagar" | "pago")}
              className="w-full rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="a_pagar">Em aberto</option>
              <option value="pago">Quitado</option>
            </select>
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Salvando…" : isEdit ? "Salvar alterações" : "Adicionar empréstimo"}
          </button>
        </form>
      </div>
    </>
  );
}
