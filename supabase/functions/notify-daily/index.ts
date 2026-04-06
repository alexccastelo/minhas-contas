import { createClient } from "jsr:@supabase/supabase-js@2";

const TELEGRAM_API = "https://api.telegram.org";

function formatCurrency(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDateBR(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

async function sendTelegram(token: string, chatId: string, text: string) {
  const url = `${TELEGRAM_API}/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Telegram API error: ${err}`);
  }
  return res.json();
}

Deno.serve(async (_req) => {
  try {
    const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!token || !chatId || !supabaseUrl || !supabaseKey) {
      throw new Error("Variáveis de ambiente ausentes");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Data de hoje em Brasília (UTC-3)
    const now = new Date();
    const brasiliaOffset = -3 * 60; // minutos
    const utcMinutes = now.getTime() / 60000 + now.getTimezoneOffset();
    const brasiliaDate = new Date((utcMinutes + brasiliaOffset) * 60000);
    const todayStr = brasiliaDate.toISOString().split("T")[0]; // "YYYY-MM-DD"

    // Busca perfis
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nome, cor");

    const profileMap: Record<string, string> = {};
    for (const p of profiles ?? []) {
      profileMap[p.id] = p.nome;
    }

    // Busca despesas que vencem hoje (não pagas)
    const { data: venceHoje } = await supabase
      .from("expenses")
      .select("descricao, valor, profile_id, tipo")
      .eq("vencimento", todayStr)
      .neq("status", "pago")
      .order("valor", { ascending: false });

    // Busca despesas atrasadas (não pagas)
    const { data: atrasadas } = await supabase
      .from("expenses")
      .select("descricao, valor, profile_id, vencimento")
      .lt("vencimento", todayStr)
      .neq("status", "pago")
      .order("vencimento", { ascending: true });

    const hoje = venceHoje ?? [];
    const atrasadasList = atrasadas ?? [];

    // Monta a mensagem
    const lines: string[] = [];

    lines.push(`🔔 <b>Minhas Contas</b>`);
    lines.push(`📅 ${formatDateBR(brasiliaDate).replace(/^\w/, (c) => c.toUpperCase())}`);
    lines.push("");

    if (hoje.length === 0 && atrasadasList.length === 0) {
      lines.push("✅ Nenhuma conta para hoje. Dia livre!");
    } else {
      // Vence hoje
      if (hoje.length > 0) {
        const totalHoje = hoje.reduce((s, e) => s + (e.valor ?? 0), 0);
        lines.push(`<b>Vence hoje (${hoje.length}):</b>`);
        for (const e of hoje) {
          const perfil = profileMap[e.profile_id] ?? "—";
          const tipo = e.tipo === "assinatura" ? " 🔄" : "";
          lines.push(`  • ${e.descricao}${tipo} <i>(${perfil})</i> — ${formatCurrency(e.valor)}`);
        }
        lines.push(`  💰 <b>Total: ${formatCurrency(totalHoje)}</b>`);
        lines.push("");
      } else {
        lines.push("✅ <b>Nenhuma conta vence hoje.</b>");
        lines.push("");
      }

      // Atrasadas
      if (atrasadasList.length > 0) {
        const totalAtrasado = atrasadasList.reduce((s, e) => s + (e.valor ?? 0), 0);
        lines.push(`<b>⚠️ Atrasadas (${atrasadasList.length}):</b>`);
        for (const e of atrasadasList) {
          const perfil = profileMap[e.profile_id] ?? "—";
          const venc = new Date(e.vencimento + "T12:00:00");
          const vencLabel = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(venc);
          lines.push(`  • ${e.descricao} <i>(${perfil})</i> — ${formatCurrency(e.valor)} <i>[${vencLabel}]</i>`);
        }
        lines.push(`  🔴 <b>Total atrasado: ${formatCurrency(totalAtrasado)}</b>`);
      }
    }

    const message = lines.join("\n");
    await sendTelegram(token, chatId, message);

    return new Response(
      JSON.stringify({ ok: true, hoje: hoje.length, atrasadas: atrasadasList.length }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
