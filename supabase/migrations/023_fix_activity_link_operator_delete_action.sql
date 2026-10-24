alter table public.experience_activity_links
  drop constraint if exists experience_activity_links_operator_id_fkey;

alter table public.experience_activity_links
  add constraint experience_activity_links_operator_id_fkey
  foreign key (operator_id)
  references public.operators(id)
  on delete cascade;
