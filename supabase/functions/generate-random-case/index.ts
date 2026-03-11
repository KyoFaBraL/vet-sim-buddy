import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'professor') {
      return new Response(JSON.stringify({ error: 'Forbidden: Professor role required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get available conditions, parameters, and treatments
    const [conditionsRes, parametrosRes, tratamentosRes] = await Promise.all([
      supabase.from('condicoes').select('id, nome, descricao'),
      supabase.from('parametros').select('*'),
      supabase.from('tratamentos').select('*'),
    ]);

    const conditions = conditionsRes.data || [];
    const parametros = parametrosRes.data || [];
    const tratamentos = tratamentosRes.data || [];

    // Get existing case names to avoid duplicates
    const { data: existingCases } = await supabase
      .from('casos_clinicos')
      .select('nome');

    const existingNames = (existingCases || []).map(c => c.nome);

    const prompt = `Você é um especialista em medicina veterinária de emergência para CÃES e GATOS.

Gere um caso clínico ALEATÓRIO e REALISTA de desequilíbrio ácido-básico para simulação educacional.

REQUISITOS OBRIGATÓRIOS:
1. O caso DEVE envolver desequilíbrio ácido-básico (acidose ou alcalose, metabólica ou respiratória)
2. A espécie deve ser "canino" ou "felino" (escolha aleatoriamente)
3. O pH inicial DEVE estar fora da faixa normal (7.35-7.45) para criar desafio clínico
4. Todos os parâmetros devem ser clinicamente coerentes com a condição escolhida
5. O nome do caso NÃO pode ser igual a nenhum destes já existentes: ${existingNames.join(', ')}

Condições disponíveis no sistema (escolha UMA): ${conditions.map(c => `${c.id}:${c.nome}`).join(', ')}
Parâmetros disponíveis: ${parametros.map(p => `${p.nome} (${p.unidade})`).join(', ')}
Tratamentos disponíveis: ${tratamentos.map(t => `${t.id}:${t.nome}`).join(', ')}

Retorne APENAS JSON válido:
{
  "nome": "Nome descritivo do caso",
  "descricao": "Descrição detalhada do cenário clínico com histórico, sintomas e contexto",
  "especie": "canino" ou "felino",
  "id_condicao_primaria": <id numérico da condição>,
  "parametrosPrimarios": [
    {"nome": "pH", "valor": <valor fora de 7.35-7.45>},
    {"nome": "PaO2", "valor": <valor>},
    {"nome": "PaCO2", "valor": <valor>},
    {"nome": "FrequenciaCardiaca", "valor": <valor>},
    {"nome": "PressaoArterial", "valor": <valor>},
    {"nome": "Lactato", "valor": <valor>}
  ],
  "parametrosSecundarios": [
    {"nome": "NomeParametro", "valor": <valor>}
  ],
  "tratamentosAdequados": [
    {"tratamento_id": <id>, "prioridade": <1-5>, "justificativa": "razão clínica"}
  ]
}`;

    console.log('Gerando caso clínico aleatório com IA...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'Você é um especialista em medicina veterinária de emergência. Gere casos clínicos realistas e desafiadores focados em desequilíbrio ácido-básico. Retorne APENAS JSON válido.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Erro na IA:', aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos de IA insuficientes.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ error: 'Erro ao gerar caso com IA' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    console.log('Resposta da IA:', aiContent);

    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'Resposta da IA inválida' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const generated = JSON.parse(jsonMatch[0]);

    // Create the case in the database
    const { data: newCase, error: insertError } = await supabase
      .from('casos_clinicos')
      .insert({
        nome: generated.nome,
        descricao: generated.descricao,
        especie: generated.especie?.toLowerCase(),
        id_condicao_primaria: generated.id_condicao_primaria,
        user_id: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao inserir caso:', insertError);
      return new Response(JSON.stringify({ error: 'Erro ao salvar caso no banco' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const caseId = newCase.id;

    // Insert primary parameters
    const valoresIniciais = [];
    if (generated.parametrosPrimarios) {
      for (const p of generated.parametrosPrimarios) {
        const param = parametros.find(pr => pr.nome === p.nome);
        if (param) valoresIniciais.push({ id_caso: caseId, id_parametro: param.id, valor: p.valor });
      }
      if (valoresIniciais.length > 0) {
        await supabase.from('valores_iniciais_caso').insert(valoresIniciais);
      }
    }

    // Insert secondary parameters
    const paramsSec = [];
    if (generated.parametrosSecundarios) {
      for (const p of generated.parametrosSecundarios) {
        const param = parametros.find(pr => pr.nome === p.nome);
        if (param) paramsSec.push({ case_id: caseId, parametro_id: param.id, valor: p.valor });
      }
      if (paramsSec.length > 0) {
        await supabase.from('parametros_secundarios_caso').insert(paramsSec);
      }
    }

    // Insert treatments
    const tratsCaso = [];
    if (generated.tratamentosAdequados) {
      for (const t of generated.tratamentosAdequados) {
        const trat = tratamentos.find(tr => tr.id === t.tratamento_id) ||
                     tratamentos.find(tr => tr.nome === t.nome);
        if (trat) {
          tratsCaso.push({
            case_id: caseId,
            tratamento_id: trat.id,
            prioridade: t.prioridade,
            justificativa: t.justificativa,
          });
        }
      }
      if (tratsCaso.length > 0) {
        await supabase.from('tratamentos_caso').insert(tratsCaso);
      }
    }

    console.log('Caso aleatório criado com sucesso:', caseId);

    return new Response(JSON.stringify({
      success: true,
      caseId,
      nome: generated.nome,
      especie: generated.especie,
      parametrosPrimarios: valoresIniciais.length,
      parametrosSecundarios: paramsSec.length,
      tratamentos: tratsCaso.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Erro:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
