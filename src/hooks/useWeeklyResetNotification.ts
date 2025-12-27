import { useEffect, useCallback } from "react";
import { startOfWeek, differenceInMilliseconds, addWeeks, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const NOTIFICATION_KEY = "vetbalance_weekly_reset_notified";

export const useWeeklyResetNotification = () => {
  const { toast } = useToast();

  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  }, []);

  const sendPushNotification = useCallback((title: string, body: string) => {
    if (Notification.permission === "granted") {
      const notification = new Notification(title, {
        body,
        icon: "/favicon.png",
        badge: "/favicon.png",
        tag: "weekly-reset",
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    }
  }, []);

  const checkAndNotifyReset = useCallback(() => {
    const now = new Date();
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const lastNotifiedWeek = localStorage.getItem(NOTIFICATION_KEY);
    const currentWeekKey = format(currentWeekStart, "yyyy-MM-dd");

    // Check if we already notified for this week
    if (lastNotifiedWeek === currentWeekKey) {
      return;
    }

    // Check if it's Monday (day 1) and early in the day (first 12 hours)
    const dayOfWeek = now.getDay();
    const hourOfDay = now.getHours();

    if (dayOfWeek === 1 && hourOfDay < 12) {
      // It's Monday morning - send notification
      localStorage.setItem(NOTIFICATION_KEY, currentWeekKey);

      // Show toast notification
      toast({
        title: "🔄 Novo Ranking Semanal!",
        description: "O ranking foi reiniciado. Hora de conquistar o topo!",
        duration: 8000,
      });

      // Send push notification if permitted
      sendPushNotification(
        "🏆 VetBalance - Novo Ranking Semanal!",
        "O ranking semanal foi reiniciado. Hora de conquistar o topo! Boa sorte!"
      );
    } else if (lastNotifiedWeek && lastNotifiedWeek !== currentWeekKey) {
      // Week changed but not Monday morning - still notify on first visit
      localStorage.setItem(NOTIFICATION_KEY, currentWeekKey);

      toast({
        title: "📊 Nova Semana no Ranking!",
        description: "Uma nova semana começou. Seu progresso foi salvo no histórico.",
        duration: 6000,
      });
    }
  }, [toast, sendPushNotification]);

  const scheduleNextReset = useCallback(() => {
    const now = new Date();
    const nextMonday = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
    nextMonday.setHours(0, 0, 0, 0);

    const msUntilReset = differenceInMilliseconds(nextMonday, now);

    // Schedule notification for next Monday at midnight
    const timeoutId = setTimeout(() => {
      localStorage.setItem(NOTIFICATION_KEY, format(nextMonday, "yyyy-MM-dd"));

      toast({
        title: "🔄 Novo Ranking Semanal!",
        description: "O ranking foi reiniciado. Uma nova semana de competição começou!",
        duration: 8000,
      });

      sendPushNotification(
        "🏆 VetBalance - Ranking Reiniciado!",
        "O ranking semanal foi reiniciado. Comece a nova semana no topo!"
      );

      // Schedule the next one
      scheduleNextReset();
    }, Math.min(msUntilReset, 2147483647)); // Max setTimeout value

    return timeoutId;
  }, [toast, sendPushNotification]);

  useEffect(() => {
    // Request permission on mount
    requestNotificationPermission();

    // Check for reset on mount
    checkAndNotifyReset();

    // Schedule next reset notification
    const timeoutId = scheduleNextReset();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [requestNotificationPermission, checkAndNotifyReset, scheduleNextReset]);

  return { requestNotificationPermission };
};
