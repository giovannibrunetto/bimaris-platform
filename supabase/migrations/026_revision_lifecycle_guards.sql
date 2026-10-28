-- Revision lifecycle guards validated on Staging.

alter table public.experience_revision_media
  drop constraint if exists experience_revision_media_source_media_id_fkey;
alter table public.experience_revision_media
  add constraint experience_revision_media_source_media_id_fkey
  foreign key (source_media_id) references public.experience_media(id) on delete set null;

create or replace function public.initialize_experience_revision_from_live_source()
returns trigger language plpgsql set search_path to 'public' as $$
declare v_experience public.experiences%rowtype;
begin
  if new.status <> 'draft' then return new; end if;
  select * into v_experience from public.experiences where id = new.experience_id;
  if not found or v_experience.operator_id <> new.operator_id then return new; end if;
  if v_experience.published is true and v_experience.review_status = 'approved' then
    new.content := jsonb_build_object(
      'name',v_experience.name,'excerpt',v_experience.excerpt,
      'description',v_experience.description,'duration_minutes',v_experience.duration_minutes,
      'price_from',v_experience.price_from,'territory_id',v_experience.territory_id
    );
  end if;
  return new;
end; $$;

drop trigger if exists initialize_experience_revision_from_live_source on public.experience_revisions;
create trigger initialize_experience_revision_from_live_source
before insert on public.experience_revisions for each row
execute function public.initialize_experience_revision_from_live_source();

create or replace function public.guard_noop_experience_revision_submission()
returns trigger language plpgsql set search_path to 'public' as $$
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
    (select storage_path,sort_order,is_cover from public.experience_revision_media where revision_id=new.id
     except select storage_path,sort_order,is_cover from public.experience_media where experience_id=new.experience_id)
    union all
    (select storage_path,sort_order,is_cover from public.experience_media where experience_id=new.experience_id
     except select storage_path,sort_order,is_cover from public.experience_revision_media where revision_id=new.id)
  ) into v_media_same;
  if v_content_same and v_media_same then
    raise exception 'La proposta non contiene modifiche rispetto alla versione online';
  end if;
  return new;
end; $$;

drop trigger if exists guard_noop_experience_revision_submission on public.experience_revisions;
create trigger guard_noop_experience_revision_submission
before update of status on public.experience_revisions for each row
execute function public.guard_noop_experience_revision_submission();
