import { createClient } from "@supabase/supabase-js";
import { type ToolContext } from "@lovable.dev/mcp-js";

type RuntimeGlobals = typeof globalThis & {
  Deno?: { env?: { get?: (name: string) => string | undefined } };
  process?: { env?: Record<string, string | undefined> };
};

function runtimeEnv(name: string): string | undefined {
  const runtime = globalThis as RuntimeGlobals;
  return runtime.Deno?.env?.get?.(name) ?? runtime.process?.env?.[name];
}

function configuredEnv(names: readonly string[]): string | undefined {
  for (const name of names) {
    const value = runtimeEnv(name)?.trim();
    if (value) return value;
  }
  return undefined;
}

function supabaseProjectUrl(): string {
  const url = configuredEnv(["SUPABASE_URL", "VITE_SUPABASE_URL"]);
  if (!url) throw new Error("SUPABASE_URL (or VITE_SUPABASE_URL) is required");
  return url;
}

function supabasePublishableKey(): string {
  const key = configuredEnv([
    "SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_ANON_KEY",
    "VITE_SUPABASE_ANON_KEY",
  ]);
  if (!key) {
    throw new Error("SUPABASE_PUBLISHABLE_KEY (or SUPABASE_ANON_KEY) is required");
  }
  return key;
}

// Forwards the verified bearer token so RLS runs as the signed-in user.
export function supabaseForUser(ctx: ToolContext) {
  return createClient(supabaseProjectUrl(), supabasePublishableKey(), {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function notAuthenticated() {
  return {
    content: [
      { type: "text" as const, text: "Não autenticado. Conecte-se com sua conta VetBalance." },
    ],
    isError: true,
  };
}
