-- Migration 037: explicit environment-local Supabase URL; 036 remains unchanged.
-- Corrective migration: approval of an already-approved experience revision
-- must not require publication or commercial selection of its operator.
-- Retain all existing revision, ownership, data and media integrity checks.
-- Deployment requires explicit technical authorization and staging verification.
-- Staging consolidation: preserve a single selected cover when applying operator revisions.
-- The legacy before-insert trigger may assign a cover to the first inserted photo.
-- Import the selected cover first, then normalize cover flags in the same transaction.
-- This migration mirrors the function tested in Supabase staging.
CREATE OR REPLACE FUNCTION public.admin_apply_experience_revision(p_revision_id uuid, p_review_notes text DEFAULT NULL::text)
 RETURNS TABLE(experience_id uuid, experience_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
 v_revision public.experience_revisions%rowtype;
 v_experience public.experiences%rowtype;
 v_operator public.operators%rowtype;
 v_content jsonb;
 v_name text;
 v_excerpt text;
 v_description text;
 v_duration_minutes integer;
 v_price_from numeric;
 v_category_id uuid;
 v_territory_id uuid;
 v_now timestamptz := now();
 v_cover_path text;
 v_cover_alt text;
 v_storage_base_url text;
begin
 select * into v_revision from public.experience_revisions where id=p_revision_id for update;
 if not found or v_revision.status <> 'pending' then raise exception using errcode='P0001',message='invalid-review-state'; end if;
 select * into v_experience from public.experiences where id=v_revision.experience_id for update;
 if not found or v_experience.operator_id <> v_revision.operator_id or v_experience.review_status <> 'approved' then raise exception using errcode='P0001',message='invalid-source-state'; end if;
 select * into v_operator from public.operators where id=v_revision.operator_id;
 if not found then raise exception using errcode='P0001',message='invalid-source-state'; end if;
 v_content:=coalesce(v_revision.content,'{}'::jsonb);
 v_name:=nullif(left(trim(coalesce(v_content->>'name',v_experience.name,'')),200),'');
 if v_name is null then raise exception using errcode='P0001',message='invalid-data'; end if;
 v_excerpt:=case when v_content ? 'excerpt' then nullif(left(trim(coalesce(v_content->>'excerpt','')),300),'') else v_experience.excerpt end;
 v_description:=case when v_content ? 'description' then nullif(left(trim(coalesce(v_content->>'description','')),5000),'') else v_experience.description end;
 begin
  v_duration_minutes:=case when v_content ? 'duration_minutes' then case when nullif(v_content->>'duration_minutes','') is null then null else (v_content->>'duration_minutes')::integer end else v_experience.duration_minutes end;
  v_price_from:=case when v_content ? 'price_from' then case when nullif(v_content->>'price_from','') is null then null else (v_content->>'price_from')::numeric end else v_experience.price_from end;
  v_category_id:=case when v_content ? 'category_id' then nullif(v_content->>'category_id','')::uuid else v_experience.category_id end;
  v_territory_id:=case when v_content ? 'territory_id' then nullif(v_content->>'territory_id','')::uuid else v_experience.territory_id end;
 exception when invalid_text_representation or numeric_value_out_of_range then
  raise exception using errcode='P0001',message='invalid-data';
 end;
 if v_duration_minutes is not null and v_duration_minutes<=0 then raise exception using errcode='P0001',message='invalid-data'; end if;
 if v_price_from is not null and v_price_from<0 then raise exception using errcode='P0001',message='invalid-data'; end if;
 if v_category_id is not null and not exists(select 1 from public.categories where id=v_category_id) then raise exception using errcode='P0001',message='invalid-data'; end if;
 if v_territory_id is not null and not exists(select 1 from public.territories where id=v_territory_id) then raise exception using errcode='P0001',message='invalid-data'; end if;
 delete from public.experience_media where experience_media.experience_id=v_revision.experience_id;
 insert into public.experience_media(experience_id,storage_path,alt_text,sort_order,is_cover)
 select v_revision.experience_id,m.storage_path,m.alt_text,m.sort_order,m.is_cover from public.experience_revision_media m where m.revision_id=v_revision.id order by m.is_cover desc,m.sort_order;
 -- The legacy before-insert trigger assigns cover to the first imported row.
 -- Normalize all cover flags after the bulk import so only the selected row is marked.
 update public.experience_media em
 set is_cover=(em.id = (
   select chosen.id from public.experience_media chosen
   where chosen.experience_id=v_revision.experience_id
   order by (chosen.storage_path = (
      select rm.storage_path from public.experience_revision_media rm
      where rm.revision_id=v_revision.id
      order by rm.is_cover desc,rm.sort_order asc limit 1
   )) desc,chosen.sort_order asc,chosen.id asc limit 1
 ))
 where em.experience_id=v_revision.experience_id;

 select m.storage_path,m.alt_text into v_cover_path,v_cover_alt from public.experience_revision_media m where m.revision_id=v_revision.id order by m.is_cover desc,m.sort_order asc limit 1;
 v_storage_base_url:=nullif(trim(current_setting('app.settings.supabase_url',true)),'');
 if v_cover_path is not null and (v_storage_base_url is null or v_storage_base_url !~ '^https://[a-z0-9-]+[.]supabase[.]co/?$') then
   raise exception using errcode='P0001',message='storage-origin-not-configured';
 end if;
 update public.experiences set name=v_name,excerpt=v_excerpt,description=v_description,duration_minutes=v_duration_minutes,price_from=v_price_from,category_id=v_category_id,territory_id=v_territory_id,
 locality=case when v_content ? 'locality' then nullif(left(trim(coalesce(v_content->>'locality','')),120),'') else v_experience.locality end,
 meeting_point=case when v_content ? 'meeting_point' then nullif(left(trim(coalesce(v_content->>'meeting_point','')),250),'') else v_experience.meeting_point end,
 google_maps_place_id=case when v_content ? 'google_maps_place_id' then nullif(left(trim(coalesce(v_content->>'google_maps_place_id','')),250),'') else v_experience.google_maps_place_id end,
 location_kind=case when v_content ? 'location_kind' then nullif(v_content->>'location_kind','') else v_experience.location_kind end,
 latitude=case when v_content ? 'latitude' then nullif(v_content->>'latitude','')::numeric else v_experience.latitude end,
 longitude=case when v_content ? 'longitude' then nullif(v_content->>'longitude','')::numeric else v_experience.longitude end,
 territory_assignment_status=case when v_content ? 'territory_assignment_status' then nullif(v_content->>'territory_assignment_status','') else v_experience.territory_assignment_status end,
 territory_municipality_code=case when v_content ? 'territory_municipality_code' then nullif(v_content->>'territory_municipality_code','') else v_experience.territory_municipality_code end,
 image_url=case when v_cover_path is null then null else rtrim(v_storage_base_url,'/')||'/storage/v1/object/public/experience-media/'||v_cover_path end,image_alt=v_cover_alt,updated_at=v_now where id=v_revision.experience_id;
 update public.experience_revisions set status='applied',review_notes=nullif(left(trim(coalesce(p_review_notes,'')),2000),''),review_sections='{}'::jsonb,reviewed_at=v_now,applied_at=v_now,updated_at=v_now where id=v_revision.id;
 return query select v_revision.experience_id,v_name;
end;
$function$
;
