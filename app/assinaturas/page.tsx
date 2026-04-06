import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { SubscriptionsClient } from "@/components/subscriptions/SubscriptionsClient";
import type { Subscription } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AssinaturasPage() {
  const supabase = createServerClient();

  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .order("tipo", { ascending: true })
    .order("nome", { ascending: true });

  const subscriptions: Subscription[] = data ?? [];

  const ativas = subscriptions.filter((s) => s.ativo).length;

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

        <h1 className="text-xl font-bold text-gray-100">Assinaturas</h1>
        <p className="mt-1 text-sm text-gray-500">
          {ativas} ativa{ativas !== 1 ? "s" : ""} de {subscriptions.length} total
        </p>
      </div>

      <SubscriptionsClient subscriptions={subscriptions} />
    </main>
  );
}
