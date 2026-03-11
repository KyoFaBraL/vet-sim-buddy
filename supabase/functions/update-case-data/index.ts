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

    switch (action) {
      case 'update_primary_param': {
        const { paramId, valor } = body;
        if (!paramId || valor === undefined || valor === null) {
          return new Response(JSON.stringify({ error: 'paramId and valor are required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const numVal = Number(valor);
        if (isNaN(numVal)) {
          return new Response(JSON.stringify({ error: 'valor must be a number' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const { error } = await supabase
          .from('valores_iniciais_caso')
          .update({ valor: numVal })
          .eq('id', paramId)
          .eq('id_caso', caseId);
        if (error) throw error;
        result.message = 'Parâmetro primário atualizado';
        break;
      }

      case 'update_secondary_param': {
        const { paramId, valor } = body;
        if (!paramId || valor === undefined || valor === null) {
          return new Response(JSON.stringify({ error: 'paramId and valor are required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const numVal = Number(valor);
        if (isNaN(numVal)) {
          return new Response(JSON.stringify({ error: 'valor must be a number' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const { error } = await supabase
          .from('parametros_secundarios_caso')
          .update({ valor: numVal })
          .eq('id', paramId)
          .eq('case_id', caseId);
        if (error) throw error;
        result.message = 'Parâmetro secundário atualizado';
        break;
      }

      case 'update_treatment': {
        const { treatmentId, prioridade, justificativa } = body;
        if (!treatmentId) {
          return new Response(JSON.stringify({ error: 'treatmentId is required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const updates: Record<string, unknown> = {};
        if (prioridade !== undefined) {
          const numPri = Number(prioridade);
          if (isNaN(numPri) || numPri < 1 || numPri > 10) {
            return new Response(JSON.stringify({ error: 'prioridade must be 1-10' }), {
              status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          updates.prioridade = numPri;
        }
        if (justificativa !== undefined) {
          if (typeof justificativa !== 'string' || justificativa.length > 500) {
            return new Response(JSON.stringify({ error: 'justificativa must be a string (max 500 chars)' }), {
              status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          updates.justificativa = justificativa.trim();
        }
        if (Object.keys(updates).length === 0) {
          return new Response(JSON.stringify({ error: 'No fields to update' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const { error } = await supabase
          .from('tratamentos_caso')
          .update(updates)
          .eq('id', treatmentId)
          .eq('case_id', caseId);
        if (error) throw error;
        result.message = 'Tratamento atualizado';
        break;
      }

      case 'delete_primary_param': {
        const { paramId } = body;
        if (!paramId) {
          return new Response(JSON.stringify({ error: 'paramId is required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const { error } = await supabase
          .from('valores_iniciais_caso')
          .delete()
          .eq('id', paramId)
          .eq('id_caso', caseId);
        if (error) throw error;
        result.message = 'Parâmetro primário removido';
        break;
      }

      case 'delete_secondary_param': {
        const { paramId } = body;
        if (!paramId) {
          return new Response(JSON.stringify({ error: 'paramId is required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const { error } = await supabase
          .from('parametros_secundarios_caso')
          .delete()
          .eq('id', paramId)
          .eq('case_id', caseId);
        if (error) throw error;
        result.message = 'Parâmetro secundário removido';
        break;
      }

      case 'delete_treatment': {
        const { treatmentId } = body;
        if (!treatmentId) {
          return new Response(JSON.stringify({ error: 'treatmentId is required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const { error } = await supabase
          .from('tratamentos_caso')
          .delete()
          .eq('id', treatmentId)
          .eq('case_id', caseId);
        if (error) throw error;
        result.message = 'Tratamento removido';
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
