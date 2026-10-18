-- Store proposed media for published-experience revisions separately from public media.
-- Files live under revisions/<operator>/<revision>/... in the existing private write path;
-- only metadata is promoted when an admin applies the revision.
create table if not exists public.experience_revision_media (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null references public.experience_revisions(id) on delete cascade,
  operator_id uuid not null references public.operators(id) on delete cascade,
  storage_path text not null unique,
  alt_text text,
  sort_order integer not null default 0 check (sort_order between 0 and 5),
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists experience_revision_media_revision_idx
  on public.experience_revision_media(revision_id, sort_order);

create unique index if not exists experience_revision_media_one_cover
  on public.experience_revision_media(revision_id) where is_cover;

alter table public.experience_revision_media enable row level security;

create policy "operator members read own revision media"
on public.experience_revision_media for select to authenticated
using (exists (
  select 1 from public.operator_memberships m
  where m.operator_id=experience_revision_media.operator_id and m.user_id=auth.uid()
));

create policy "operator owners create editable revision media"
on public.experience_revision_media for insert to authenticated
with check (
  exists (select 1 from public.operator_memberships m where m.operator_id=experience_revision_media.operator_id and m.user_id=auth.uid() and m.role in ('owner','manager'))
  and exists (select 1 from public.experience_revisions r where r.id=experience_revision_media.revision_id and r.operator_id=experience_revision_media.operator_id and r.status in ('draft','rejected'))
);

create policy "operator owners update editable revision media"
on public.experience_revision_media for update to authenticated
using (exists (select 1 from public.experience_revisions r where r.id=experience_revision_media.revision_id and r.operator_id=experience_revision_media.operator_id and r.status in ('draft','rejected')))
with check (
  exists (select 1 from public.operator_memberships m where m.operator_id=experience_revision_media.operator_id and m.user_id=auth.uid() and m.role in ('owner','manager'))
  and exists (select 1 from public.experience_revisions r where r.id=experience_revision_media.revision_id and r.operator_id=experience_revision_media.operator_id and r.status in ('draft','rejected'))
);

create policy "operator owners delete editable revision media"
on public.experience_revision_media for delete to authenticated
using (
  exists (select 1 from public.operator_memberships m where m.operator_id=experience_revision_media.operator_id and m.user_id=auth.uid() and m.role in ('owner','manager'))
  and exists (select 1 from public.experience_revisions r where r.id=experience_revision_media.revision_id and r.operator_id=experience_revision_media.operator_id and r.status in ('draft','rejected'))
);

comment on table public.experience_revision_media is 'Proposed media kept separate from public experience_media until BIMARIS approval.';
