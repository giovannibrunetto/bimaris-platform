-- DS-UX-REV-01: SQL CANDIDATE ONLY. DO NOT APPLY WITHOUT DS AUTHORISATION.
-- Reviewed against Staging schema 2026-11-13. Not yet executed anywhere.
-- The readiness RPC is fail-closed: it returns true only while the expected
-- revision-trigger installation exists, is enabled, and targets the approved handler.
-- The original two- and three-argument admin_apply_experience_revision RPCs remain unchanged.

create or replace function public.bimaris_revision_taxonomy_ready()
returns boolean language sql stable security invoker
set search_path = '' as $$
 select exists (
   select 1
   from pg_catalog.pg_trigger t
   join pg_catalog.pg_proc p on p.oid = t.tgfoid
   join pg_catalog.pg_namespace n on n.oid = p.pronamespace
   where t.tgrelid = 'public.experience_revisions'::pg_catalog.regclass
     and t.tgname = 'bimaris_apply_revision_taxonomy_on_approval'
     and t.tgenabled = 'O'
     and not t.tgisinternal
     and n.nspname = 'public'
     and p.proname = 'bimaris_apply_revision_taxonomy'
 );
$$;
revoke all on function public.bimaris_revision_taxonomy_ready() from public, anon, authenticated;
grant execute on function public.bimaris_revision_taxonomy_ready() to service_role;

create or replace function public.bimaris_apply_revision_taxonomy()
returns trigger language plpgsql security invoker
set search_path = '' as $function$
declare
 v_intents jsonb;
 v_activities jsonb;
 v_before jsonb;
 v_live jsonb;
 v_count integer;
 v_unique integer;
begin
 if old.status is not distinct from 'pending' and new.status='applied' then
  -- Legacy revisions have neither key; they continue to preserve existing taxonomy.
  if new.content ? 'interest_keys' or new.content ? 'activity_keys' then
   if not (new.content ? 'interest_keys' and new.content ? 'activity_keys'
           and new.content ? 'base_interest_keys' and new.content ? 'base_activity_keys')
   then raise exception using errcode='P0001',message='taxonomy-snapshot-incomplete'; end if;
   v_intents := new.content->'interest_keys';
   v_activities := new.content->'activity_keys';
   if jsonb_typeof(v_intents)<>'array' or jsonb_typeof(v_activities)<>'array'
      or jsonb_typeof(new.content->'base_interest_keys')<>'array'
      or jsonb_typeof(new.content->'base_activity_keys')<>'array'
   then raise exception using errcode='P0001',message='taxonomy-invalid-data'; end if;

   select count(*),count(distinct x.value) into v_count,v_unique
   from jsonb_array_elements(v_intents) x(value);
   if v_count<1 or v_count>3 or v_count<>v_unique or exists(
     select 1 from jsonb_array_elements(v_intents) x(value)
     where jsonb_typeof(x.value)<>'string' or trim(x.value #>> '{}')=''
   ) then raise exception using errcode='P0001',message='taxonomy-invalid-interests'; end if;

   select count(*),count(distinct x.value) into v_count,v_unique
   from jsonb_array_elements(v_activities) x(value);
   if v_count<1 or v_count>25 or v_count<>v_unique or exists(
     select 1 from jsonb_array_elements(v_activities) x(value)
     where jsonb_typeof(x.value)<>'string' or trim(x.value #>> '{}')=''
   ) then raise exception using errcode='P0001',message='taxonomy-invalid-activities'; end if;

   select coalesce(jsonb_agg(i.intent_key order by i.intent_key),'[]'::jsonb)
   into v_live from public.experience_discovery_intents i where i.experience_id=new.experience_id;
   select coalesce(jsonb_agg(x.value order by x.value),'[]'::jsonb)
   into v_before from jsonb_array_elements_text(new.content->'base_interest_keys') x(value);
   if v_live<>v_before then raise exception using errcode='P0001',message='taxonomy-conflict-interests'; end if;

   select coalesce(jsonb_agg(a.activity_key order by a.activity_key),'[]'::jsonb)
   into v_live from public.experience_activity_links a
   where a.experience_id=new.experience_id and a.operator_id=new.operator_id;
   select coalesce(jsonb_agg(x.value order by x.value),'[]'::jsonb)
   into v_before from jsonb_array_elements_text(new.content->'base_activity_keys') x(value);
   if v_live<>v_before then raise exception using errcode='P0001',message='taxonomy-conflict-activities'; end if;

   -- Changes occur in the same transaction as the administrator's RPC.
   -- Foreign keys validate each taxonomy key; any error rolls back the RPC.
   delete from public.experience_discovery_intents where experience_id=new.experience_id;
   insert into public.experience_discovery_intents(experience_id,intent_key,weight)
    select new.experience_id,x.value,1 from jsonb_array_elements_text(v_intents) x(value);

   delete from public.experience_activity_links
    where experience_id=new.experience_id and operator_id=new.operator_id;
   insert into public.experience_activity_links(experience_id,activity_key,operator_id)
    select new.experience_id,x.value,new.operator_id
    from jsonb_array_elements_text(v_activities) x(value);
  end if;
 end if;
 return new;
end;
$function$;
revoke all on function public.bimaris_apply_revision_taxonomy() from public, anon, authenticated;

drop trigger if exists bimaris_apply_revision_taxonomy_on_approval on public.experience_revisions;
create trigger bimaris_apply_revision_taxonomy_on_approval
after update of status on public.experience_revisions
for each row when (old.status='pending' and new.status='applied')
execute function public.bimaris_apply_revision_taxonomy();

-- Existing Staging guard_noop_experience_revision_submission() only considers
-- primary fields and media. Without this coordinated replacement, legitimate
-- taxonomy-only revisions would be rejected before the approval workflow.
-- This replacement extends only the no-op condition, retaining its existing
-- content and gallery comparisons.
create or replace function public.guard_noop_experience_revision_submission()
returns trigger language plpgsql security invoker
set search_path = '' as $guard$
declare
 v_experience public.experiences%rowtype;
 v_content_same boolean;
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

 if v_content_same and v_media_same and v_intents_same and v_activities_same
 then raise exception 'La proposta non contiene modifiche rispetto alla versione online'; end if;
 return new;
end;
$guard$;

-- Mandatory validation in isolated Staging transaction:
-- (1) legacy revision: no keys -> no taxonomy changes;
-- (2) full snapshot: edits only after pending -> applied;
-- (3) wrong keys -> FK/validation error, whole RPC rolls back;
-- (4) concurrent live edits -> taxonomy-conflict error, whole RPC rolls back;
-- (5) collaboration rows and participant activity links remain untouched.
