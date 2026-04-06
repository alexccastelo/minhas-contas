"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { PayslipDrawer } from "./PayslipDrawer";

interface PayslipEntry {
  id: string;
  periodId: string;
  competencia: string; // "YYYY-MM"
  salarioBruto: number;
  bloqueioJudicial: number;
  previdencia: number;
  planoSaude: number;
  liquido: number;
}

interface DeducaoEntry {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  saldoDevedor: number;
}

interface PayslipClientProps {
  mariaProfileId: string;
  payslips: PayslipEntry[];
  deducoes: DeducaoEntry[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatMes(competencia: string) {
  const [year, month] = competencia.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

function formatDateBR(dateStr: string) {
  const date = new Date(dateStr + "T12:00:00");
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export function PayslipClient({ mariaProfileId, payslips, deducoes }: PayslipClientProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0); // 0 = mais recente
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPayslip, setEditingPayslip] = useState<PayslipEntry | null>(null);

  const current = payslips[currentIndex] ?? null;
  const canPrev = currentIndex < payslips.length - 1;
  const canNext = currentIndex > 0;

  async function handleDelete(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = createClient() as any;
    await sb.from("payslip_mirror").delete().eq("id", id);
    router.refresh();
  }

  return (
    <>
      {/* Navegação de meses */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setCurrentIndex((i) => i + 1)}
          disabled={!canPrev}
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Anterior
        </button>

        <p className="text-sm font-semibold text-gray-200 capitalize">
          {current ? formatMes(current.competencia) : "Sem dados"}
        </p>

        <button
          onClick={() => setCurrentIndex((i) => i - 1)}
          disabled={!canNext}
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Próximo
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Contracheque */}
      {current ? (
        <div className="mx-4 rounded-2xl bg-gray-800 overflow-hidden">
          {/* Título + ações */}
          <div className="flex items-center justify-between bg-gray-700/50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
              Espelho do Contracheque
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setEditingPayslip(current); setDrawerOpen(true); }}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-600 hover:text-gray-200 transition-colors"
                title="Editar"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Linhas do holerite */}
          <div className="divide-y divide-gray-700/50 px-4">
            <PayslipRow
              label="Salário bruto"
              value={current.salarioBruto}
              type="credit"
            />
            <PayslipRow
              label="(-) Bloqueio judicial"
              value={current.bloqueioJudicial}
              type="debit"
              sublabel="Proc. Tayson"
            />
            <PayslipRow
              label="(-) Previdência"
              value={current.previdencia}
              type="debit"
            />
            <PayslipRow
              label="(-) Plano de saúde"
              value={current.planoSaude}
              type="debit"
            />
          </div>

          {/* Líquido — destaque */}
          <div className="flex items-center justify-between bg-emerald-500/10 px-4 py-4">
            <div>
              <p className="text-xs text-gray-500">Líquido</p>
              <p className="text-xs text-gray-600">após descontos</p>
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              {formatCurrency(current.liquido)}
            </p>
          </div>
        </div>
      ) : (
        <div className="mx-4 flex flex-col items-center justify-center rounded-2xl bg-gray-800 py-16 text-center">
          <p className="text-3xl">📄</p>
          <p className="mt-3 text-sm font-semibold text-gray-300">Nenhum contracheque</p>
          <p className="mt-1 text-xs text-gray-600">Use o botão + para adicionar.</p>
        </div>
      )}

      {/* Processo Tayson */}
      {deducoes.length > 0 && (
        <section className="mt-6 px-4">
          <div className="mb-3 flex items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-600">
              Processo Tayson
            </p>
            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-400">
              Bloqueio judicial
            </span>
          </div>

          <div className="overflow-hidden rounded-xl bg-gray-800">
            {/* Saldo devedor atual — destaque */}
            <div className="flex items-center justify-between bg-red-500/10 px-4 py-3">
              <p className="text-xs text-gray-400">Saldo devedor atual</p>
              <p className="text-base font-bold text-red-400">
                {formatCurrency(Math.abs(deducoes[deducoes.length - 1].saldoDevedor))}
              </p>
            </div>

            {/* Histórico */}
            <div className="divide-y divide-gray-700/50">
              {deducoes.map((d) => (
                <div key={d.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-300">{d.descricao}</p>
                    <p className="text-xs text-gray-600">{formatDateBR(d.data)}</p>
                  </div>
                  <div className="flex-none text-right">
                    {d.valor > 0 && (
                      <p className="text-sm font-medium text-amber-400">
                        -{formatCurrency(d.valor)}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Saldo: {formatCurrency(Math.abs(d.saldoDevedor))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Spacer */}
      <div className="h-28" />

      {/* FAB */}
      <button
        onClick={() => { setEditingPayslip(null); setDrawerOpen(true); }}
        className="fixed bottom-6 right-1/2 translate-x-1/2 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 shadow-lg shadow-indigo-900/50 transition-transform hover:scale-105 hover:bg-indigo-500 active:scale-95"
        title="Novo contracheque"
      >
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <PayslipDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditingPayslip(null); }}
        mariaProfileId={mariaProfileId}
        existing={editingPayslip}
      />
    </>
  );
}

function PayslipRow({
  label,
  value,
  type,
  sublabel,
}: {
  label: string;
  value: number;
  type: "credit" | "debit";
  sublabel?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm text-gray-300">{label}</p>
        {sublabel && <p className="text-xs text-gray-600">{sublabel}</p>}
      </div>
      <p className={`text-sm font-semibold ${
        type === "credit" ? "text-gray-100" : "text-red-400"
      }`}>
        {type === "debit" ? "-" : ""}{formatCurrency(value)}
      </p>
    </div>
  );
}
