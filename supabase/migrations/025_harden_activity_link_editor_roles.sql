drop policy if exists "editor manages experience activity links" on public.experience_activity_links;
drop policy if exists "editor removes experience activity links" on public.experience_activity_links;

create policy "operator managers add own experience activity links"
on public.experience_activity_links
for insert to authenticated
with check (
  exists (
    select 1 from public.experiences e
    join public.operator_memberships m on m.operator_id=e.operator_id
    where e.id=experience_activity_links.experience_id
      and e.published=false
      and e.review_status in ('draft','rejected')
      and m.user_id=(select auth.uid())
      and m.role in ('owner','manager')
  )
  and exists (
    select 1 from public.operator_memberships target
    where target.operator_id=experience_activity_links.operator_id
      and target.user_id=(select auth.uid())
      and target.role in ('owner','manager')
  )
);

create policy "operator managers remove own experience activity links"
on public.experience_activity_links
for delete to authenticated
using (
  exists (
    select 1 from public.experiences e
    join public.operator_memberships m on m.operator_id=e.operator_id
    where e.id=experience_activity_links.experience_id
      and e.published=false
      and e.review_status in ('draft','rejected')
      and m.user_id=(select auth.uid())
      and m.role in ('owner','manager')
  )
);
