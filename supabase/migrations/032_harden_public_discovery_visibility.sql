-- Harden public discovery visibility.
-- discovery_active alone must never expose metadata for an experience
-- that has not completed the BIMARIS publication workflow.

drop policy if exists "public read active experience discovery profiles"
  on public.experience_discovery_profiles;

create policy "public read active published experience discovery profiles"
on public.experience_discovery_profiles
for select
to anon, authenticated
using (
  discovery_active = true
  and exists (
    select 1
    from public.experiences e
    join public.operators o on o.id = e.operator_id
    where e.id = experience_discovery_profiles.experience_id
      and e.published = true
      and e.review_status = 'approved'
      and o.published = true
      and o.selection_status = 'selected'
  )
);

drop policy if exists "read permitted experience discovery intents"
  on public.experience_discovery_intents;

create policy "read permitted published experience discovery intents"
on public.experience_discovery_intents
for select
to anon, authenticated
using (
  (
    exists (
      select 1
      from public.experience_discovery_profiles p
      join public.experiences e on e.id = p.experience_id
      join public.operators o on o.id = e.operator_id
      where p.experience_id = experience_discovery_intents.experience_id
        and p.discovery_active = true
        and e.published = true
        and e.review_status = 'approved'
        and o.published = true
        and o.selection_status = 'selected'
    )
  )
  or exists (
    select 1
    from public.experiences e
    join public.operator_memberships m on m.operator_id = e.operator_id
    where e.id = experience_discovery_intents.experience_id
      and m.user_id = (select auth.uid())
      and m.role = any (array['owner'::text, 'manager'::text])
  )
);
