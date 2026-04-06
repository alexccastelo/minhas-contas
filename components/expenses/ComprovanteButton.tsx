"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface ComprovanteButtonProps {
  expenseId: string;
  comprovanteUrl: string | null;
}

export function ComprovanteButton({ expenseId, comprovanteUrl }: ComprovanteButtonProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Valida tamanho (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Arquivo muito grande (máx. 5 MB)");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = createClient() as any;

      // Caminho: comprovantes/{expenseId}/{timestamp}.{ext}
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${expenseId}/${Date.now()}.${ext}`;

      const { error: uploadErr } = await sb.storage
        .from("comprovantes")
        .upload(path, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      // Obtém URL pública
      const { data: urlData } = sb.storage
        .from("comprovantes")
        .getPublicUrl(path);

      const publicUrl: string = urlData.publicUrl;

      // Salva na expense
      const { error: updateErr } = await sb
        .from("expenses")
        .update({ comprovante_url: publicUrl })
        .eq("id", expenseId);

      if (updateErr) throw updateErr;

      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro no upload");
    } finally {
      setUploading(false);
      // Limpa o input para permitir re-upload do mesmo arquivo
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = createClient() as any;
    await sb.from("expenses").update({ comprovante_url: null }).eq("id", expenseId);
    router.refresh();
  }

  // ── Com comprovante ──────────────────────────────────────
  if (comprovanteUrl) {
    return (
      <div className="flex items-center gap-1">
        <a
          href={comprovanteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors"
          title="Ver comprovante"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <span>Comprov.</span>
        </a>
        <button
          onClick={handleRemove}
          className="rounded-lg p-1 text-gray-600 hover:text-red-400 transition-colors"
          title="Remover comprovante"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  // ── Sem comprovante ──────────────────────────────────────
  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleFile}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-700 hover:text-gray-300 transition-colors disabled:opacity-50"
        title="Anexar comprovante"
      >
        {uploading ? (
          <>
            <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Enviando…</span>
          </>
        ) : (
          <>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span>Comprov.</span>
          </>
        )}
      </button>
      {error && (
        <p className="mt-1 text-[10px] text-red-400">{error}</p>
      )}
    </div>
  );
}
