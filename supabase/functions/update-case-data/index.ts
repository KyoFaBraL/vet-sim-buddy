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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: roleData } = await supabase
      .from('user_roles').select('role').eq('user_id', user.id).single();

    if (roleData?.role !== 'professor') {
      return new Response(JSON.stringify({ error: 'Forbidden: Professor role required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { caseId, action } = body;

    if (!caseId || !action) {
      return new Response(JSON.stringify({ error: 'caseId and action are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify case ownership
    const { data: caseData } = await supabase
      .from('casos_clinicos').select('user_id').eq('id', caseId).single();

    if (!caseData || caseData.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Sem permissão para editar este caso' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let result: any = { success: true };

    const jsonRes = (data: any, status = 200) =>
      new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const requireNum = (val: unknown, name: string) => {
      const n = Number(val);
      if (val === undefined || val === null || isNaN(n)) throw new Error(`${name} must be a number`);
      return n;
    };

    switch (action) {
      // ── UPDATE ──
      case 'update_primary_param': {
        const { paramId, valor } = body;
        if (!paramId) return jsonRes({ error: 'paramId is required' }, 400);
        const numVal = requireNum(valor, 'valor');
        const { error } = await supabase.from('valores_iniciais_caso').update({ valor: numVal }).eq('id', paramId).eq('id_caso', caseId);
        if (error) throw error;
        result.message = 'Parâmetro primário atualizado';
        break;
      }

      case 'update_secondary_param': {
        const { paramId, valor } = body;
        if (!paramId) return jsonRes({ error: 'paramId is required' }, 400);
        const numVal = requireNum(valor, 'valor');
        const { error } = await supabase.from('parametros_secundarios_caso').update({ valor: numVal }).eq('id', paramId).eq('case_id', caseId);
        if (error) throw error;
        result.message = 'Parâmetro secundário atualizado';
        break;
      }

      case 'update_treatment': {
        const { treatmentId, prioridade, justificativa } = body;
        if (!treatmentId) return jsonRes({ error: 'treatmentId is required' }, 400);
        const updates: Record<string, unknown> = {};
        if (prioridade !== undefined) {
          const numPri = requireNum(prioridade, 'prioridade');
          if (numPri < 1 || numPri > 10) return jsonRes({ error: 'prioridade must be 1-10' }, 400);
          updates.prioridade = numPri;
        }
        if (justificativa !== undefined) {
          if (typeof justificativa !== 'string' || justificativa.length > 500) return jsonRes({ error: 'justificativa max 500 chars' }, 400);
          updates.justificativa = justificativa.trim();
        }
        if (Object.keys(updates).length === 0) return jsonRes({ error: 'No fields to update' }, 400);
        const { error } = await supabase.from('tratamentos_caso').update(updates).eq('id', treatmentId).eq('case_id', caseId);
        if (error) throw error;
        result.message = 'Tratamento atualizado';
        break;
      }

      // ── DELETE ──
      case 'delete_primary_param': {
        const { paramId } = body;
        if (!paramId) return jsonRes({ error: 'paramId is required' }, 400);
        const { error } = await supabase.from('valores_iniciais_caso').delete().eq('id', paramId).eq('id_caso', caseId);
        if (error) throw error;
        result.message = 'Parâmetro primário removido';
        break;
      }

      case 'delete_secondary_param': {
        const { paramId } = body;
        if (!paramId) return jsonRes({ error: 'paramId is required' }, 400);
        const { error } = await supabase.from('parametros_secundarios_caso').delete().eq('id', paramId).eq('case_id', caseId);
        if (error) throw error;
        result.message = 'Parâmetro secundário removido';
        break;
      }

      case 'delete_treatment': {
        const { treatmentId } = body;
        if (!treatmentId) return jsonRes({ error: 'treatmentId is required' }, 400);
        const { error } = await supabase.from('tratamentos_caso').delete().eq('id', treatmentId).eq('case_id', caseId);
        if (error) throw error;
        result.message = 'Tratamento removido';
        break;
      }

      // ── ADD ──
      case 'add_primary_param': {
        const { parametroId, valor } = body;
        if (!parametroId) return jsonRes({ error: 'parametroId is required' }, 400);
        const numVal = requireNum(valor, 'valor');
        // Check duplicate
        const { data: exists } = await supabase.from('valores_iniciais_caso').select('id').eq('id_caso', caseId).eq('id_parametro', parametroId).maybeSingle();
        if (exists) return jsonRes({ error: 'Este parâmetro já existe neste caso' }, 400);
        const { error } = await supabase.from('valores_iniciais_caso').insert({ id_caso: caseId, id_parametro: parametroId, valor: numVal });
        if (error) throw error;
        result.message = 'Parâmetro primário adicionado';
        break;
      }

      case 'add_secondary_param': {
        const { parametroId, valor } = body;
        if (!parametroId) return jsonRes({ error: 'parametroId is required' }, 400);
        const numVal = requireNum(valor, 'valor');
        const { data: exists } = await supabase.from('parametros_secundarios_caso').select('id').eq('case_id', caseId).eq('parametro_id', parametroId).maybeSingle();
        if (exists) return jsonRes({ error: 'Este parâmetro secundário já existe neste caso' }, 400);
        const { error } = await supabase.from('parametros_secundarios_caso').insert({ case_id: caseId, parametro_id: parametroId, valor: numVal });
        if (error) throw error;
        result.message = 'Parâmetro secundário adicionado';
        break;
      }

      case 'add_treatment': {
        const { tratamentoId, prioridade, justificativa } = body;
        if (!tratamentoId) return jsonRes({ error: 'tratamentoId is required' }, 400);
        const numPri = requireNum(prioridade, 'prioridade');
        if (numPri < 1 || numPri > 10) return jsonRes({ error: 'prioridade must be 1-10' }, 400);
        const { data: exists } = await supabase.from('tratamentos_caso').select('id').eq('case_id', caseId).eq('tratamento_id', tratamentoId).maybeSingle();
        if (exists) return jsonRes({ error: 'Este tratamento já existe neste caso' }, 400);
        const insertData: Record<string, unknown> = { case_id: caseId, tratamento_id: tratamentoId, prioridade: numPri };
        if (justificativa && typeof justificativa === 'string' && justificativa.trim().length <= 500) {
          insertData.justificativa = justificativa.trim();
        }
        const { error } = await supabase.from('tratamentos_caso').insert(insertData);
        if (error) throw error;
        result.message = 'Tratamento adicionado';
        break;
      }

      case 'reorder_treatments': {
        const { order } = body;
        if (!Array.isArray(order) || order.length === 0) return jsonRes({ error: 'order array is required' }, 400);
        if (order.length > 50) return jsonRes({ error: 'Too many items' }, 400);
        // Validate all items have id
        for (const item of order) {
          if (!item.id || typeof item.prioridade !== 'number' || item.prioridade < 1 || item.prioridade > 50) {
            return jsonRes({ error: 'Each item needs id and prioridade (1-50)' }, 400);
          }
        }
        // Update each treatment's priority
        for (const item of order) {
          const { error } = await supabase
            .from('tratamentos_caso')
            .update({ prioridade: item.prioridade })
            .eq('id', item.id)
            .eq('case_id', caseId);
          if (error) throw error;
        }
        result.message = `Prioridades atualizadas (${order.length} tratamentos)`;
        break;
      }

      default:
        return jsonRes({ error: `Unknown action: ${action}` }, 400);
    }

    return jsonRes(result);

  } catch (error) {
    console.error('Erro:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
