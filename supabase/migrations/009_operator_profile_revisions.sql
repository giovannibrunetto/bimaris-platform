create table if not exists public.operator_revisions (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id) on delete cascade,
  proposed_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  proposed_data jsonb not null default '{}'::jsonb,
  review_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists operator_revisions_operator_idx on public.operator_revisions(operator_id, created_at desc);
create index if not exists operator_revisions_pending_idx on public.operator_revisions(status) where status='pending';

alter table public.operator_revisions enable row level security;

create policy "operator members read own revisions"
on public.operator_revisions for select to authenticated
using (exists (
  select 1 from public.operator_memberships m
  where m.operator_id=operator_revisions.operator_id and m.user_id=auth.uid()
));

create policy "operator members propose revisions"
on public.operator_revisions for insert to authenticated
with check (
  proposed_by=auth.uid() and exists (
    select 1 from public.operator_memberships m
    where m.operator_id=operator_revisions.operator_id and m.user_id=auth.uid()
  )
);
