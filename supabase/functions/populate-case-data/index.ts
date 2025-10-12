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
    const { caseId } = await req.json();
    
    if (!caseId) {
      return new Response(
        JSON.stringify({ error: 'Case ID é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar dados do caso
    const { data: caseData, error: caseError } = await supabase
      .from('casos_clinicos')
      .select('*, condicoes(*)')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      console.error('Erro ao buscar caso:', caseError);
      return new Response(
        JSON.stringify({ error: 'Caso não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar parâmetros disponíveis
    const { data: parametros } = await supabase
      .from('parametros')
      .select('*');

    // Buscar tratamentos disponíveis
    const { data: tratamentos } = await supabase
      .from('tratamentos')
      .select('*');

    // Criar prompt para IA gerar dados
    const prompt = `Você é um especialista em medicina veterinária para CÃES e GATOS. Dado o seguinte caso clínico:

Nome: ${caseData.nome}
Espécie: ${caseData.especie}
Descrição: ${caseData.descricao}
Condição: ${caseData.condicoes?.nome || 'Não especificada'}

Parâmetros disponíveis: ${parametros?.map(p => `${p.nome} (${p.unidade})`).join(', ')}
Tratamentos disponíveis: ${tratamentos?.map(t => t.nome).join(', ')}

Gere valores REALISTAS e CLINICAMENTE COMPATÍVEIS para TODOS os parâmetros vitais deste paciente ${caseData.especie}, considerando a condição "${caseData.condicoes?.nome || 'especificada'}".

IMPORTANTE: O simulador trabalha APENAS com CÃES (canino) e GATOS (felino). Os valores devem variar de acordo com a espécie:
- pH: valores entre 7.35-7.45 (normal), ajustar conforme acidose/alcalose da condição
- PaO2: valores entre 80-100 mmHg (normal para canino), 90-110 mmHg (normal para felino)
- PaCO2: valores entre 35-45 mmHg (normal para canino), 30-40 mmHg (normal para felino)
- FrequenciaCardiaca: 60-140 bpm (canino), 120-180 bpm (felino)
- PressaoArterial: 110-160 mmHg (canino), 120-170 mmHg (felino)
- Lactato: 0.5-2.5 mmol/L (canino), 0.5-2.0 mmol/L (felino)

Inclua também 3-5 PARÂMETROS SECUNDÁRIOS relevantes para cães/gatos que sejam compatíveis com esta condição.

Sugira os 3-5 tratamentos mais adequados para cães/gatos com justificativa e prioridade (1-5, sendo 1 a mais alta).

Retorne APENAS um JSON válido no seguinte formato:
{
  "parametrosPrimarios": [
    {"nome": "pH", "valor": 7.35},
    {"nome": "PaO2", "valor": 85.0},
    {"nome": "PaCO2", "valor": 40.0},
    {"nome": "FrequenciaCardiaca", "valor": 120.0},
    {"nome": "PressaoArterial", "valor": 125.0},
    {"nome": "Lactato", "valor": 1.5}
  ],
  "parametrosSecundarios": [
    {"nome": "NomeParametro", "valor": 0.00}
  ],
  "tratamentosAdequados": [
    {"nome": "NomeTratamento", "prioridade": 1, "justificativa": "Razão clínica"}
  ]
}`;

    console.log('Chamando IA para gerar dados do caso...');

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
            content: 'Você é um especialista em medicina veterinária para CÃES e GATOS. Retorne APENAS JSON válido, sem texto adicional.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Erro na resposta da IA:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar dados com IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    console.log('Resposta da IA:', aiContent);

    // Parse do JSON retornado pela IA
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Resposta da IA não contém JSON válido:', aiContent);
      return new Response(
        JSON.stringify({ error: 'Resposta da IA inválida' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const generatedData = JSON.parse(jsonMatch[0]);

    // Inserir parâmetros primários (valores iniciais do caso)
    const valoresIniciaisCaso = [];
    if (generatedData.parametrosPrimarios) {
      for (const paramData of generatedData.parametrosPrimarios) {
        const parametro = parametros?.find(p => p.nome === paramData.nome);
        if (parametro) {
          valoresIniciaisCaso.push({
            id_caso: caseId,
            id_parametro: parametro.id,
            valor: paramData.valor
          });
        }
      }

      if (valoresIniciaisCaso.length > 0) {
        // Deletar dados antigos
        await supabase
          .from('valores_iniciais_caso')
          .delete()
          .eq('id_caso', caseId);

        // Inserir novos
        const { error: insertError } = await supabase
          .from('valores_iniciais_caso')
          .insert(valoresIniciaisCaso);

        if (insertError) {
          console.error('Erro ao inserir valores iniciais:', insertError);
        }
      }
    }

    // Inserir parâmetros secundários no banco
    const parametrosSecundarios = [];
    if (generatedData.parametrosSecundarios) {
      for (const paramData of generatedData.parametrosSecundarios) {
        const parametro = parametros?.find(p => p.nome === paramData.nome);
        if (parametro) {
          parametrosSecundarios.push({
            case_id: caseId,
            parametro_id: parametro.id,
            valor: paramData.valor
          });
        }
      }

      if (parametrosSecundarios.length > 0) {
        // Deletar dados antigos
        await supabase
          .from('parametros_secundarios_caso')
          .delete()
          .eq('case_id', caseId);

        // Inserir novos
        const { error: insertError } = await supabase
          .from('parametros_secundarios_caso')
          .insert(parametrosSecundarios);

        if (insertError) {
          console.error('Erro ao inserir parâmetros secundários:', insertError);
        }
      }
    }

    // Inserir tratamentos adequados no banco
    const tratamentosCaso = [];
    if (generatedData.tratamentosAdequados) {
      for (const tratData of generatedData.tratamentosAdequados) {
        const tratamento = tratamentos?.find(t => t.nome === tratData.nome);
        if (tratamento) {
          tratamentosCaso.push({
            case_id: caseId,
            tratamento_id: tratamento.id,
            prioridade: tratData.prioridade,
            justificativa: tratData.justificativa
          });
        }
      }

      if (tratamentosCaso.length > 0) {
        // Deletar dados antigos
        await supabase
          .from('tratamentos_caso')
          .delete()
          .eq('case_id', caseId);

        // Inserir novos
        const { error: insertError } = await supabase
          .from('tratamentos_caso')
          .insert(tratamentosCaso);

        if (insertError) {
          console.error('Erro ao inserir tratamentos do caso:', insertError);
        }
      }
    }

    console.log('Dados gerados e salvos com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        parametrosPrimarios: valoresIniciaisCaso.length,
        parametrosSecundarios: parametrosSecundarios.length,
        tratamentosAdequados: tratamentosCaso.length,
        data: generatedData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao processar:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});