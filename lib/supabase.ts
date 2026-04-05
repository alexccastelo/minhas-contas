import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Storage no-op: evita acesso ao localStorage (incompatível com Node.js 25+)
const noopStorage = {
  getItem: (_key: string): string | null => null,
  setItem: (_key: string, _value: string): void => {},
  removeItem: (_key: string): void => {},
};

const supabaseOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storage: noopStorage,
  },
};

// Client singleton para Client Components
let browserClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (!browserClient) {
    browserClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      supabaseOptions
    );
  }
  return browserClient;
}

// Client para Server Components (sem singleton)
export function createServerClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    supabaseOptions
  );
}
