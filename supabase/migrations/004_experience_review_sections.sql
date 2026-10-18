alter table public.experiences
  add column if not exists review_sections jsonb not null default '{}'::jsonb;

comment on column public.experiences.review_sections is
  'Correzioni richieste da BIMARIS raggruppate per sezione del wizard esperienza.';
