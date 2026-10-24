-- Consolidates the staging-only schema changes that were applied after 018.
-- This migration is intentionally idempotent where practical so a fresh database
-- can reproduce the current BIMARIS staging model without touching production.

-- Discovery foundations -------------------------------------------------------
create table if not exists public.discovery_intents (
  key text primary key,
  label text not null,
  active boolean not null default true,
  sort_order smallint not null default 0
);

insert into public.discovery_intents(key,label,active,sort_order) values
  ('culture','Cultura',true,10),
  ('food-wine','Sapori',true,20),
  ('nature','Natura',true,30),
  ('sea','Mare',true,40),
  ('adventure','Avventura',true,50),
  ('relax','Relax',true,60),
  ('stories-places','Storie e luoghi',true,70)
on conflict (key) do update set label=excluded.label, active=excluded.active, sort_order=excluded.sort_order;

create table if not exists public.experience_discovery_profiles (
  experience_id uuid primary key references public.experiences(id) on delete cascade,
  audiences text[] not null default '{}',
  children_allowed boolean,
  minimum_age smallint,
  environment text,
  booking_requirement text not null default 'none',
  booking_notice_hours integer not null default 0,
  discovery_active boolean not null default false,
  editorial_weight smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.experience_discovery_intents (
  experience_id uuid not null references public.experiences(id) on delete cascade,
  intent_key text not null references public.discovery_intents(key),
  weight numeric not null default 1.00 check (weight > 0 and weight <= 1),
  primary key (experience_id,intent_key)
);
create index if not exists experience_discovery_intents_intent_idx on public.experience_discovery_intents(intent_key);

create table if not exists public.experience_availability (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  day_of_week smallint not null,
  start_time time not null,
  end_time time not null,
  valid_from date,
  valid_until date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.discovery_intents enable row level security;
alter table public.experience_discovery_profiles enable row level security;
alter table public.experience_discovery_intents enable row level security;
alter table public.experience_availability enable row level security;

drop policy if exists "operator owners can read own experience interests" on public.experience_discovery_intents;
create policy "operator owners can read own experience interests" on public.experience_discovery_intents
for select to authenticated using (exists (
  select 1 from public.experiences e join public.operator_memberships m on m.operator_id=e.operator_id
  where e.id=experience_discovery_intents.experience_id and m.user_id=(select auth.uid()) and m.role=any(array['owner'::text,'manager'::text])
));
drop policy if exists "operator owners can add own experience interests" on public.experience_discovery_intents;
create policy "operator owners can add own experience interests" on public.experience_discovery_intents
for insert to authenticated with check (exists (
  select 1 from public.experiences e join public.operator_memberships m on m.operator_id=e.operator_id
  where e.id=experience_discovery_intents.experience_id and e.published=false and e.review_status=any(array['draft'::text,'rejected'::text])
    and m.user_id=(select auth.uid()) and m.role=any(array['owner'::text,'manager'::text])
));
drop policy if exists "operator owners can remove own experience interests" on public.experience_discovery_intents;
create policy "operator owners can remove own experience interests" on public.experience_discovery_intents
for delete to authenticated using (exists (
  select 1 from public.experiences e join public.operator_memberships m on m.operator_id=e.operator_id
  where e.id=experience_discovery_intents.experience_id and e.published=false and e.review_status=any(array['draft'::text,'rejected'::text])
    and m.user_id=(select auth.uid()) and m.role=any(array['owner'::text,'manager'::text])
));

create or replace function public.limit_experience_discovery_interests() returns trigger
language plpgsql set search_path to '' as $$
begin
  if (select count(*) from public.experience_discovery_intents edi where edi.experience_id=new.experience_id) >= 3 then
    raise exception 'Ogni esperienza può avere al massimo 3 interessi';
  end if;
  return new;
end;
$$;
drop trigger if exists limit_experience_discovery_interests on public.experience_discovery_intents;
create trigger limit_experience_discovery_interests before insert on public.experience_discovery_intents
for each row execute function public.limit_experience_discovery_interests();

-- Collaborative experiences --------------------------------------------------
alter table public.experience_operators add column if not exists activity_label text;
alter table public.experience_operators add column if not exists approval_status text not null default 'pending';
alter table public.experience_operators add column if not exists approved_at timestamptz;
alter table public.experience_operators add column if not exists invited_by_operator_id uuid references public.operators(id) on delete set null;
alter table public.experience_operators add column if not exists updated_at timestamptz not null default now();

do $$ begin
  if not exists (select 1 from pg_constraint where conname='experience_operators_approval_status_check') then
    alter table public.experience_operators add constraint experience_operators_approval_status_check check (approval_status=any(array['pending'::text,'accepted'::text,'rejected'::text]));
  end if;
end $$;
create index if not exists experience_operators_operator_status_idx on public.experience_operators(operator_id,approval_status);
create index if not exists experience_operators_invited_by_operator_idx on public.experience_operators(invited_by_operator_id);

create or replace function public.require_experience_collaborator_approval() returns trigger
language plpgsql set search_path to '' as $$
begin
  if new.review_status='pending' and old.review_status is distinct from 'pending' then
    if exists (select 1 from public.experience_operators eo where eo.experience_id=new.id and eo.role='participant' and eo.approval_status <> 'accepted') then
      raise exception 'Tutti gli operatori partner devono approvare la collaborazione prima dell''invio a BIMARIS';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists require_experience_collaborator_approval on public.experiences;
create trigger require_experience_collaborator_approval before update of review_status on public.experiences
for each row execute function public.require_experience_collaborator_approval();

-- Normalized activity taxonomy ----------------------------------------------
create table if not exists public.experience_activities (
  key text primary key,
  label text not null unique,
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);
insert into public.experience_activities(key,label,active,sort_order) values
 ('trekking','Trekking',true,10),('yoga','Yoga',true,20),('wine-tasting','Degustazione vini',true,30),
 ('food-tasting','Degustazione gastronomica',true,40),('cooking','Cucina',true,50),('guided-visit','Visita guidata',true,60),
 ('workshop','Laboratorio',true,70),('boat','Escursione in barca',true,80),('cycling','Ciclismo',true,90),('horse-riding','Equitazione',true,100)
on conflict (key) do update set label=excluded.label,active=excluded.active,sort_order=excluded.sort_order;

create table if not exists public.experience_activity_links (
  experience_id uuid not null references public.experiences(id) on delete cascade,
  activity_key text not null references public.experience_activities(key),
  operator_id uuid not null references public.operators(id),
  created_at timestamptz not null default now(),
  primary key(experience_id,activity_key,operator_id)
);
create index if not exists experience_activity_links_activity_idx on public.experience_activity_links(activity_key);
create index if not exists experience_activity_links_operator_idx on public.experience_activity_links(operator_id);
alter table public.experience_activities enable row level security;
alter table public.experience_activity_links enable row level security;
drop policy if exists "public read active experience activities" on public.experience_activities;
create policy "public read active experience activities" on public.experience_activities for select to anon,authenticated using(active=true);

drop policy if exists "public read published experience activity links" on public.experience_activity_links;
create policy "public read published experience activity links" on public.experience_activity_links for select to anon,authenticated using (
  exists(select 1 from public.experiences e where e.id=experience_activity_links.experience_id and e.published=true and e.review_status='approved')
  or exists(select 1 from public.experiences e join public.operator_memberships m on m.operator_id=e.operator_id where e.id=experience_activity_links.experience_id and m.user_id=(select auth.uid()))
  or exists(select 1 from public.operator_memberships m where m.operator_id=experience_activity_links.operator_id and m.user_id=(select auth.uid()))
);
drop policy if exists "editor manages experience activity links" on public.experience_activity_links;
create policy "editor manages experience activity links" on public.experience_activity_links for insert to authenticated with check (
  exists(select 1 from public.experiences e join public.operator_memberships m on m.operator_id=e.operator_id where e.id=experience_activity_links.experience_id and m.user_id=(select auth.uid()))
);
drop policy if exists "editor removes experience activity links" on public.experience_activity_links;
create policy "editor removes experience activity links" on public.experience_activity_links for delete to authenticated using (
  exists(select 1 from public.experiences e join public.operator_memberships m on m.operator_id=e.operator_id where e.id=experience_activity_links.experience_id and m.user_id=(select auth.uid()))
);

-- Event import / verification -------------------------------------------------
create table if not exists public.event_import_batches (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id) on delete cascade,
  submitted_by uuid not null,
  source_type text not null default 'whatsapp',
  raw_text text not null,
  status text not null default 'pending' check(status=any(array['pending'::text,'parsed'::text,'reviewed'::text,'rejected'::text])),
  parsed_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists event_import_batches_operator_created_idx on public.event_import_batches(operator_id,created_at desc);
alter table public.event_import_batches enable row level security;
revoke all on public.event_import_batches from anon,authenticated;

alter table public.events add column if not exists source_type text;
alter table public.events add column if not exists source_label text;
alter table public.events add column if not exists source_url text;
alter table public.events add column if not exists verification_status text not null default 'verified';
alter table public.events add column if not exists import_batch_id uuid references public.event_import_batches(id) on delete set null;
alter table public.events add column if not exists metadata jsonb not null default '{}'::jsonb;
do $$ begin
  if not exists (select 1 from pg_constraint where conname='events_verification_status_check') then
    alter table public.events add constraint events_verification_status_check check(verification_status=any(array['pending'::text,'verified'::text,'rejected'::text]));
  end if;
end $$;
create index if not exists events_import_batch_idx on public.events(import_batch_id);
create index if not exists events_verification_starts_idx on public.events(verification_status,starts_at);

-- Keep event imports and B2B data server/owner controlled; no broad public write policies.
