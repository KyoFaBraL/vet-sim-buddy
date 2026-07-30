import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_sessions",
  title: "Listar minhas simulações",
  description:
    "Lista as sessões de simulação do usuário conectado, com status (won/lost/playing), duração e caso associado.",
  inputSchema: {
    status: z.string().trim().optional().describe("Filtrar por status: won, lost ou playing."),
    limit: z.number().int().optional().describe("Número máximo de sessões (padrão 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);

    let query = supabase
      .from("simulation_sessions")
      .select("id, nome, status, duracao_segundos, data_inicio, data_fim, case_id, casos_clinicos(nome, especie)")
      .eq("user_id", ctx.getUserId())
      .order("data_inicio", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 20, 1), 100));
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { sessions: data ?? [] },
    };
  },
});
