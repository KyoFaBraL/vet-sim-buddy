DROP FUNCTION IF EXISTS public.assign_participant_code(uuid);

REVOKE ALL ON FUNCTION public.reassign_participant_code(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reassign_participant_code(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.reassign_participant_code(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.assign_participant_code(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assign_participant_code(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.assign_participant_code(uuid, text) TO authenticated;