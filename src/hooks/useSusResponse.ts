import { useCallback, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { SusAnswers } from '@/constants/susItems';
import type { Instituicao } from '@/hooks/useParticipantCode';

export interface SusResponse {
  id: string;
  instituicao: Instituicao;
  codigo: string | null;
  respostas: SusAnswers;
  comentarios: string | null;
  criado_em: string;
  atualizado_em: string;
}

export const useSusResponse = (user: User | null) => {
  const [response, setResponse] = useState<SusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setResponse(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sus_responses')
        .select('id, instituicao, codigo, respostas, comentarios, criado_em, atualizado_em')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      setResponse(
        data
          ? {
              id: data.id,
              instituicao: data.instituicao as Instituicao,
              codigo: data.codigo,
              respostas: (data.respostas ?? {}) as SusAnswers,
              comentarios: data.comentarios,
              criado_em: data.criado_em,
              atualizado_em: data.atualizado_em,
            }
          : null,
      );
    } catch (err) {
      console.error('Erro ao carregar resposta do SUS:', err);
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = useCallback(
    async (payload: {
      respostas: SusAnswers;
      comentarios?: string;
      instituicao: Instituicao;
      codigo?: string | null;
    }) => {
      if (!user) return false;
      try {
        const row = {
          user_id: user.id,
          instituicao: payload.instituicao,
          codigo: payload.codigo ?? null,
          respostas: payload.respostas,
          comentarios: payload.comentarios?.trim() ? payload.comentarios.trim().slice(0, 2000) : null,
        };

        if (response) {
          const { error } = await supabase
            .from('sus_responses')
            .update(row)
            .eq('id', response.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('sus_responses').insert(row);
          if (error) throw error;
        }
        await load();
        return true;
      } catch (err) {
        console.error('Erro ao salvar resposta do SUS:', err);
        return false;
      }
    },
    [user?.id, response, load],
  );

  return { response, loading, reload: load, submit };
};
