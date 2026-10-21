alter table public.experience_operators enable row level security;

create policy "public read participants for published experiences"
on public.experience_operators
for select
to anon, authenticated
using (
  exists (
    select 1 from public.experiences e
    where e.id = experience_operators.experience_id
      and e.published = true
  )
);

create policy "operator members read own experience participants"
on public.experience_operators
for select
to authenticated
using (
  exists (
    select 1 from public.experiences e
    join public.operator_memberships m on m.operator_id = e.operator_id
    where e.id = experience_operators.experience_id
      and m.user_id = auth.uid()
  )
);

revoke insert, update, delete, truncate on table public.experience_operators from anon, authenticated;
