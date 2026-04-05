import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SectionTitle } from "@/components/dashboard/SectionTitle";
import { TimelineCard } from "@/components/dashboard/TimelineCard";
import type { ExpenseStatus, Profile, Expense } from "@/lib/types";

function formatDateBR(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

async function createServerSupabase() {
  const cookieStore = await cookies();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cookieStore.set(name, value, options as any);
          });
        },
      },
    }
  );
}

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  const in7Days = new Date(today);
  in7Days.setDate(today.getDate() + 7);
  const in7DaysStr = in7Days.toISOString().split("T")[0];

  // Busca todos os perfis
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("*")
    .order("nome");

  const profiles: Profile[] = profilesData ?? [];
  const profileMap: Record<string, Profile> = Object.fromEntries(
    profiles.map((p: Profile) => [p.id, p])
  );

  // Busca expenses: vence hoje, próximos 7 dias e atrasadas
  const { data: allExpensesData } = await supabase
    .from("expenses")
    .select("*")
    .neq("status", "pago")
    .lte("vencimento", in7DaysStr)
    .order("vencimento", { ascending: true });

  const expenses: Expense[] = allExpensesData ?? [];

  // Classifica as expenses
  const venceHoje = expenses.filter((e) => e.vencimento === todayStr);
  const proximos7 = expenses.filter(
    (e) => e.vencimento > todayStr && e.vencimento <= in7DaysStr
  );
  const atrasadas = expenses.filter((e) => e.vencimento < todayStr);

  // Agrupa próximos 7 dias por data
  const proximos7ByDate = proximos7.reduce<Record<string, Expense[]>>(
    (acc, e) => {
      if (!acc[e.vencimento]) acc[e.vencimento] = [];
      acc[e.vencimento].push(e);
      return acc;
    },
    {}
  );

  // Busca entradas do mês atual para o cálculo do saldo
  const competenciaAtual = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const { data: periods } = await supabase
    .from("monthly_periods")
    .select("id")
    .eq("competencia", competenciaAtual);

  const periodIds: string[] = (periods ?? []).map((p: { id: string }) => p.id);
  const { data: incomeData } = await supabase
    .from("income_entries")
    .select("valor")
    .in("period_id", periodIds.length > 0 ? periodIds : ["00000000-0000-0000-0000-000000000000"]);

  const totalEntradas = (incomeData ?? []).reduce(
    (s: number, i: { valor: number }) => s + i.valor,
    0
  );
  const totalAPagar = expenses
    .filter((e) => e.vencimento >= todayStr)
    .reduce((s, e) => s + (e.valor ?? 0), 0);
  const totalAtrasado = atrasadas.reduce((s, e) => s + (e.valor ?? 0), 0);

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-gray-950">
      <DashboardHeader
        totalAPagar={totalAPagar}
        totalAtrasado={totalAtrasado}
        totalEntradas={totalEntradas}
        today={today}
      />

      {/* Vence Hoje */}
      {venceHoje.length > 0 && (
        <section className="mt-2">
          <SectionTitle
            title="Vence Hoje"
            count={venceHoje.length}
            icon="🔴"
            accentColor="text-red-400"
          />
          <div className="space-y-2 px-4 pb-2">
            {venceHoje.map((expense) => (
              <TimelineCard
                key={expense.id}
                expense={{ ...expense, status: expense.status as ExpenseStatus }}
                profile={profileMap[expense.profile_id]}
              />
            ))}
          </div>
        </section>
      )}

      {/* Próximos 7 dias */}
      {proximos7.length > 0 && (
        <section className="mt-2">
          <SectionTitle
            title="Próximos 7 dias"
            count={proximos7.length}
            icon="📅"
            accentColor="text-sky-400"
          />
          <div className="space-y-4 px-4 pb-2">
            {Object.entries(proximos7ByDate).map(([dateStr, items]) => {
              const date = new Date(dateStr + "T12:00:00");
              return (
                <div key={dateStr}>
                  <p className="mb-1.5 text-xs font-medium text-gray-500">
                    {formatDateBR(date)}
                  </p>
                  <div className="space-y-2">
                    {items.map((expense) => (
                      <TimelineCard
                        key={expense.id}
                        expense={{ ...expense, status: expense.status as ExpenseStatus }}
                        profile={profileMap[expense.profile_id]}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Atrasadas */}
      {atrasadas.length > 0 && (
        <section className="mt-2">
          <SectionTitle
            title="Atrasadas"
            count={atrasadas.length}
            icon="⚠️"
            accentColor="text-amber-400"
          />
          <div className="space-y-2 px-4 pb-4">
            {atrasadas.map((expense) => (
              <TimelineCard
                key={expense.id}
                expense={{ ...expense, status: expense.status as ExpenseStatus }}
                profile={profileMap[expense.profile_id]}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {expenses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-4xl">🎉</p>
          <p className="mt-3 text-lg font-semibold text-gray-300">
            Tudo em dia!
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Nenhuma conta pendente nos próximos 7 dias.
          </p>
        </div>
      )}
    </main>
  );
}
