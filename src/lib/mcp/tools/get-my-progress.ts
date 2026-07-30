import { defineTool } from "@lovable.dev/mcp-js";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_progress",
  title: "Meu desempenho",
  description:
    "Resumo do desempenho do usuário conectado: total de simulações, vitórias, derrotas, taxa de sucesso e conquistas (badges).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    const [{ data: sessions, error }, { data: badges }] = await Promise.all([
      supabase
        .from("simulation_sessions")
        .select("status, duracao_segundos")
        .eq("user_id", userId),
      supabase
        .from("user_badges")
        .select("conquistado_em, badges(nome, tipo, descricao, icone)")
        .eq("user_id", userId)
        .order("conquistado_em", { ascending: false }),
    ]);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const all = sessions ?? [];
    const wins = all.filter((s) => s.status === "won").length;
    const losses = all.filter((s) => s.status === "lost").length;
    const finished = wins + losses;
    const durations = all
      .map((s) => s.duracao_segundos)
      .filter((d): d is number => typeof d === "number");

    const result = {
      total_sessions: all.length,
      wins,
      losses,
      win_rate: finished > 0 ? Math.round((wins / finished) * 100) : 0,
      average_duration_seconds:
        durations.length > 0
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
          : null,
      badges: badges ?? [],
    };

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result,
    };
  },
});
