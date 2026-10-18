-- Keep proposed media separate from the gallery currently published.
create table if not exists public.experience_revision_media (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null references public.experience_revisions(id) on delete cascade,
  operator_id uuid not null references public.operators(id) on delete cascade,
  source_media_id uuid references public.experience_media(id) on delete set null,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0 check (sort_order between 0 and 5),
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  unique (revision_id, storage_path)
);

create index if not exists experience_revision_media_revision_idx
  on public.experience_revision_media(revision_id, sort_order);
create unique index if not exists experience_revision_media_one_cover
  on public.experience_revision_media(revision_id) where is_cover;

alter table public.experience_revision_media enable row level security;

create policy "operator members read own revision media"
on public.experience_revision_media for select to authenticated
using (exists (select 1 from public.operator_memberships m where m.operator_id=experience_revision_media.operator_id and m.user_id=auth.uid()));

create policy "operator owners create editable revision media"
on public.experience_revision_media for insert to authenticated
with check (
  exists (select 1 from public.operator_memberships m where m.operator_id=experience_revision_media.operator_id and m.user_id=auth.uid() and m.role in ('owner','manager'))
  and exists (select 1 from public.experience_revisions r where r.id=experience_revision_media.revision_id and r.operator_id=experience_revision_media.operator_id and r.status in ('draft','rejected'))
);

create policy "operator owners update editable revision media"
on public.experience_revision_media for update to authenticated
using (
  exists (select 1 from public.operator_memberships m where m.operator_id=experience_revision_media.operator_id and m.user_id=auth.uid() and m.role in ('owner','manager'))
  and exists (select 1 from public.experience_revisions r where r.id=experience_revision_media.revision_id and r.operator_id=experience_revision_media.operator_id and r.status in ('draft','rejected'))
)
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

-- A new revision starts with a metadata snapshot of the live gallery. No public row or file is changed.
create or replace function public.snapshot_experience_revision_media()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  insert into public.experience_revision_media(revision_id,operator_id,source_media_id,storage_path,alt_text,sort_order,is_cover)
  select new.id,new.operator_id,m.id,m.storage_path,m.alt_text,m.sort_order,m.is_cover
  from public.experience_media m where m.experience_id=new.experience_id order by m.sort_order limit 6;
  return new;
end; $$;

create trigger experience_revision_media_snapshot
  after insert on public.experience_revisions
  for each row execute function public.snapshot_experience_revision_media();

revoke all on function public.snapshot_experience_revision_media() from public, anon, authenticated;

comment on table public.experience_revision_media is 'Working media set for a published-experience revision; live experience_media remains unchanged until approval.';
