import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const { caseName, species, condition, parameters } = await req.json();
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `Você é um veterinário especialista em diagnóstico diferencial para ${species === 'canino' ? 'CÃES' : 'GATOS'}.

CASO: ${caseName}
CONDIÇÃO CONHECIDA: ${condition}
PARÂMETROS ATUAIS: ${parameters}

Tarefa: Gere um desafio de diagnóstico diferencial com 4 opções. Uma das opções DEVE ser a condição conhecida (${condition}) que é a resposta CORRETA.

IMPORTANTE:
- As outras 3 opções devem ser diagnósticos PLAUSÍVEIS mas INCORRETOS
- Cada diagnóstico deve ter uma probabilidade (Alta/Média/Baixa)
- Forneça raciocínio clínico para cada um

Retorne APENAS JSON válido no formato:
{
  "correctDiagnosis": "${condition}",
  "differentialDiagnoses": [
    {
      "name": "Nome do diagnóstico",
      "probability": "Alta/Média/Baixa",
      "reasoning": "Breve explicação clínica (máx 50 palavras)"
    }
  ]
}`;

    console.log('Chamando IA para diagnóstico diferencial...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em medicina veterinária. Retorne APENAS JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na IA:', response.status, errorText);
      throw new Error('Erro ao gerar diagnóstico diferencial');
    }

    const aiData = await response.json();
    const aiContent = aiData.choices[0].message.content;
    
    console.log('Resposta da IA:', aiContent);

    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Resposta da IA inválida');
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
