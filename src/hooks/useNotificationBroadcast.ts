import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface NotificationBroadcast {
  id: string;
  titulo: string;
  mensagem: string;
  url: string | null;
  criado_em: string;
}

const SEEN_KEY = 'vetbalance_broadcast_seen';
const POLL_MS = 60000;

/**
 * Exibe o aviso global publicado pelo administrador como notificação do navegador
 * (uma única vez por aviso, por dispositivo). Caso as notificações não estejam
 * autorizadas, o aviso aparece como toast dentro do aplicativo.
 */
export const useNotificationBroadcast = () => {
  const [broadcast, setBroadcast] = useState<NotificationBroadcast | null>(null);
  const shownRef = useRef<string | null>(null);

  const show = useCallback((row: NotificationBroadcast) => {
    if (shownRef.current === row.id) return;
    if (localStorage.getItem(SEEN_KEY) === row.id) return;
    shownRef.current = row.id;
    localStorage.setItem(SEEN_KEY, row.id);

    const openTarget = () => {
      if (row.url) window.location.assign(row.url);
    };

    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(row.titulo, {
        body: row.mensagem,
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag: `vetbalance-broadcast-${row.id}`,
      });
      notification.onclick = () => {
        window.focus();
        openTarget();
        notification.close();
      };
      return;
    }

    toast(row.titulo, {
      description: row.mensagem,
      duration: 15000,
      action: row.url ? { label: 'Abrir', onClick: openTarget } : undefined,
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchLatest = async () => {
      try {
        const { data, error } = await supabase
          .from('notification_broadcasts')
          .select('id, titulo, mensagem, url, criado_em')
          .eq('ativo', true)
          .order('criado_em', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error || cancelled || !data) return;
        setBroadcast(data as NotificationBroadcast);
        show(data as NotificationBroadcast);
      } catch (err) {
        console.error('Erro ao buscar aviso global:', err);
      }
    };

    fetchLatest();
    const interval = window.setInterval(fetchLatest, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [show]);

  return { broadcast };
};
