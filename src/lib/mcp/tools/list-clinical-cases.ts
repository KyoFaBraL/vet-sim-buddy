import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_clinical_cases",
  title: "Listar casos clínicos",
  description:
    "Lista os casos clínicos de desequilíbrio ácido-base disponíveis para o usuário conectado (públicos, próprios e compartilhados).",
  inputSchema: {
    search: z.string().trim().optional().describe("Filtro opcional por nome do caso."),
    limit: z.number().int().optional().describe("Número máximo de casos retornados (padrão 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("casos_clinicos")
      .select("id, nome, especie, descricao, id_condicao_primaria, criado_em")
      .order("id", { ascending: true })
      .limit(Math.min(Math.max(limit ?? 25, 1), 100));
    if (search) query = query.ilike("nome", `%${search}%`);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { cases: data ?? [] },
    };
  },
});
