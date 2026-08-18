import { useCallback, useEffect, useState } from 'react';
import {
  SUS_DEADLINE_LABEL,
  diasRestantesSus,
  isSusPrazoEncerrado,
} from '@/constants/susItems';

const LAST_NOTIFIED_KEY = 'vetbalance_sus_reminder_last';

type Permission = 'default' | 'granted' | 'denied' | 'unsupported';

const getPermission = (): Permission =>
  typeof window === 'undefined' || !('Notification' in window)
    ? 'unsupported'
    : (Notification.permission as Permission);

const todayKey = () => new Date().toISOString().slice(0, 10);

/**
 * Lembrete do questionário SUS via notificação do navegador.
 * Dispara no máximo uma vez por dia, enquanto o aluno não respondeu e o prazo não encerrou.
 */
export const useSusBrowserReminder = (opts: {
  pendente: boolean;
  ready: boolean;
  onOpenSurvey?: () => void;
}) => {
  const { pendente, ready, onOpenSurvey } = opts;
  const [permission, setPermission] = useState<Permission>(getPermission);

  const notify = useCallback(
    (body?: string) => {
      if (getPermission() !== 'granted') return false;
      const dias = diasRestantesSus();
      const notification = new Notification('VetBalance — Questionário SUS', {
        body:
          body ??
          `Preencha o questionário de satisfação até ${SUS_DEADLINE_LABEL}. ${
            dias <= 0 ? 'Último dia!' : `Faltam ${dias} dia(s).`
          }`,
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag: 'sus-reminder',
      });
      notification.onclick = () => {
        window.focus();
        onOpenSurvey?.();
        notification.close();
      };
      return true;
    },
    [onOpenSurvey],
  );

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return false;
    }
    const result = await Notification.requestPermission();
    setPermission(result as Permission);
    return result === 'granted';
  }, []);

  const sendTestNotification = useCallback(async () => {
    const ok = getPermission() === 'granted' ? true : await requestPermission();
    if (!ok) return false;
    return notify(
      `Teste de lembrete: o questionário de satisfação (SUS) deve ser preenchido até ${SUS_DEADLINE_LABEL}.`,
    );
  }, [notify, requestPermission]);

  useEffect(() => {
    if (!ready || !pendente) return;
    if (isSusPrazoEncerrado()) return;
    if (getPermission() !== 'granted') return;

    const key = todayKey();
    if (localStorage.getItem(LAST_NOTIFIED_KEY) === key) return;

    const timer = window.setTimeout(() => {
      if (notify()) localStorage.setItem(LAST_NOTIFIED_KEY, key);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [ready, pendente, notify]);

  return { permission, requestPermission, sendTestNotification };
};
