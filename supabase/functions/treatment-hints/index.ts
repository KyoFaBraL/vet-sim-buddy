import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentState, parameters, condition, caseDescription, availableTreatments, caseId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Construir contexto para a IA
    const parametersContext = parameters.map((p: any) => {
      const value = currentState[p.id] || 0;
      const min = p.valor_minimo || 0;
      const max = p.valor_maximo || 100;
      const isAbnormal = value < min || value > max;
      
      return `${p.nome}: ${value.toFixed(2)} ${p.unidade || ''} (Normal: ${min}-${max}) ${isAbnormal ? '⚠️ ANORMAL' : '✓'}`;
    }).join('\n');

    // Se temos caseId, buscar tratamentos adequados específicos do caso
    let appropriateTreatments: Array<{nome: string, descricao: string, prioridade: number, justificativa: string}> = [];
    if (caseId) {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.74.0');
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: caseTreatments } = await supabase
        .from('tratamentos_caso')
        .select('tratamento_id, prioridade, justificativa, tratamentos(nome, descricao)')
        .eq('case_id', caseId)
        .order('prioridade', { ascending: true });
      
      if (caseTreatments && caseTreatments.length > 0) {
        appropriateTreatments = caseTreatments.map((ct: any) => ({
          nome: ct.tratamentos.nome,
          descricao: ct.tratamentos.descricao,
          prioridade: ct.prioridade,
          justificativa: ct.justificativa
        }));
      }
    }

    // Construir lista de tratamentos disponíveis
    const treatmentsContext = availableTreatments.map((t: any) => 
      `- ${t.nome}: ${t.descricao || ''}`
    ).join('\n');
    
    // Se temos tratamentos adequados, adicionar contexto adicional
    const appropriateTreatmentsContext = appropriateTreatments.length > 0 
      ? `\n\nTRATAMENTOS ADEQUADOS PARA ESTE CASO (priorize estes):\n${appropriateTreatments.map((t: any) => 
          `- ${t.nome} (Prioridade ${t.prioridade}): ${t.justificativa || t.descricao}`
        ).join('\n')}`
      : '';

    const systemPrompt = `Você é um especialista em medicina veterinária, focado em distúrbios ácido-base e tratamento de emergências.
Sua função é analisar o estado atual do paciente e fornecer dicas progressivas de tratamento.

IMPORTANTE:
- Sugira APENAS tratamentos da lista de tratamentos disponíveis
- Seja específico e educativo
- Explique o PORQUÊ de cada sugestão
- Priorize os parâmetros mais críticos
- Forneça 2-3 dicas progressivas (começando pela mais urgente)
- Use terminologia veterinária apropriada
- Mantenha as dicas concisas mas informativas`;

    const userPrompt = `CASO CLÍNICO: ${caseDescription}
CONDIÇÃO: ${condition}

PARÂMETROS ATUAIS:
${parametersContext}

TRATAMENTOS DISPONÍVEIS:
${treatmentsContext}${appropriateTreatmentsContext}

Com base neste estado, forneça 2-3 dicas progressivas de tratamento. Para cada dica:
1. Identifique o problema principal
2. Sugira o tratamento específico
3. Explique o mecanismo de ação
4. Indique o parâmetro alvo que deve melhorar

Formato da resposta (JSON):
{
  "hints": [
    {
      "priority": "alta|média|baixa",
      "problem": "descrição do problema identificado",
      "treatment": "tratamento sugerido",
      "mechanism": "como funciona",
      "targetParameter": "parâmetro que deve melhorar",
      "expectedChange": "mudança esperada"
    }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_treatment_hints",
              description: "Fornecer dicas progressivas de tratamento veterinário",
              parameters: {
                type: "object",
                properties: {
                  hints: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        priority: { type: "string", enum: ["alta", "média", "baixa"] },
                        problem: { type: "string" },
                        treatment: { type: "string" },
                        mechanism: { type: "string" },
                        targetParameter: { type: "string" },
                        expectedChange: { type: "string" }
                      },
                      required: ["priority", "problem", "treatment", "mechanism", "targetParameter", "expectedChange"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["hints"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "provide_treatment_hints" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Por favor, tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace Lovable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar dicas de tratamento" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "Resposta inválida da IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hints = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(hints),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in treatment-hints function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
