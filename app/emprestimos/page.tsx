import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { LoansClient } from "@/components/loans/LoansClient";
import type { Loan, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EmprestimosPage() {
  const supabase = createServerClient();

  const [{ data: loansData }, { data: profilesData }] = await Promise.all([
    supabase
      .from("loans")
      .select("*")
      .order("status", { ascending: true }) // a_pagar antes de pago
      .order("vencimento_atual", { ascending: true }),
    supabase.from("profiles").select("*").order("nome"),
  ]);

  const loans: Loan[] = loansData ?? [];
  const profiles: Profile[] = profilesData ?? [];
  const profileMap: Record<string, Profile> = Object.fromEntries(
    profiles.map((p) => [p.id, p])
  );

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-gray-950 pb-24">
      {/* Header */}
      <div className="bg-gray-900 px-4 pb-4 pt-5">
        <div className="flex items-center gap-2 mb-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
        </div>

        <h1 className="text-xl font-bold text-gray-100">Empréstimos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Controle de parcelas e vencimentos
        </p>
      </div>

      <LoansClient loans={loans} profiles={profiles} profileMap={profileMap} />
    </main>
  );
}
