import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

const TCLE_VERSION = '1.0';

export const useTcleConsent = (user: User | null) => {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHasConsent(null);
      setLoading(false);
      return;
    }

    const checkConsent = async () => {
      try {
        const { data, error } = await supabase
          .from('tcle_consents')
          .select('id')
          .eq('user_id', user.id)
          .eq('versao', TCLE_VERSION)
          .eq('aceito', true)
          .limit(1);

        if (error) throw error;
        setHasConsent(data && data.length > 0);
      } catch (err) {
        console.error('Erro ao verificar consentimento TCLE:', err);
        setHasConsent(false);
      } finally {
        setLoading(false);
      }
    };

    checkConsent();
  }, [user]);

  const acceptConsent = async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('tcle_consents')
        .insert({
          user_id: user.id,
          versao: TCLE_VERSION,
          aceito: true,
          user_agent: navigator.userAgent,
        });

      if (error) throw error;
      setHasConsent(true);
      return true;
    } catch (err) {
      console.error('Erro ao registrar consentimento:', err);
      return false;
    }
  };

  const declineConsent = async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('tcle_consents')
        .insert({
          user_id: user.id,
          versao: TCLE_VERSION,
          aceito: false,
          user_agent: navigator.userAgent,
        });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao registrar recusa:', err);
      return false;
    }
  };

  return { hasConsent, loading, acceptConsent, declineConsent, TCLE_VERSION };
};
