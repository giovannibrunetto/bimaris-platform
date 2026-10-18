alter table public.experiences
  add column if not exists draft_step integer not null default 0
  check (draft_step between 0 and 4);

comment on column public.experiences.draft_step is
  'Ultimo passaggio del wizard esperienza salvato dall''operatore (0-4).';
