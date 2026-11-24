import {
  createBrowserClient,
  createServerClient as createSSRServerClient,
  type CookieOptions,
} from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client para Client Components — sessão guardada em cookies
// (createBrowserClient já é singleton no navegador).
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Client para Server Components / Route Handlers — lê a sessão dos cookies
// da requisição, então as queries rodam como o usuário logado (RLS).
export async function createServerClient() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  return createSSRServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Chamado de um Server Component: não dá para setar cookies aqui.
          // O proxy.ts cuida de renovar a sessão.
        }
      },
    },
  });
}
