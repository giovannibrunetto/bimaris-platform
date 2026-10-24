create policy "operator owners can insert own discovery profile"
on public.experience_discovery_profiles
for insert
to authenticated
with check (
  exists (
    select 1
    from public.experiences e
    join public.operator_memberships m on m.operator_id = e.operator_id
    where e.id = experience_discovery_profiles.experience_id
      and e.published = false
      and e.review_status in ('draft','rejected')
      and m.user_id = (select auth.uid())
      and m.role in ('owner','manager')
  )
);

create policy "operator owners can update own discovery profile"
on public.experience_discovery_profiles
for update
to authenticated
using (
  exists (
    select 1
    from public.experiences e
    join public.operator_memberships m on m.operator_id = e.operator_id
    where e.id = experience_discovery_profiles.experience_id
      and e.published = false
      and e.review_status in ('draft','rejected')
      and m.user_id = (select auth.uid())
      and m.role in ('owner','manager')
  )
)
with check (
  exists (
    select 1
    from public.experiences e
    join public.operator_memberships m on m.operator_id = e.operator_id
    where e.id = experience_discovery_profiles.experience_id
      and e.published = false
      and e.review_status in ('draft','rejected')
      and m.user_id = (select auth.uid())
      and m.role in ('owner','manager')
  )
);
