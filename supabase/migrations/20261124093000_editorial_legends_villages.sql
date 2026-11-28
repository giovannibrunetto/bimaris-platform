alter table public.villages
  add column if not exists image_author text,
  add column if not exists image_license text,
  add column if not exists image_source_url text,
  add column if not exists image_license_url text;

create or replace function public.manage_other_editorial(
  p_model text, p_action text, p_actor uuid, p_workspace uuid, p_entry uuid, p_version integer, p_data jsonb
) returns uuid language plpgsql set search_path to '' as $$
declare
  w public.editorial_workspaces;
  source jsonb;
  model_table text;
  img jsonb;
  image_path text;
  loc jsonb;
  slug_value text;
  entry_is_public boolean;
begin
  case p_model
    when 'legend' then model_table := 'stories';
    when 'village' then model_table := 'villages';
    else raise exception 'editorial-invalid-model';
  end case;
  if p_action = 'create' then
    if p_entry is not null then
      execute format('select to_jsonb(t) from public.%I t where id=$1', model_table) into source using p_entry;
      if source is null then raise exception 'editorial-conflict'; end if;
    end if;
    insert into public.editorial_workspaces(model,entry_id,draft)
    values (p_model,p_entry,jsonb_build_object(
      'title',coalesce(source->>'title',source->>'name',''),
      'body',coalesce(source->>'body',source->>'description',''),
      'excerpt',source->>'excerpt','category',source->>'story_type',
      'history',source->>'history','identity',source->>'identity','thingsToSee',source->>'things_to_see',
      'location',jsonb_build_object('address',source->>'address','latitude',source->'latitude','longitude',source->'longitude'),
      'photos','[]'::jsonb))
    on conflict (model,entry_id) do nothing returning * into w;
    if w.id is null then
      select * into strict w from public.editorial_workspaces where model=p_model and entry_id=p_entry;
      if w.draft ? 'deletedAt' then raise exception 'editorial-conflict'; end if;
      return w.id;
    end if;
  else
    select * into strict w from public.editorial_workspaces where id=p_workspace and model=p_model for update;
    if w.version <> p_version or w.draft ? 'deletedAt' or (w.archived and p_action <> 'delete') then
      raise exception 'editorial-conflict';
    end if;
    case p_action
      when 'save' then w.draft := w.draft || (p_data - 'photos' - 'deletedAt');
      when 'photo' then
        if jsonb_array_length(w.draft->'photos') >= 1 then raise exception 'editorial-photo-limit'; end if;
        w.draft := jsonb_set(w.draft,'{photos}',jsonb_build_array(p_data));
      when 'publish' then
        if nullif(btrim(w.draft->>'title'),'') is null or nullif(btrim(w.draft->>'body'),'') is null then
          raise exception 'editorial-fields-required';
        end if;
        slug_value := p_data->>'slug';
        if w.entry_id is null then
          if slug_value is null or slug_value !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'editorial-invalid-slug'; end if;
          if p_model='legend' then
            insert into public.stories(slug,title) values(slug_value,w.draft->>'title') returning id into w.entry_id;
          else
            insert into public.villages(slug,name,google_maps_query) values(slug_value,w.draft->>'title',w.draft->>'title' || ', Messina') returning id into w.entry_id;
          end if;
        end if;
        img := w.draft->'photos'->0;
        image_path := case when img is not null then '/api/editoriale/immagini/' || (img->>'id') end;
        loc := w.draft->'location';
        if p_model='legend' then
          update public.stories set title=w.draft->>'title',body=w.draft->>'body',
            excerpt=coalesce(nullif(w.draft->>'excerpt',''),left(w.draft->>'body',240)),
            story_type=coalesce(nullif(w.draft->>'category',''),story_type),
            image_url=coalesce(image_path,image_url),image_alt=case when img is null then image_alt else img->>'alt' end,
            image_author=case when img is null then image_author else nullif(img->>'author','') end,
            image_license=case when img is null then image_license else nullif(img->>'license','') end,
            image_source_url=case when img is null then image_source_url else nullif(img->>'source','') end,
            image_license_url=case when img is null then image_license_url else nullif(img->>'licenseUrl','') end,
            published=true,updated_at=now() where id=w.entry_id;
          if img is not null then
            update public.story_images set is_primary=false where story_id=w.entry_id and is_primary;
            insert into public.story_images(id,story_id,image_url,alt_text,author,license,source_url,license_url,sort_order,is_primary)
            values ((img->>'id')::uuid,w.entry_id,image_path,img->>'alt',nullif(img->>'author',''),nullif(img->>'license',''),
              nullif(img->>'source',''),nullif(img->>'licenseUrl',''),0,true);
          end if;
        else
          update public.villages set name=w.draft->>'title',description=w.draft->>'body',
            excerpt=coalesce(nullif(w.draft->>'excerpt',''),left(w.draft->>'body',240)),
            history=nullif(w.draft->>'history',''),identity=nullif(w.draft->>'identity',''),things_to_see=nullif(w.draft->>'thingsToSee',''),
            address=nullif(loc->>'address',''),latitude=(loc->>'latitude')::double precision,longitude=(loc->>'longitude')::double precision,
            image_url=coalesce(image_path,image_url),image_alt=case when img is null then image_alt else img->>'alt' end,
            image_author=case when img is null then image_author else nullif(img->>'author','') end,
            image_license=case when img is null then image_license else nullif(img->>'license','') end,
            image_source_url=case when img is null then image_source_url else nullif(img->>'source','') end,
            image_license_url=case when img is null then image_license_url else nullif(img->>'licenseUrl','') end,
            published=true,updated_at=now() where id=w.entry_id;
        end if;
        w.draft := jsonb_set(w.draft,'{photos}','[]'::jsonb);
      when 'withdraw','archive' then
        execute format('update public.%I set published=false, updated_at=now() where id=$1',model_table) using w.entry_id;
        w.archived := p_action='archive';
      when 'delete' then
        execute format('select published from public.%I where id=$1',model_table) into entry_is_public using w.entry_id;
        if not w.archived or entry_is_public then raise exception 'editorial-conflict'; end if;
        w.draft := w.draft || jsonb_build_object('deletedAt',now());
      else raise exception 'editorial-invalid-action';
    end case;
    update public.editorial_workspaces set draft=w.draft,entry_id=w.entry_id,
      archived=w.archived,version=w.version+1 where id=w.id returning * into w;
  end if;
  insert into public.editorial_activity(workspace_id,actor,action,version)
    values(w.id,p_actor,p_action,w.version);
  return w.id;
end $$;
revoke all on function public.manage_other_editorial(text,text,uuid,uuid,uuid,integer,jsonb) from public, anon, authenticated;
grant execute on function public.manage_other_editorial(text,text,uuid,uuid,uuid,integer,jsonb) to service_role;
