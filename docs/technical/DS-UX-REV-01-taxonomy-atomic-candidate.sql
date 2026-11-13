-- DS-UX-REV-01: SQL CANDIDATE ONLY. DO NOT APPLY WITHOUT DS AUTHORISATION.
-- Reviewed against Staging schema 2026-11-13. Not yet executed anywhere.
-- The readiness RPC is fail-closed: it returns true only while the expected
-- revision-trigger installation exists, is enabled, and targets the approved handler.
-- The original two- and three-argument admin_apply_experience_revision RPCs remain unchanged.

create or replace function public.bimaris_revision_taxonomy_ready()
returns boolean language sql stable security invoker
set search_path = '' as $
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
$;
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

-- Mandatory validation in isolated Staging transaction:
-- (1) legacy revision: no keys -> no taxonomy changes;
-- (2) full snapshot: edits only after pending -> applied;
-- (3) wrong keys -> FK/validation error, whole RPC rolls back;
-- (4) concurrent live edits -> taxonomy-conflict error, whole RPC rolls back;
-- (5) collaboration rows and participant activity links remain untouched.
