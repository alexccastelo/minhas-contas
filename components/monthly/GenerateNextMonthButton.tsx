"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { Expense } from "@/lib/types";

interface GenerateNextMonthButtonProps {
  profileId: string;
  currentMes: string; // "YYYY-MM"
  nextMes: string;    // "YYYY-MM"
  currentPeriodId: string | null;
  nextPeriodExists: boolean;
  assinaturas: Expense[];
  unpaidExpenses: Expense[]; // normais + atrasadas não pagas
}

function nextMonthVencimento(vencimento: string, nextMes: string): string {
  // Mantém o mesmo dia, mas no próximo mês
  const day = vencimento.split("-")[2];
  const [year, month] = nextMes.split("-").map(Number);
  // Garante que o dia não ultrapasse o último dia do mês destino
  const lastDay = new Date(year, month, 0).getDate();
  const safeDay = Math.min(parseInt(day), lastDay);
  return `${nextMes}-${String(safeDay).padStart(2, "0")}`;
}

export function GenerateNextMonthButton({
  profileId,
  nextMes,
  currentPeriodId,
  nextPeriodExists,
  assinaturas,
  unpaidExpenses,
}: GenerateNextMonthButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(nextPeriodExists);

  if (done) {
    return (
      <button
        onClick={() => router.push(`/perfil/${profileId}/${nextMes}`)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-800 px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        Ver {nextMes.split("-").reverse().join("/")}
      </button>
    );
  }

  async function generate() {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = createClient() as any;

    try {
      const nextCompetencia = `${nextMes}-01`;

      // 1. Cria o período do próximo mês
      const { data: newPeriod, error: periodErr } = await sb
        .from("monthly_periods")
        .insert({ profile_id: profileId, competencia: nextCompetencia })
        .select("id")
        .single();

      if (periodErr) throw periodErr;
      const newPeriodId: string = newPeriod.id;

      // 2. Copia assinaturas do mês atual para o próximo
      if (currentPeriodId && assinaturas.length > 0) {
        const newAssinaturas = assinaturas.map((a) => ({
          period_id: newPeriodId,
          profile_id: profileId,
          descricao: a.descricao,
          vencimento: nextMonthVencimento(a.vencimento, nextMes),
          valor: a.valor,
          status: "a_pagar" as const,
          tipo: "assinatura" as const,
          observacao: a.observacao,
          subscription_id: a.subscription_id,
        }));

        const { error: assErr } = await sb.from("expenses").insert(newAssinaturas);
        if (assErr) throw assErr;
      }

      // 3. Rola inadimplência: despesas normais + atrasadas não pagas → atrasadas no próximo mês
      if (unpaidExpenses.length > 0) {
        const roladas = unpaidExpenses.map((e) => ({
          period_id: newPeriodId,
          profile_id: profileId,
          descricao: e.descricao,
          vencimento: `${nextMes}-01`, // primeiro dia do próximo mês
          valor: e.valor,
          status: "a_pagar" as const,
          tipo: "atrasada" as const,
          observacao: e.observacao
            ? `Rolada de ${e.vencimento} — ${e.observacao}`
            : `Rolada de ${e.vencimento}`,
        }));

        const { error: rolaErr } = await sb.from("expenses").insert(roladas);
        if (rolaErr) throw rolaErr;
      }

      setDone(true);
      router.push(`/perfil/${profileId}/${nextMes}`);
    } catch (err) {
      console.error("Erro ao gerar próximo mês:", err);
      alert("Erro ao gerar próximo mês. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={generate}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50 active:bg-indigo-700"
    >
      {loading ? (
        <>
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Gerando…
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Gerar {nextMes.split("-").reverse().join("/")}
          {unpaidExpenses.length > 0 && (
            <span className="ml-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
              {unpaidExpenses.length} rolada{unpaidExpenses.length > 1 ? "s" : ""}
            </span>
          )}
        </>
      )}
    </button>
  );
}
