create table if not exists public.operator_b2b_profiles (
  operator_id uuid primary key references public.operators(id) on delete cascade,
  enabled boolean not null default false,
  offer_tags text[] not null default '{}',
  seek_tags text[] not null default '{}',
  collaboration_types text[] not null default '{}',
  customer_segments text[] not null default '{}',
  languages text[] not null default '{}',
  areas text[] not null default '{}',
  availability_modes text[] not null default '{}',
  offer_summary text,
  seek_summary text,
  conditions_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint operator_b2b_profiles_offer_summary_len check (offer_summary is null or char_length(offer_summary) <= 1200),
  constraint operator_b2b_profiles_seek_summary_len check (seek_summary is null or char_length(seek_summary) <= 1200),
  constraint operator_b2b_profiles_conditions_notes_len check (conditions_notes is null or char_length(conditions_notes) <= 1200)
);

alter table public.operator_b2b_profiles enable row level security;

revoke all on table public.operator_b2b_profiles from anon;
revoke all on table public.operator_b2b_profiles from authenticated;
grant select, insert, update, delete on table public.operator_b2b_profiles to authenticated;

create policy "operator members read own b2b profile"
on public.operator_b2b_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.operator_memberships m
    where m.operator_id = operator_b2b_profiles.operator_id
      and m.user_id = (select auth.uid())
  )
);

create policy "operator managers create own b2b profile"
on public.operator_b2b_profiles
for insert
to authenticated
with check (
  exists (
    select 1
    from public.operator_memberships m
    where m.operator_id = operator_b2b_profiles.operator_id
      and m.user_id = (select auth.uid())
      and m.role = any (array['owner'::text,'manager'::text])
  )
);

create policy "operator managers update own b2b profile"
on public.operator_b2b_profiles
for update
to authenticated
using (
  exists (
    select 1
    from public.operator_memberships m
    where m.operator_id = operator_b2b_profiles.operator_id
      and m.user_id = (select auth.uid())
      and m.role = any (array['owner'::text,'manager'::text])
  )
)
with check (
  exists (
    select 1
    from public.operator_memberships m
    where m.operator_id = operator_b2b_profiles.operator_id
      and m.user_id = (select auth.uid())
      and m.role = any (array['owner'::text,'manager'::text])
  )
);

create policy "operator managers delete own b2b profile"
on public.operator_b2b_profiles
for delete
to authenticated
using (
  exists (
    select 1
    from public.operator_memberships m
    where m.operator_id = operator_b2b_profiles.operator_id
      and m.user_id = (select auth.uid())
      and m.role = any (array['owner'::text,'manager'::text])
  )
);

create index if not exists operator_b2b_profiles_enabled_idx on public.operator_b2b_profiles(enabled) where enabled = true;
create index if not exists operator_b2b_profiles_offer_tags_gin on public.operator_b2b_profiles using gin(offer_tags);
create index if not exists operator_b2b_profiles_seek_tags_gin on public.operator_b2b_profiles using gin(seek_tags);
