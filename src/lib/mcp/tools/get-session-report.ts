import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_session_report",
  title: "Relatório da simulação",
  description:
    "Retorna o relatório de uma sessão de simulação do usuário: dados da sessão, tratamentos aplicados e decisões registradas.",
  inputSchema: {
    session_id: z.string().uuid().describe("ID (UUID) da sessão de simulação."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ session_id }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);

    const { data: session, error } = await supabase
      .from("simulation_sessions")
      .select("id, nome, status, duracao_segundos, data_inicio, data_fim, case_id, notas, casos_clinicos(nome, especie)")
      .eq("id", session_id)
      .eq("user_id", ctx.getUserId())
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!session) {
      return { content: [{ type: "text", text: "Sessão não encontrada." }], isError: true };
    }

    const [{ data: treatments }, { data: decisions }] = await Promise.all([
      supabase
        .from("session_treatments")
        .select("timestamp_simulacao, tratamento_id, tratamentos(nome, tipo)")
        .eq("session_id", session_id)
        .order("timestamp_simulacao", { ascending: true }),
      supabase
        .from("session_decisions")
        .select("*")
        .eq("session_id", session_id)
        .order("criado_em", { ascending: true })
        .limit(200),
    ]);

    const result = {
      session,
      treatments: treatments ?? [],
      decisions: decisions ?? [],
    };
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result,
    };
  },
});
