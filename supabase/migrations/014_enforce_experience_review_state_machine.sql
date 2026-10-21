-- Keep publication and operator-side editing aligned with the review workflow.
-- This migration mirrors the production hardening applied during the structural audit.

alter table public.experiences
  drop constraint if exists experiences_published_requires_approval;

alter table public.experiences
  add constraint experiences_published_requires_approval
  check (published = false or review_status = 'approved');

drop policy if exists "operator owners can create own experiences" on public.experiences;
create policy "operator owners can create own experiences"
on public.experiences
for insert
to authenticated
with check (
  published = false
  and review_status = 'draft'
  and exists (
    select 1 from public.operator_memberships m
    where m.operator_id = experiences.operator_id
      and m.user_id = auth.uid()
      and m.role in ('owner','manager')
  )
);

drop policy if exists "operator owners can update own unpublished experiences" on public.experiences;
create policy "operator owners can update own unpublished experiences"
on public.experiences
for update
to authenticated
using (
  published = false
  and review_status in ('draft','rejected')
  and exists (
    select 1 from public.operator_memberships m
    where m.operator_id = experiences.operator_id
      and m.user_id = auth.uid()
      and m.role in ('owner','manager')
  )
)
with check (
  published = false
  and review_status in ('draft','rejected','pending')
  and exists (
    select 1 from public.operator_memberships m
    where m.operator_id = experiences.operator_id
      and m.user_id = auth.uid()
      and m.role in ('owner','manager')
  )
);
