"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { LoanDrawer } from "./LoanDrawer";
import type { Loan, Profile } from "@/lib/types";

interface LoansClientProps {
  loans: Loan[];
  profiles: Profile[];
  profileMap: Record<string, Profile>;
}

function formatCurrency(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDateBR(dateStr: string | null) {
  if (!dateStr) return "—";
  const date = new Date(dateStr + "T12:00:00");
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function calcMonthsRemaining(vencAtual: string | null, ultimoVenc: string | null): number | null {
  if (!vencAtual || !ultimoVenc) return null;
  const start = new Date(vencAtual + "T12:00:00");
  const end = new Date(ultimoVenc + "T12:00:00");
  const diff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return Math.max(0, diff + 1);
}

function advanceOneMonth(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month, day); // month is already 0-indexed since we add 1
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function LoansClient({ loans, profiles, profileMap }: LoansClientProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Loan | null>(null);

  const ativos = loans.filter((l) => l.status === "a_pagar");
  const quitados = loans.filter((l) => l.status === "pago");

  const totalParcelas = ativos.reduce((s, l) => s + (l.parcela_mensal ?? 0), 0);

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }

  return (
    <>
      {/* Resumo */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-amber-500/10 p-3">
          <p className="text-xs text-gray-500">Total em parcelas</p>
          <p className="mt-1 text-sm font-bold text-amber-400">{formatCurrency(totalParcelas)}</p>
        </div>
        <div className="rounded-xl bg-gray-800 p-3">
          <p className="text-xs text-gray-500">Em aberto</p>
          <p className="mt-1 text-sm font-bold text-gray-200">{ativos.length} empréstimo{ativos.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Em aberto */}
      {ativos.length > 0 && (
        <section className="mt-4 px-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-gray-600">Em aberto</p>
          <div className="space-y-3">
            {ativos.map((loan) => (
              <LoanCard
                key={loan.id}
                loan={loan}
                profile={profileMap[loan.profile_id]}
                onEdit={() => { setEditing(loan); setDrawerOpen(true); }}
                onRefresh={() => router.refresh()}
              />
            ))}
          </div>
        </section>
      )}

      {/* Quitados */}
      {quitados.length > 0 && (
        <section className="mt-4 px-4 pb-28">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-gray-600">Quitados</p>
          <div className="space-y-3">
            {quitados.map((loan) => (
              <LoanCard
                key={loan.id}
                loan={loan}
                profile={profileMap[loan.profile_id]}
                onEdit={() => { setEditing(loan); setDrawerOpen(true); }}
                onRefresh={() => router.refresh()}
              />
            ))}
          </div>
        </section>
      )}

      {loans.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-4xl">🤝</p>
          <p className="mt-3 text-lg font-semibold text-gray-300">Nenhum empréstimo</p>
          <p className="mt-1 text-sm text-gray-600">Use o botão + para adicionar.</p>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={openCreate}
        className="fixed bottom-6 right-1/2 translate-x-1/2 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 shadow-lg shadow-indigo-900/50 transition-transform hover:scale-105 hover:bg-indigo-500 active:scale-95"
        title="Novo empréstimo"
      >
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <LoanDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null); }}
        profiles={profiles}
        loan={editing}
      />
    </>
  );
}

// ─── LoanCard ────────────────────────────────────────────────────────────────

function LoanCard({
  loan,
  profile,
  onEdit,
  onRefresh,
}: {
  loan: Loan;
  profile: Profile;
  onEdit: () => void;
  onRefresh: () => void;
}) {
  const [paying, setPaying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const monthsLeft = calcMonthsRemaining(loan.vencimento_atual, loan.ultimo_vencimento);
  const isPago = loan.status === "pago";

  async function pagarParcela() {
    if (!loan.vencimento_atual || paying) return;
    setPaying(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = createClient() as any;
    const novoVencimento = advanceOneMonth(loan.vencimento_atual);
    const quitado = loan.ultimo_vencimento && novoVencimento > loan.ultimo_vencimento;

    await sb.from("loans").update({
      vencimento_atual: novoVencimento,
      ...(quitado ? { status: "pago" } : {}),
    }).eq("id", loan.id);

    onRefresh();
    setPaying(false);
  }

  async function handleDelete() {
    setDeleting(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = createClient() as any;
    await sb.from("loans").delete().eq("id", loan.id);
    onRefresh();
  }

  return (
    <div className={`group rounded-xl p-4 transition-colors ${
      isPago ? "bg-gray-800/40 opacity-60" : "bg-gray-800 hover:bg-gray-700/80"
    }`}>
      {/* Linha superior: nome + ações */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-3 w-3 flex-none rounded-full" style={{ backgroundColor: profile.cor }} />
          <p className={`truncate text-sm font-semibold ${isPago ? "text-gray-500 line-through" : "text-gray-100"}`}>
            {loan.descricao}
          </p>
          <span className="text-xs text-gray-500">{profile.nome}</span>
        </div>

        {/* Ações hover */}
        <div className="flex flex-none items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
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
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                {deleting ? "…" : "Sim"}
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
      </div>

      {/* Linha do meio: parcela + datas */}
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs text-gray-500">Parcela mensal</p>
          <p className="text-lg font-bold text-gray-100">{formatCurrency(loan.parcela_mensal)}</p>
        </div>

        <div className="flex gap-4 text-right">
          <div>
            <p className="text-xs text-gray-500">Próx. venc.</p>
            <p className="text-xs font-medium text-gray-300">{formatDateBR(loan.vencimento_atual)}</p>
          </div>
          {loan.ultimo_vencimento && (
            <div>
              <p className="text-xs text-gray-500">Último</p>
              <p className="text-xs font-medium text-gray-300">{formatDateBR(loan.ultimo_vencimento)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Linha inferior: valor total + parcelas restantes + botão */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {loan.valor_emprestado && (
            <span className="text-xs text-gray-500">
              Total: <span className="text-gray-400">{formatCurrency(loan.valor_emprestado)}</span>
            </span>
          )}
          {monthsLeft !== null && !isPago && (
            <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs text-indigo-400">
              {monthsLeft} parc. restante{monthsLeft !== 1 ? "s" : ""}
            </span>
          )}
          {isPago && (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400">
              ✓ Quitado
            </span>
          )}
        </div>

        {!isPago && (
          <button
            onClick={pagarParcela}
            disabled={paying || !loan.vencimento_atual}
            className="flex-none rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 active:bg-emerald-700"
          >
            {paying ? "…" : "Pagar parcela"}
          </button>
        )}
      </div>

      {/* Barra de progresso (se tiver datas) */}
      {!isPago && loan.vencimento_atual && loan.ultimo_vencimento && monthsLeft !== null && (
        <ProgressBar vencAtual={loan.vencimento_atual} ultimoVenc={loan.ultimo_vencimento} />
      )}
    </div>
  );
}

function ProgressBar({ vencAtual, ultimoVenc }: { vencAtual: string; ultimoVenc: string }) {
  // Calcula progresso com base nos meses
  const start = new Date(vencAtual + "T12:00:00");
  const end = new Date(ultimoVenc + "T12:00:00");
  const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;

  // Assumimos que "meses percorridos" = total - restantes
  // Como não temos data de início, usamos a proporção sobre o total
  if (totalMonths <= 0) return null;

  const monthsLeft = calcMonthsRemaining(vencAtual, ultimoVenc) ?? 0;
  const progress = Math.max(0, Math.min(100, ((totalMonths - monthsLeft) / totalMonths) * 100));

  return (
    <div className="mt-3">
      <div className="h-1 w-full overflow-hidden rounded-full bg-gray-700">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
