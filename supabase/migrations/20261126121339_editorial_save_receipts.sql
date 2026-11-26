alter table public.editorial_workspaces
  add column last_save_request uuid,
  add column last_save_actor uuid,
  add column last_save_digest text,
  add column last_save_version integer;

create or replace function public.save_editorial_draft(
  p_model text, p_actor uuid, p_workspace uuid, p_version integer,
  p_request uuid, p_digest text, p_data jsonb
) returns jsonb
language plpgsql security invoker set search_path = ''
as $$
declare
  w public.editorial_workspaces;
  saved_version integer;
begin
  select * into strict w from public.editorial_workspaces
    where id=p_workspace and model=p_model for update;

  if p_request is not null and w.last_save_request=p_request
    and w.last_save_actor=p_actor and w.last_save_digest=p_digest
    and w.last_save_version=w.version and p_version=w.version-1 then
    return jsonb_build_object('version',w.version,'replayed',true);
  end if;
  if w.version is distinct from p_version then raise exception 'editorial-conflict'; end if;

  case p_model
    when 'culture' then perform public.manage_culture_editorial('save',p_actor,p_workspace,null,p_version,p_data);
    when 'historical' then perform public.manage_historical_editorial('save',p_actor,p_workspace,null,p_version,p_data);
    else perform public.manage_other_editorial(p_model,'save',p_actor,p_workspace,null,p_version,p_data);
  end case;
  update public.editorial_workspaces
    set last_save_request=p_request, last_save_actor=p_actor, last_save_digest=p_digest,
        last_save_version=version
    where id=p_workspace returning version into strict saved_version;
  return jsonb_build_object('version',saved_version,'replayed',false);
end $$;
revoke all on function public.save_editorial_draft(text,uuid,uuid,integer,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.save_editorial_draft(text,uuid,uuid,integer,uuid,text,jsonb) to service_role;
