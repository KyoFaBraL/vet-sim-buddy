REVOKE EXECUTE ON FUNCTION public.create_notification_broadcast(text, text, text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.deactivate_notification_broadcasts() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_sus_reminder_targets() FROM anon;
GRANT EXECUTE ON FUNCTION public.create_notification_broadcast(text, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_notification_broadcasts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sus_reminder_targets() TO authenticated;