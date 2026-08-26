REVOKE EXECUTE ON FUNCTION public.create_notification_broadcast(text, text, text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.deactivate_notification_broadcasts() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_sus_reminder_targets() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_notification_broadcast(text, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_notification_broadcasts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sus_reminder_targets() TO authenticated;