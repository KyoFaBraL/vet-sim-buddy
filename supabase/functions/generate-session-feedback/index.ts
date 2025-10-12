import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      throw new Error('Session ID é obrigatório');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar dados da sessão
    const { data: session, error: sessionError } = await supabase
      .from('simulation_sessions')
      .select('*, casos_clinicos(*)')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error('Sessão não encontrada');
    }

    // Buscar decisões da sessão
    const { data: decisions } = await supabase
      .from('session_decisions')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp_simulacao');

    // Buscar tratamentos aplicados
    const { data: treatments } = await supabase
      .from('session_treatments')
      .select('*, tratamentos(*)')
      .eq('session_id', sessionId)
      .order('timestamp_simulacao');

    const treatmentsList = treatments?.map(t => 
      `${t.tratamentos.nome} (${t.timestamp_simulacao}s)`
    ).join(', ') || 'Nenhum';

    const prompt = `Você é um tutor especialista em medicina veterinária. Analise o desempenho do estudante e forneça feedback CONSTRUTIVO e EDUCACIONAL.

CASO: ${session.casos_clinicos.nome} (${session.casos_clinicos.especie})
STATUS: ${session.status === 'won' || session.status === 'vitoria' ? 'ESTABILIZADO' : 'FALECEU'}
DURAÇÃO: ${session.duracao_segundos}s
TRATAMENTOS APLICADOS: ${treatmentsList}
DECISÕES TOMADAS: ${decisions?.length || 0}

Forneça:
1. **Análise Geral** - Avaliação do desempenho (2-3 linhas)
2. **Pontos Fortes** - O que o estudante fez bem (2-3 pontos)
3. **Áreas de Melhoria** - O que pode melhorar (2-3 pontos)
4. **Sugestões de Estudo** - Tópicos específicos para aprofundar (3-4 itens)
5. **Recomendação** - Próximo passo no aprendizado

Retorne APENAS JSON válido:
{
  "analiseGeral": "texto",
  "pontoFortes": ["ponto 1", "ponto 2"],
  "areasMelhoria": ["área 1", "área 2"],
  "sugestoesEstudo": ["tópico 1", "tópico 2"],
  "recomendacao": "texto"
}`;

    console.log('Gerando feedback da sessão...');

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
            content: 'Você é um educador veterinário experiente. Seja construtivo e educacional. Retorne APENAS JSON válido.'
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
      throw new Error('Erro ao gerar feedback');
    }

    const aiData = await response.json();
    const aiContent = aiData.choices[0].message.content;
    
    console.log('Feedback gerado:', aiContent);

    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Resposta da IA inválida');
    }

    const feedback = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify({
        success: true,
        sessionData: {
          caseName: session.casos_clinicos.nome,
          status: session.status,
          duration: session.duracao_segundos
        },
        feedback
      }),
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
