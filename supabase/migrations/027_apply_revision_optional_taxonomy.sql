-- Final revision-apply function validated on Staging.
-- Keeps optional taxonomy nullable and safely replaces live media.
create or replace function public.admin_apply_experience_revision(p_revision_id uuid,p_review_notes text default null::text)
returns table(experience_id uuid,experience_name text)
language plpgsql security definer set search_path to 'public' as $$
declare
 r public.experience_revisions%rowtype; e public.experiences%rowtype; o public.operators%rowtype;
 c jsonb; n text; x text; d text; mins integer; price numeric; cat uuid; territory uuid;
 ts timestamptz:=now(); cover_path text; cover_alt text;
begin
 select * into r from public.experience_revisions where id=p_revision_id for update;
 if not found or r.status<>'pending' then raise exception using errcode='P0001',message='invalid-review-state'; end if;
 select * into e from public.experiences where id=r.experience_id for update;
 if not found or e.operator_id<>r.operator_id or e.review_status<>'approved' then raise exception using errcode='P0001',message='invalid-source-state'; end if;
 select * into o from public.operators where id=r.operator_id;
 if not found or o.published is not true or o.selection_status<>'selected' then raise exception using errcode='P0001',message='invalid-source-state'; end if;
 c:=coalesce(r.content,'{}'::jsonb);
 n:=nullif(left(trim(coalesce(c->>'name',e.name,'')),200),'');
 if n is null then raise exception using errcode='P0001',message='invalid-data'; end if;
 x:=case when c?'excerpt' then nullif(left(trim(coalesce(c->>'excerpt','')),300),'') else e.excerpt end;
 d:=case when c?'description' then nullif(left(trim(coalesce(c->>'description','')),5000),'') else e.description end;
 begin
  mins:=case when c?'duration_minutes' then case when nullif(c->>'duration_minutes','') is null then null else (c->>'duration_minutes')::integer end else e.duration_minutes end;
  price:=case when c?'price_from' then case when nullif(c->>'price_from','') is null then null else (c->>'price_from')::numeric end else e.price_from end;
  cat:=case when c?'category_id' then nullif(c->>'category_id','')::uuid else e.category_id end;
  territory:=case when c?'territory_id' then nullif(c->>'territory_id','')::uuid else e.territory_id end;
 exception when invalid_text_representation or numeric_value_out_of_range then raise exception using errcode='P0001',message='invalid-data'; end;
 if mins is not null and mins<=0 then raise exception using errcode='P0001',message='invalid-data'; end if;
 if price is not null and price<0 then raise exception using errcode='P0001',message='invalid-data'; end if;
 if cat is not null and not exists(select 1 from public.categories where id=cat) then raise exception using errcode='P0001',message='invalid-data'; end if;
 if territory is not null and not exists(select 1 from public.territories where id=territory) then raise exception using errcode='P0001',message='invalid-data'; end if;
 delete from public.experience_media where experience_media.experience_id=r.experience_id;
 insert into public.experience_media(experience_id,storage_path,alt_text,sort_order,is_cover)
 select r.experience_id,m.storage_path,m.alt_text,m.sort_order,m.is_cover from public.experience_revision_media m where m.revision_id=r.id order by m.sort_order;
 select m.storage_path,m.alt_text into cover_path,cover_alt from public.experience_revision_media m where m.revision_id=r.id order by m.is_cover desc,m.sort_order asc limit 1;
 update public.experiences set name=n,excerpt=x,description=d,duration_minutes=mins,price_from=price,category_id=cat,territory_id=territory,image_url=case when cover_path is null then null else 'https://nzdeoimwikhoidtladnu.supabase.co/storage/v1/object/public/experience-media/'||cover_path end,image_alt=cover_alt,updated_at=ts where id=r.experience_id;
 update public.experience_revisions set status='applied',review_notes=nullif(left(trim(coalesce(p_review_notes,'')),2000),''),review_sections='{}'::jsonb,reviewed_at=ts,applied_at=ts,updated_at=ts where id=r.id;
 return query select r.experience_id,n;
end; $$;
