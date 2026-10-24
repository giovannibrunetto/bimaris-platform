create policy "staging operator media insert"
on public.experience_media
for insert to authenticated
with check (
  exists (
    select 1 from public.experiences e
    join public.operator_memberships m on m.operator_id=e.operator_id
    where e.id=experience_media.experience_id
      and e.published=false
      and e.review_status in ('draft','rejected')
      and m.user_id=(select auth.uid())
      and m.role in ('owner','manager')
  )
);

create policy "public read published experience media"
on public.experience_media
for select to anon, authenticated
using (
  exists (
    select 1 from public.experiences e
    where e.id=experience_media.experience_id
      and e.published=true
  )
);

create policy "operator members read own experience media"
on public.experience_media
for select to authenticated
using (
  exists (
    select 1 from public.experiences e
    join public.operator_memberships m on m.operator_id=e.operator_id
    where e.id=experience_media.experience_id
      and m.user_id=(select auth.uid())
  )
);
