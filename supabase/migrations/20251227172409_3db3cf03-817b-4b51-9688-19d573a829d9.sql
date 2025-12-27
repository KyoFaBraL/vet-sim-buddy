-- Drop the old check constraint and create a new one with all valid status values
ALTER TABLE public.simulation_sessions 
DROP CONSTRAINT simulation_sessions_status_check;

ALTER TABLE public.simulation_sessions 
ADD CONSTRAINT simulation_sessions_status_check 
CHECK (status = ANY (ARRAY['em_andamento'::text, 'concluida'::text, 'abandonada'::text, 'won'::text, 'lost'::text]));