import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_treatments",
  title: "Listar tratamentos",
  description:
    "Lista os tratamentos disponíveis no simulador VetBalance, com tipo e descrição.",
  inputSchema: {
    tipo: z.string().trim().optional().describe("Filtrar por tipo de tratamento."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ tipo }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);

    let query = supabase.from("tratamentos").select("id, nome, tipo, descricao").order("nome");
    if (tipo) query = query.eq("tipo", tipo);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { treatments: data ?? [] },
    };
  },
});
