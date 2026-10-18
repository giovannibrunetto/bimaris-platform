alter table public.experiences
  add column if not exists draft_step integer;

update public.experiences
set draft_step = case
  when image_url is not null then 4
  when duration_minutes is not null then 3
  when description is not null and btrim(description) <> '' then 2
  when name is not null and btrim(name) <> '' then 1
  else 0
end
where draft_step is null;

alter table public.experiences
  alter column draft_step set default 0,
  alter column draft_step set not null;

alter table public.experiences
  drop constraint if exists experiences_draft_step_check;

alter table public.experiences
  add constraint experiences_draft_step_check
  check (draft_step between 0 and 4);

comment on column public.experiences.draft_step is
  'Ultimo passaggio del wizard esperienza salvato dall''operatore (0-4).';
