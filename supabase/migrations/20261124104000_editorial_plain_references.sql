alter table public.culture_sources alter column url drop not null;

create or replace function public.publish_editorial_with_sources(
  p_model text, p_actor uuid, p_workspace uuid, p_version integer, p_data jsonb
) returns uuid language plpgsql set search_path to '' as $$
declare
  workspace_id uuid;
  entry uuid;
  items jsonb;
  source_table text;
  entry_column text;
begin
  case p_model
    when 'culture' then
      source_table := 'culture_sources';
      entry_column := 'culture_entry_id';
      workspace_id := public.manage_culture_editorial('publish',p_actor,p_workspace,null,p_version,p_data);
    when 'legend' then
      source_table := 'story_sources';
      entry_column := 'story_id';
      workspace_id := public.manage_other_editorial(p_model,'publish',p_actor,p_workspace,null,p_version,p_data);
    when 'village' then
      source_table := 'village_sources';
      entry_column := 'village_id';
      workspace_id := public.manage_other_editorial(p_model,'publish',p_actor,p_workspace,null,p_version,p_data);
    else raise exception 'editorial-invalid-model';
  end case;
  select entry_id,draft->'sources' into strict entry,items from public.editorial_workspaces where id=workspace_id;
  if items is null then return workspace_id; end if;
  if jsonb_typeof(items) <> 'array' or jsonb_array_length(items)>24 or exists (
    select 1 from jsonb_array_elements(items) item
    where nullif(btrim(item->>'label'),'') is null
       or (nullif(item->>'url','') is not null and item->>'url' !~* '^https?://')
  ) then raise exception 'editorial-invalid-sources'; end if;
  execute format('delete from public.%I where %I=$1',source_table,entry_column) using entry;
  execute format(
    'insert into public.%I (%I,label,url,source_type,note,sort_order)
     select $1,item->>''label'',nullif(item->>''url'',''''),nullif(item->>''source_type'',''''),
            nullif(item->>''note'',''''), position::smallint
     from jsonb_array_elements($2) with ordinality as list(item,position)',
    source_table,entry_column) using entry,items;
  return workspace_id;
end $$;
revoke all on function public.publish_editorial_with_sources(text,uuid,uuid,integer,jsonb) from public, anon, authenticated;
grant execute on function public.publish_editorial_with_sources(text,uuid,uuid,integer,jsonb) to service_role;
