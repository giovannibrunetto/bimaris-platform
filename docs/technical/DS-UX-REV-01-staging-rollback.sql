-- DS-UX-REV-01: rollback candidate. Use only with explicit rollback authorization.
-- Captured from BIMARIS Staging BEFORE any taxonomy migration, 2026-11-13.
BEGIN;
DROP TRIGGER IF EXISTS bimaris_apply_revision_taxonomy_on_approval ON public.experience_revisions;
DROP FUNCTION IF EXISTS public.bimaris_apply_revision_taxonomy();
DROP FUNCTION IF EXISTS public.bimaris_revision_taxonomy_ready();
CREATE OR REPLACE FUNCTION public.guard_noop_experience_revision_submission()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_experience public.experiences%rowtype;
  v_content_same boolean;
  v_media_same boolean;
begin
  if new.status <> 'pending' or old.status = 'pending' then return new; end if;
  select * into v_experience from public.experiences where id = new.experience_id;
  if not found then return new; end if;

  v_content_same :=
    coalesce(new.content->>'name','') = coalesce(v_experience.name,'') and
    coalesce(new.content->>'excerpt','') = coalesce(v_experience.excerpt,'') and
    coalesce(new.content->>'description','') = coalesce(v_experience.description,'') and
    (case when nullif(new.content->>'duration_minutes','') is null then v_experience.duration_minutes is null else (new.content->>'duration_minutes')::integer is not distinct from v_experience.duration_minutes end) and
    (case when nullif(new.content->>'price_from','') is null then v_experience.price_from is null else (new.content->>'price_from')::numeric is not distinct from v_experience.price_from end) and
    (case when nullif(new.content->>'territory_id','') is null then v_experience.territory_id is null else (new.content->>'territory_id')::uuid is not distinct from v_experience.territory_id end);

  select not exists (
    (select storage_path, sort_order, is_cover from public.experience_revision_media where revision_id = new.id
     except select storage_path, sort_order, is_cover from public.experience_media where experience_id = new.experience_id)
    union all
    (select storage_path, sort_order, is_cover from public.experience_media where experience_id = new.experience_id
     except select storage_path, sort_order, is_cover from public.experience_revision_media where revision_id = new.id)
  ) into v_media_same;

  if v_content_same and v_media_same then
    raise exception 'La proposta non contiene modifiche rispetto alla versione online';
  end if;
  return new;
end;
$function$

COMMIT;
