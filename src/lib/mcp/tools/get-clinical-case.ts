import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_clinical_case",
  title: "Detalhar caso clínico",
  description:
    "Retorna os detalhes de um caso clínico: descrição, condição primária e valores iniciais dos parâmetros fisiológicos.",
  inputSchema: {
    case_id: z.number().int().describe("ID numérico do caso clínico."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ case_id }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);

    const { data: caso, error } = await supabase
      .from("casos_clinicos")
      .select("id, nome, especie, descricao, id_condicao_primaria, criado_em")
      .eq("id", case_id)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!caso) {
      return { content: [{ type: "text", text: "Caso não encontrado ou sem acesso." }], isError: true };
    }

    const [{ data: condicao }, { data: valores }] = await Promise.all([
      caso.id_condicao_primaria
        ? supabase
            .from("condicoes")
            .select("id, nome, descricao")
            .eq("id", caso.id_condicao_primaria)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("valores_iniciais_caso")
        .select("valor, parametros(nome, unidade, valor_minimo, valor_maximo)")
        .eq("id_caso", case_id),
    ]);

    const result = { case: caso, condition: condicao ?? null, initial_values: valores ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result,
    };
  },
});
