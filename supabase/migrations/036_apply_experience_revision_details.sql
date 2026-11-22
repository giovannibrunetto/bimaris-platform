CREATE OR REPLACE FUNCTION public.guard_noop_experience_revision_submission()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
 v_experience public.experiences%rowtype;
 v_content_same boolean;
 v_profile_same boolean := true;
 v_profile jsonb;
 v_media_same boolean;
 v_intents_same boolean := true;
 v_activities_same boolean := true;
begin
 if new.status <> 'pending' or old.status='pending' then return new; end if;
 select * into v_experience from public.experiences where id=new.experience_id;
 if not found then return new; end if;
 v_content_same :=
    coalesce(new.content->>'name','')=coalesce(v_experience.name,'') and
    coalesce(new.content->>'excerpt','')=coalesce(v_experience.excerpt,'') and
    coalesce(new.content->>'description','')=coalesce(v_experience.description,'') and
    (case when nullif(new.content->>'duration_minutes','') is null
          then v_experience.duration_minutes is null
          else (new.content->>'duration_minutes')::integer is not distinct from v_experience.duration_minutes end) and
    (case when nullif(new.content->>'price_from','') is null
          then v_experience.price_from is null
          else (new.content->>'price_from')::numeric is not distinct from v_experience.price_from end) and
    (case when nullif(new.content->>'territory_id','') is null
          then v_experience.territory_id is null
          else (new.content->>'territory_id')::uuid is not distinct from v_experience.territory_id end);

 select not exists (
  (select storage_path,sort_order,is_cover from public.experience_revision_media where revision_id=new.id
   except select storage_path,sort_order,is_cover from public.experience_media where experience_id=new.experience_id)
  union all
  (select storage_path,sort_order,is_cover from public.experience_media where experience_id=new.experience_id
   except select storage_path,sort_order,is_cover from public.experience_revision_media where revision_id=new.id)
 ) into v_media_same;

 -- Compare sets, not array order: reordering equivalent selections is a no-op.
 -- Malformed payloads are rejected during the atomic approval trigger.
 if new.content ? 'interest_keys' then
  if jsonb_typeof(new.content->'interest_keys') <> 'array'
  then raise exception using errcode='P0001',message='taxonomy-invalid-interests'; end if;
  select not exists(
   (select value from jsonb_array_elements_text(new.content->'interest_keys') x(value)
    except select intent_key from public.experience_discovery_intents where experience_id=new.experience_id)
   union all
   (select intent_key from public.experience_discovery_intents where experience_id=new.experience_id
    except select value from jsonb_array_elements_text(new.content->'interest_keys') x(value))
  ) into v_intents_same;
 end if;
 if new.content ? 'activity_keys' then
  if jsonb_typeof(new.content->'activity_keys') <> 'array'
  then raise exception using errcode='P0001',message='taxonomy-invalid-activities'; end if;
  select not exists(
   (select value from jsonb_array_elements_text(new.content->'activity_keys') x(value)
    except select activity_key from public.experience_activity_links where experience_id=new.experience_id and operator_id=new.operator_id)
   union all
   (select activity_key from public.experience_activity_links where experience_id=new.experience_id and operator_id=new.operator_id
    except select value from jsonb_array_elements_text(new.content->'activity_keys') x(value))
  ) into v_activities_same;
 end if;

 if new.content ? 'discovery_profile' then
  select to_jsonb(p) into v_profile from public.experience_discovery_profiles p
  where p.experience_id=new.experience_id;
  v_profile_same := coalesce(
   (v_profile - 'booking_cutoff_time') @> ((new.content->'discovery_profile') - 'booking_cutoff_time'), false
  ) and (v_profile->>'booking_cutoff_time')::time is not distinct from (new.content->'discovery_profile'->>'booking_cutoff_time')::time;
 end if;

 if v_content_same and v_media_same and v_intents_same and v_activities_same and v_profile_same
 then raise exception 'La proposta non contiene modifiche rispetto alla versione online'; end if;
 return new;
end;
$function$;

-- Apply proposal-only fields in the same transaction as approval.
create or replace function public.apply_experience_revision_details()
returns trigger language plpgsql set search_path = public as $$
declare
  profile jsonb := new.content->'discovery_profile';
begin
  if profile is not null then
    insert into public.experience_discovery_profiles(
      experience_id, booking_requirement, booking_notice_hours, booking_cutoff_day_offset,
      booking_cutoff_time, weather_dependency, weather_constraints
    ) values (
      new.experience_id, profile->>'booking_requirement', (profile->>'booking_notice_hours')::integer,
      (profile->>'booking_cutoff_day_offset')::integer, (profile->>'booking_cutoff_time')::time,
      profile->>'weather_dependency', array(select jsonb_array_elements_text(profile->'weather_constraints'))
    )
    on conflict (experience_id) do update set
      booking_requirement=excluded.booking_requirement, booking_notice_hours=excluded.booking_notice_hours,
      booking_cutoff_day_offset=excluded.booking_cutoff_day_offset, booking_cutoff_time=excluded.booking_cutoff_time,
      weather_dependency=excluded.weather_dependency, weather_constraints=excluded.weather_constraints,
      updated_at=now();
  end if;

  return new;
end;
$$;

drop trigger if exists apply_experience_revision_details on public.experience_revisions;
create trigger apply_experience_revision_details
after update of status on public.experience_revisions
for each row when (old.status = 'pending' and new.status = 'applied')
execute function public.apply_experience_revision_details();

