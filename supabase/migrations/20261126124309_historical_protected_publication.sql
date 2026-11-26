create or replace function public.manage_historical_editorial(
  p_action text, p_actor uuid, p_workspace uuid, p_entry uuid, p_version integer, p_data jsonb
) returns uuid language plpgsql set search_path to '' as $$
declare
  w public.editorial_workspaces;
  existing public.historical_editorial_stories;
  chapter jsonb;
  public_slug text;
begin
  if p_actor is null then raise exception 'editorial-invalid-actor'; end if;
  if p_action='create' then
    if p_entry is not null then
      select * into strict existing from public.historical_editorial_stories where id=p_entry;
    end if;
    insert into public.editorial_workspaces(model,entry_id,draft)
    values ('historical',p_entry,coalesce(existing.content,'{}'::jsonb))
    on conflict (model,entry_id) do nothing returning * into w;
    if w.id is null then
      select * into strict w from public.editorial_workspaces where model='historical' and entry_id=p_entry;
      return w.id;
    end if;
  else
    select * into strict w from public.editorial_workspaces where id=p_workspace and model='historical' for update;
    if w.archived or w.version is distinct from p_version then raise exception 'editorial-conflict'; end if;
    if w.entry_id is not null then
      select * into strict existing from public.historical_editorial_stories where id=w.entry_id for update;
      if existing.protected then
        if p_action in ('withdraw','archive') then raise exception 'editorial-protected'; end if;
        if p_action='publish' and p_data->'confirmed' is distinct from 'true'::jsonb then
          raise exception 'editorial-confirmation-required';
        end if;
      end if;
    end if;
    case p_action
      when 'save' then
        w.draft := w.draft || jsonb_build_object('title',p_data->'title','subtitle',p_data->'subtitle',
          'theme',p_data->'theme','intro',p_data->'intro','chapters',p_data->'chapters','conclusion',p_data->'conclusion');
        if p_data ? 'sources' then
          w.draft := jsonb_set(w.draft,'{sources}',p_data->'sources');
        end if;
        if p_data ? 'cover' then
          perform public.validate_editorial_cover(p_data->'cover');
          w.draft := jsonb_set(w.draft,'{cover}',p_data->'cover');
        end if;
      when 'publish' then
        if nullif(btrim(w.draft->>'title'),'') is null or nullif(btrim(w.draft->>'subtitle'),'') is null
          or nullif(btrim(w.draft->>'theme'),'') is null
          or coalesce(jsonb_array_length(w.draft->'intro'),0)=0
          or coalesce(jsonb_array_length(w.draft->'chapters'),0)=0
          or coalesce(jsonb_array_length(w.draft->'conclusion'),0)=0 then
          raise exception 'editorial-fields-required';
        end if;
        for chapter in select value from jsonb_array_elements(w.draft->'chapters') loop
          if nullif(btrim(chapter->>'title'),'') is null or coalesce(jsonb_array_length(chapter->'paragraphs'),0)=0 then
            raise exception 'editorial-fields-required';
          end if;
          if nullif(chapter->>'slug','') is not null and not exists (
            select 1 from public.culture_entries where published and slug=chapter->>'slug'
          ) then raise exception 'editorial-invalid-culture-link'; end if;
        end loop;
        public_slug := coalesce(existing.slug,p_data->>'slug');
        if public_slug is null or public_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'editorial-invalid-slug'; end if;
        if w.entry_id is null then
          insert into public.historical_editorial_stories(slug,published,content)
          values(public_slug,true,w.draft || jsonb_build_object('key',public_slug)) returning id into w.entry_id;
        else
          update public.historical_editorial_stories
          set content=w.draft || jsonb_build_object('key',public_slug),published=true where id=w.entry_id;
        end if;
      when 'withdraw','archive' then
        update public.historical_editorial_stories set published=false where id=w.entry_id;
        w.archived := p_action='archive';
      else raise exception 'editorial-invalid-action';
    end case;
    update public.editorial_workspaces set draft=w.draft,entry_id=w.entry_id,
      archived=w.archived,version=w.version+1 where id=w.id returning * into w;
  end if;
  insert into public.editorial_activity(workspace_id,actor,action,version) values(w.id,p_actor,p_action,w.version);
  return w.id;
end $$;
revoke all on function public.manage_historical_editorial(text,uuid,uuid,uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.manage_historical_editorial(text,uuid,uuid,uuid,integer,jsonb) to service_role;
