create or replace function public.save_village_editorial(
  p_actor uuid, p_workspace uuid, p_version integer, p_data jsonb, p_cover jsonb
) returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare saved uuid;
begin
  if p_cover is not null then
    if jsonb_typeof(p_cover) <> 'object'
       or coalesce(p_cover->>'id','') !~ '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$'
       or nullif(btrim(p_cover->>'alt'),'') is null
       or not exists (select 1 from storage.objects where bucket_id='editorial-media' and name=p_cover->>'id') then
      raise exception 'editorial-invalid-cover';
    end if;
  end if;
  -- Existing function enforces model, workspace version, archived state and audit.
  saved := public.manage_other_editorial('village','save',p_actor,p_workspace,null,p_version,p_data);
  if p_cover is not null then
    -- Previous draft cover stays in private Storage; never remove a published asset.
    -- The previous call holds the workspace row lock until this transaction ends.
    update public.editorial_workspaces
      set draft=jsonb_set(draft,'{photos}','[]'::jsonb)
      where id=saved and model='village' and version=p_version+1;
    if not found then raise exception 'editorial-conflict'; end if;
    saved := public.manage_other_editorial('village','photo',p_actor,saved,null,p_version+1,p_cover);
  end if;
  return saved;
end $$;
revoke all on function public.save_village_editorial(uuid,uuid,integer,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.save_village_editorial(uuid,uuid,integer,jsonb,jsonb) to service_role;
