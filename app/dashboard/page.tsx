import { createServerClient } from "@/lib/supabase";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import type { Profile, Expense } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createServerClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  const in7Days = new Date(today);
  in7Days.setDate(today.getDate() + 7);
  const in7DaysStr = in7Days.toISOString().split("T")[0];

  const { data: profilesData } = await supabase
    .from("profiles")
    .select("*")
    .order("nome");

  const profiles: Profile[] = profilesData ?? [];
  const profileMap: Record<string, Profile> = Object.fromEntries(
    profiles.map((p: Profile) => [p.id, p])
  );

  const { data: allExpensesData } = await supabase
    .from("expenses")
    .select("*")
    .neq("status", "pago")
    .lte("vencimento", in7DaysStr)
    .order("vencimento", { ascending: true });

  const expenses: Expense[] = allExpensesData ?? [];

  const venceHoje = expenses.filter((e) => e.vencimento === todayStr);
  const proximos7 = expenses.filter(
    (e) => e.vencimento > todayStr && e.vencimento <= in7DaysStr
  );
  const atrasadas = expenses.filter((e) => e.vencimento < todayStr);

  const proximos7ByDate = proximos7.reduce<Record<string, Expense[]>>((acc, e) => {
    if (!acc[e.vencimento]) acc[e.vencimento] = [];
    acc[e.vencimento].push(e);
    return acc;
  }, {});

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
    (s: number, i: { valor: number }) => s + i.valor, 0
  );
  const totalAPagar = expenses
    .filter((e) => e.vencimento >= todayStr)
    .reduce((s, e) => s + (e.valor ?? 0), 0);
  const totalAtrasado = atrasadas.reduce((s, e) => s + (e.valor ?? 0), 0);

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-gray-950 pb-24">
      <DashboardHeader
        totalAPagar={totalAPagar}
        totalAtrasado={totalAtrasado}
        totalEntradas={totalEntradas}
        today={today}
      />
      <DashboardClient
        profiles={profiles}
        profileMap={profileMap}
        venceHoje={venceHoje}
        proximos7ByDate={proximos7ByDate}
        atrasadas={atrasadas}
        isEmpty={expenses.length === 0}
      />
    </main>
  );
}
