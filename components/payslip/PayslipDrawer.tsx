"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface PayslipDrawerProps {
  open: boolean;
  onClose: () => void;
  mariaProfileId: string;
  // Se vier um payslip existente para editar
  existing?: {
    id: string;
    periodId: string;
    competencia: string; // "YYYY-MM"
    salarioBruto: number;
    bloqueioJudicial: number;
    previdencia: number;
    planoSaude: number;
  } | null;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function PayslipDrawer({ open, onClose, mariaProfileId, existing }: PayslipDrawerProps) {
  const router = useRouter();
  const isEdit = !!existing;

  const [competencia, setCompetencia] = useState("");
  const [salarioBruto, setSalarioBruto] = useState("");
  const [bloqueioJudicial, setBloqueioJudicial] = useState("");
  const [previdencia, setPrevidencia] = useState("");
  const [planoSaude, setPlanoSaude] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setCompetencia(existing.competencia);
      setSalarioBruto(existing.salarioBruto.toFixed(2).replace(".", ","));
      setBloqueioJudicial(existing.bloqueioJudicial.toFixed(2).replace(".", ","));
      setPrevidencia(existing.previdencia.toFixed(2).replace(".", ","));
      setPlanoSaude(existing.planoSaude.toFixed(2).replace(".", ","));
    } else {
      // Default: mês atual
      const hoje = new Date();
      setCompetencia(`${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`);
      setSalarioBruto("");
      setBloqueioJudicial("");
      setPrevidencia("");
      setPlanoSaude("");
    }
    setError(null);
  }, [existing, open]);

  const parseVal = (s: string) => parseFloat(s.replace(",", ".") || "0") || 0;

  const liquido = useMemo(() => {
    return parseVal(salarioBruto) - parseVal(bloqueioJudicial) - parseVal(previdencia) - parseVal(planoSaude);
  }, [salarioBruto, bloqueioJudicial, previdencia, planoSaude]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!competencia) return;
    setLoading(true);
    setError(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = createClient() as any;

    try {
      let periodId = existing?.periodId ?? null;

      if (!isEdit) {
        // Busca ou cria o período de Maria para esse mês
        const competenciaDate = `${competencia}-01`;
        const { data: existingPeriod } = await sb
          .from("monthly_periods")
          .select("id")
          .eq("profile_id", mariaProfileId)
          .eq("competencia", competenciaDate)
          .maybeSingle();

        if (existingPeriod) {
          periodId = existingPeriod.id;
        } else {
          const { data: newPeriod, error: pErr } = await sb
            .from("monthly_periods")
            .insert({ profile_id: mariaProfileId, competencia: competenciaDate })
            .select("id")
            .single();
          if (pErr) throw pErr;
          periodId = newPeriod.id;
        }
      }

      const payload = {
        period_id: periodId,
        salario_bruto: parseVal(salarioBruto),
        bloqueio_judicial: parseVal(bloqueioJudicial),
        previdencia: parseVal(previdencia),
        plano_saude: parseVal(planoSaude),
      };

      if (isEdit) {
        const { error: err } = await sb.from("payslip_mirror").update(payload).eq("id", existing!.id);
        if (err) throw err;
      } else {
        const { error: err } = await sb.from("payslip_mirror").insert(payload);
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
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-gray-700" />
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-base font-semibold text-gray-100">
            {isEdit ? "Editar contracheque" : "Novo contracheque"}
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

        <form onSubmit={handleSubmit} className="space-y-3 px-4 pb-8 overflow-y-auto max-h-[75vh]">
          {/* Competência */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Competência</label>
            <input
              type="month"
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
              disabled={isEdit}
              required
              className="w-full rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>

          {/* Salário bruto */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Salário bruto (R$)</label>
            <input
              type="text"
              inputMode="decimal"
              value={salarioBruto}
              onChange={(e) => setSalarioBruto(e.target.value)}
              placeholder="0,00"
              required
              className="w-full rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Descontos */}
          <p className="text-xs font-medium uppercase tracking-widest text-gray-600">Descontos</p>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Bloqueio judicial</label>
              <input
                type="text"
                inputMode="decimal"
                value={bloqueioJudicial}
                onChange={(e) => setBloqueioJudicial(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Previdência</label>
              <input
                type="text"
                inputMode="decimal"
                value={previdencia}
                onChange={(e) => setPrevidencia(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Plano de saúde</label>
              <input
                type="text"
                inputMode="decimal"
                value={planoSaude}
                onChange={(e) => setPlanoSaude(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Prévia do líquido */}
          <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-4 py-3">
            <span className="text-sm font-medium text-gray-400">Líquido</span>
            <span className={`text-base font-bold ${liquido >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {formatCurrency(liquido)}
            </span>
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Salvando…" : isEdit ? "Salvar alterações" : "Adicionar contracheque"}
          </button>
        </form>
      </div>
    </>
  );
}
