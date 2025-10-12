-- Update shared_cases policies to use has_role
drop policy if exists "Professores podem criar compartilhamentos" on public.shared_cases;
drop policy if exists "Professores podem atualizar seus compartilhamentos" on public.shared_cases;
drop policy if exists "Professores podem deletar seus compartilhamentos" on public.shared_cases;
drop policy if exists "Professores podem ver seus compartilhamentos" on public.shared_cases;

create policy "Professores podem criar compartilhamentos"
on public.shared_cases
for insert
to authenticated
with check (auth.uid() = shared_by and has_role(auth.uid(), 'professor'));

create policy "Professores podem atualizar seus compartilhamentos"
on public.shared_cases
for update
to authenticated
using (auth.uid() = shared_by and has_role(auth.uid(), 'professor'));

create policy "Professores podem deletar seus compartilhamentos"
on public.shared_cases
for delete
to authenticated
using (auth.uid() = shared_by and has_role(auth.uid(), 'professor'));

create policy "Professores podem ver seus compartilhamentos"
on public.shared_cases
for select
to authenticated
using (auth.uid() = shared_by and has_role(auth.uid(), 'professor'));

-- Update casos_clinicos policies
drop policy if exists "Usuários autenticados podem criar casos" on public.casos_clinicos;

create policy "Professores podem criar casos"
on public.casos_clinicos
for insert
to authenticated
with check (auth.uid() = user_id and has_role(auth.uid(), 'professor'));