import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface ParticipantCode {
  codigo: string;
  grupo: 'GE' | 'GC';
}

export const useParticipantCode = (user: User | null) => {
  const [code, setCode] = useState<ParticipantCode | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setCode(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('participant_codes')
        .select('codigo, grupo')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setCode(data ? { codigo: data.codigo, grupo: data.grupo as 'GE' | 'GC' } : null);
    } catch (err) {
      console.error('Erro ao carregar código do participante:', err);
      setCode(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  return { code, loading, reload: load };
};

export const assignParticipantCode = async (): Promise<ParticipantCode | null> => {
  try {
    const { data, error } = await supabase.rpc('assign_participant_code', {});
    if (error) throw error;
    const result = data as { success: boolean; codigo?: string; grupo?: string } | null;
    if (result?.success && result.codigo && result.grupo) {
      return { codigo: result.codigo, grupo: result.grupo as 'GE' | 'GC' };
    }
    return null;
  } catch (err) {
    console.error('Erro ao atribuir código do participante:', err);
    return null;
  }
};
