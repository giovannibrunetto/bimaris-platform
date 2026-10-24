drop policy if exists "public read published experience activity links" on public.experience_activity_links;

create policy "public read published experience activity links"
on public.experience_activity_links
for select
using (
  exists (
    select 1
    from public.experiences e
    where e.id = experience_activity_links.experience_id
      and e.published = true
      and e.review_status = 'approved'
  )
  or exists (
    select 1
    from public.experiences e
    join public.operator_memberships m on m.operator_id = e.operator_id
    where e.id = experience_activity_links.experience_id
      and m.user_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.operator_memberships m
    where m.operator_id = experience_activity_links.operator_id
      and m.user_id = (select auth.uid())
  )
);
