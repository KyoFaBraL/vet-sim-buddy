DELETE FROM public.participant_codes WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE 'visitante.demo.%');
DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE 'visitante.demo.%');
DELETE FROM public.profiles WHERE id IN (SELECT id FROM auth.users WHERE email LIKE 'visitante.demo.%');
DELETE FROM auth.users WHERE email LIKE 'visitante.demo.%';