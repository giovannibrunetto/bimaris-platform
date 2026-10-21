-- Keep revision application aligned with the editable fields in the operator wizard.
-- Classification is mandatory and duration/price are validated again at the database boundary.
create or replace function public.admin_apply_experience_revision(
 p_revision_id uuid, p_review_notes text default null
) returns table(experience_id uuid, experience_name text)
language plpgsql security definer set search_path=public
as $function$
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
begin
 select * into v_revision from public.experience_revisions where id=p_revision_id for update;
 if not found or v_revision.status <> 'pending' then raise exception using errcode='P0001',message='invalid-review-state'; end if;
 select * into v_experience from public.experiences where id=v_revision.experience_id for update;
 if not found or v_experience.operator_id <> v_revision.operator_id or v_experience.review_status <> 'approved' then raise exception using errcode='P0001',message='invalid-source-state'; end if;
 select * into v_operator from public.operators where id=v_revision.operator_id;
 if not found or v_operator.published is not true or v_operator.selection_status <> 'selected' then raise exception using errcode='P0001',message='invalid-source-state'; end if;
 v_content:=coalesce(v_revision.content,'{}'::jsonb);
 v_name:=nullif(left(trim(coalesce(v_content->>'name','')),200),'');
 if v_name is null then raise exception using errcode='P0001',message='invalid-data'; end if;
 v_excerpt:=nullif(left(trim(coalesce(v_content->>'excerpt','')),300),'');
 v_description:=nullif(left(trim(coalesce(v_content->>'description','')),5000),'');
 begin
  v_duration_minutes:=case when nullif(v_content->>'duration_minutes','') is null then null else (v_content->>'duration_minutes')::integer end;
  v_price_from:=case when nullif(v_content->>'price_from','') is null then null else (v_content->>'price_from')::numeric end;
  v_category_id:=nullif(v_content->>'category_id','')::uuid;
  v_territory_id:=nullif(v_content->>'territory_id','')::uuid;
 exception when invalid_text_representation or numeric_value_out_of_range then
  raise exception using errcode='P0001',message='invalid-data';
 end;
 if v_duration_minutes is not null and v_duration_minutes<=0 then raise exception using errcode='P0001',message='invalid-data'; end if;
 if v_price_from is not null and v_price_from<0 then raise exception using errcode='P0001',message='invalid-data'; end if;
 if v_category_id is null or v_territory_id is null then raise exception using errcode='P0001',message='invalid-data'; end if;
 if not exists(select 1 from public.categories where id=v_category_id) or not exists(select 1 from public.territories where id=v_territory_id) then raise exception using errcode='P0001',message='invalid-data'; end if;
 delete from public.experience_media where experience_media.experience_id=v_revision.experience_id;
 insert into public.experience_media(experience_id,storage_path,alt_text,sort_order,is_cover)
 select v_revision.experience_id,m.storage_path,m.alt_text,m.sort_order,m.is_cover
 from public.experience_revision_media m where m.revision_id=v_revision.id order by m.sort_order;
 select m.storage_path,m.alt_text into v_cover_path,v_cover_alt
 from public.experience_revision_media m where m.revision_id=v_revision.id
 order by m.is_cover desc,m.sort_order asc limit 1;
 update public.experiences set name=v_name,excerpt=v_excerpt,description=v_description,duration_minutes=v_duration_minutes,price_from=v_price_from,
 category_id=v_category_id,territory_id=v_territory_id,
 image_url=case when v_cover_path is null then null else 'https://vhvccwvcqdhiovpopsze.supabase.co/storage/v1/object/public/experience-media/'||v_cover_path end,
 image_alt=v_cover_alt,updated_at=v_now where id=v_revision.experience_id;
 update public.experience_revisions set status='applied',review_notes=nullif(left(trim(coalesce(p_review_notes,'')),2000),''),review_sections='{}'::jsonb,reviewed_at=v_now,applied_at=v_now,updated_at=v_now where id=v_revision.id;
 return query select v_revision.experience_id,v_name;
end;
$function$;
revoke all on function public.admin_apply_experience_revision(uuid,text) from public;
revoke all on function public.admin_apply_experience_revision(uuid,text) from anon;
revoke all on function public.admin_apply_experience_revision(uuid,text) from authenticated;
grant execute on function public.admin_apply_experience_revision(uuid,text) to service_role;
