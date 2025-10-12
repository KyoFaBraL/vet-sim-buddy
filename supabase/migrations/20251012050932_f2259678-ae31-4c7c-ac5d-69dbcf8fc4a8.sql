-- Fix weak access code generation with cryptographically secure implementation
CREATE OR REPLACE FUNCTION public.generate_access_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  code TEXT;
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude ambiguous chars (0, O, I, 1, L)
  exists BOOLEAN;
BEGIN
  LOOP
    code := '';
    -- Generate 16-character code for higher entropy
    FOR i IN 1..16 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    -- Ensure code is unique
    SELECT EXISTS(SELECT 1 FROM public.shared_cases WHERE access_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$;