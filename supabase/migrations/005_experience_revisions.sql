-- Keep the currently approved experience online while an operator prepares
-- and submits a new version for BIMARIS review.
create table if not exists public.experience_revisions (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  operator_id uuid not null references public.operators(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','pending','rejected','approved','applied')),
  draft_step integer not null default 0 check (draft_step between 0 and 4),
  content jsonb not null default '{}'::jsonb,
  media jsonb not null default '[]'::jsonb,
  review_notes text,
  review_sections jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists experience_revisions_one_active_per_experience
  on public.experience_revisions(experience_id)
  where status in ('draft','pending','rejected','approved');

create index if not exists experience_revisions_operator_idx
  on public.experience_revisions(operator_id, updated_at desc);

alter table public.experience_revisions enable row level security;

create policy "operator members read own experience revisions"
on public.experience_revisions for select
to authenticated
using (
  exists (
    select 1 from public.operator_memberships membership
    where membership.operator_id = experience_revisions.operator_id
      and membership.user_id = auth.uid()
  )
);

create policy "operator members create own experience revisions"
on public.experience_revisions for insert
to authenticated
with check (
  exists (
    select 1 from public.operator_memberships membership
    where membership.operator_id = experience_revisions.operator_id
      and membership.user_id = auth.uid()
  )
  and exists (
    select 1 from public.experiences experience
    where experience.id = experience_revisions.experience_id
      and experience.operator_id = experience_revisions.operator_id
      and experience.published = true
      and experience.review_status = 'approved'
  )
);

create policy "operator members update editable experience revisions"
on public.experience_revisions for update
to authenticated
using (
  status in ('draft','rejected')
  and exists (
    select 1 from public.operator_memberships membership
    where membership.operator_id = experience_revisions.operator_id
      and membership.user_id = auth.uid()
  )
)
with check (
  status in ('draft','pending','rejected')
  and exists (
    select 1 from public.operator_memberships membership
    where membership.operator_id = experience_revisions.operator_id
      and membership.user_id = auth.uid()
  )
);

comment on table public.experience_revisions is
  'Proposed changes to a published experience. The approved public experience remains untouched until a revision is approved and applied.';
