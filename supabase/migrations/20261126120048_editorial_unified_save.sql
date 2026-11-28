create or replace function public.validate_editorial_cover(p_cover jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if jsonb_typeof(p_cover) is distinct from 'object'
    or nullif(btrim(p_cover->>'alt'),'') is null
    or (p_cover->>'url' is null and (
      coalesce(p_cover->>'id','') !~ '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$'
      or not exists (select 1 from storage.objects where bucket_id='editorial-media' and name=p_cover->>'id')
    ))
  then raise exception 'editorial-invalid-cover'; end if;
end $$;
revoke all on function public.validate_editorial_cover(jsonb) from public, anon, authenticated;
grant execute on function public.validate_editorial_cover(jsonb) to service_role;

CREATE OR REPLACE FUNCTION public.manage_culture_editorial(p_action text, p_actor uuid, p_workspace uuid, p_entry uuid, p_version integer, p_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
 w public.editorial_workspaces;
 c public.culture_entries;
 media jsonb;
 cover jsonb;
 media_id uuid;
 image_path text;
 generated_slug text;
 new_place jsonb;
 new_place_id uuid;
 maps_url text;
 location jsonb;
 lat numeric;
 lng numeric;
 location_address text;
begin
 if p_action = 'create' then
   if p_entry is not null then
     select * into strict c from public.culture_entries where id = p_entry;
     insert into public.editorial_workspaces(model,entry_id,draft)
     values ('culture',c.id,jsonb_build_object('title',c.title,'body',c.body,'placeId',c.place_id,'photos','[]'::jsonb))
     on conflict (model,entry_id) do nothing returning * into w;
     if w.id is null then
       select * into strict w from public.editorial_workspaces where model='culture' and entry_id=c.id;
       return w.id;
     end if;
   else
     insert into public.editorial_workspaces(model,draft)
     values ('culture','{"photos":[]}'::jsonb) returning * into w;
   end if;
 else
   select * into strict w from public.editorial_workspaces
    where id=p_workspace and model='culture' for update;
   if w.version is distinct from p_version or w.draft ? 'deletedAt' or (w.archived and p_action <> 'delete') then raise exception 'editorial-conflict'; end if;
   case p_action
   when 'save' then
     w.draft := w.draft || (p_data - 'photos' - 'cover' - 'galleryPhoto' - 'deletedAt');
     if p_data ? 'cover' then
       perform public.validate_editorial_cover(p_data->'cover');
       w.draft := jsonb_set(w.draft,'{cover}',p_data->'cover');
     end if;
     if p_data ? 'galleryPhoto' then
       perform public.validate_editorial_cover(p_data->'galleryPhoto');
       if coalesce(jsonb_array_length(w.draft->'photos'),0) >= 8 then raise exception 'editorial-photo-limit'; end if;
       w.draft := jsonb_set(w.draft,'{photos}',coalesce(w.draft->'photos','[]'::jsonb) || jsonb_build_array(p_data->'galleryPhoto'));
     end if;
   when 'photo' then
     perform public.validate_editorial_cover(p_data);
     w.draft := jsonb_set(w.draft,'{cover}',p_data);
   when 'publish' then
     if nullif(btrim(w.draft->>'title'),'') is null or nullif(btrim(w.draft->>'body'),'') is null
       then raise exception 'editorial-fields-required'; end if;
     new_place := w.draft->'newPlace';
     maps_url := nullif(coalesce(w.draft->>'mapsUrl', new_place->>'mapsUrl'), '');
     location := w.draft->'location';
     lat := (location->>'latitude')::numeric;
     lng := (location->>'longitude')::numeric;
     location_address := nullif(btrim(location->>'address'),'');
     if (lat is null) <> (lng is null) or abs(lat) > 90 or abs(lng) > 180 then
       raise exception 'editorial-fields-required';
     end if;
     if lat is not null then
       maps_url := null;
       w.draft := (w.draft - 'newPlace') || jsonb_build_object('mapsUrl', '');
     end if;
     if nullif(w.draft->>'placeId','') is null then
       if maps_url is null and lat is null then raise exception 'editorial-fields-required'; end if;
       insert into public.places (name, address, google_maps_query, slug, latitude, longitude)
       values (coalesce(nullif(new_place->>'name',''), w.draft->>'title'), coalesce(location_address, nullif(new_place->>'address','')), maps_url, 'cultura-' || w.id::text || '-' || w.version::text, lat, lng)
       returning id into new_place_id;
       w.draft := (w.draft - 'newPlace') || jsonb_build_object('placeId', new_place_id);
     end if;
     if nullif(w.draft->>'placeId','') is null then raise exception 'editorial-fields-required'; end if;
     if w.entry_id is null then
       generated_slug := trim(both '-' from regexp_replace(lower(p_data->>'slug'),'[^a-z0-9]+','-','g'));
       if generated_slug is null or generated_slug = '' then raise exception 'editorial-invalid-slug'; end if;
       insert into public.culture_entries(place_id,slug,title,body,excerpt,category,published,google_maps_url,editorial_latitude,editorial_longitude,editorial_address)
       values ((w.draft->>'placeId')::uuid,generated_slug,w.draft->>'title',w.draft->>'body',
         left(w.draft->>'body',240),'monumento',true,maps_url,lat,lng,location_address) returning id into w.entry_id;
     else
       update public.culture_entries set title=w.draft->>'title', body=w.draft->>'body',
         place_id=(w.draft->>'placeId')::uuid,google_maps_url=maps_url,editorial_latitude=coalesce(lat,editorial_latitude),
         editorial_longitude=coalesce(lng,editorial_longitude),editorial_address=coalesce(location_address,editorial_address),published=true,updated_at=now() where id=w.entry_id;
     end if;
     cover := w.draft->'cover';
     if cover is null and not exists (
       select 1 from public.culture_entries where id=w.entry_id and image_url is not null
       union all
       select 1 from public.culture_images where culture_entry_id=w.entry_id
     ) then
       cover := w.draft->'photos'->0;
     end if;
     for media in select value from jsonb_array_elements(coalesce(w.draft->'photos','[]'::jsonb)) loop
       media_id := (media->>'id')::uuid;
       image_path := '/api/editoriale/immagini/' || media_id;
       insert into public.culture_images(id,culture_entry_id,image_url,alt_text,author,source_url,license,license_url,sort_order,is_primary)
       values(media_id,w.entry_id,image_path,media->>'alt',nullif(media->>'author',''),
         nullif(media->>'source',''),nullif(media->>'license',''),nullif(media->>'licenseUrl',''),100,false)
       on conflict (id) do nothing;
     end loop;
     if cover is not null then
       image_path := coalesce(cover->>'url','/api/editoriale/immagini/' || (cover->>'id'));
       select id into media_id from public.culture_images
         where culture_entry_id=w.entry_id and image_url=image_path
         order by is_primary desc nulls last, sort_order, id limit 1;

       -- Keep a legacy cover that existed only on the entry available in the gallery.
       insert into public.culture_images(culture_entry_id,image_url,alt_text,author,source_url,license,license_url,sort_order,is_primary)
       select id,image_url,image_alt,image_author,image_source_url,image_license,image_license_url,100,false
       from public.culture_entries
       where id=w.entry_id and image_url is not null and image_url<>image_path
         and not exists (select 1 from public.culture_images where culture_entry_id=w.entry_id and image_url=public.culture_entries.image_url);
       update public.culture_images set is_primary=false
         where culture_entry_id=w.entry_id and is_primary and id is distinct from media_id;
       if media_id is null then
         media_id := coalesce((cover->>'id')::uuid,gen_random_uuid());
         insert into public.culture_images(id,culture_entry_id,image_url,sort_order,is_primary)
         values(media_id,w.entry_id,image_path,0,true);
       end if;
       update public.culture_images set is_primary=true,alt_text=cover->>'alt',author=nullif(cover->>'author',''),
         source_url=nullif(cover->>'source',''),license=nullif(cover->>'license',''),license_url=nullif(cover->>'licenseUrl','')
         where id=media_id and culture_entry_id=w.entry_id;
       update public.culture_entries set image_url=image_path,image_alt=cover->>'alt',image_author=nullif(cover->>'author',''),
         image_source_url=nullif(cover->>'source',''),image_license=nullif(cover->>'license',''),image_license_url=nullif(cover->>'licenseUrl','')
         where id=w.entry_id;
     end if;
     w.draft := jsonb_set(w.draft - 'cover','{photos}','[]'::jsonb);
   when 'withdraw' then
     update public.culture_entries set published=false,updated_at=now() where id=w.entry_id;
   when 'delete' then
     if not w.archived or exists(select 1 from public.culture_entries where id=w.entry_id and published) then
       raise exception 'editorial-conflict';
     end if;
     w.draft := w.draft || jsonb_build_object('deletedAt', now());
   when 'archive' then
     update public.culture_entries set published=false,updated_at=now() where id=w.entry_id;
     w.archived := true;
   else raise exception 'editorial-invalid-action';
   end case;
   update public.editorial_workspaces set draft=w.draft,entry_id=w.entry_id,
    archived=w.archived,version=w.version+1 where id=w.id returning * into w;
 end if;
 insert into public.editorial_activity(workspace_id,actor,action,version)
 values(w.id,p_actor,p_action,w.version);
 return w.id;
end;
$function$
;
revoke all on function public.manage_culture_editorial(text,uuid,uuid,uuid,integer,jsonb) from public, anon, authenticated;
grant execute on function public.manage_culture_editorial(text,uuid,uuid,uuid,integer,jsonb) to service_role;

create or replace function public.manage_other_editorial(
  p_model text, p_action text, p_actor uuid, p_workspace uuid, p_entry uuid, p_version integer, p_data jsonb
) returns uuid language plpgsql set search_path to '' as $$
declare
  w public.editorial_workspaces;
  source jsonb;
  model_table text;
  img jsonb;
  image_id uuid;
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
    if w.version is distinct from p_version or w.draft ? 'deletedAt' or (w.archived and p_action <> 'delete') then
      raise exception 'editorial-conflict';
    end if;
    case p_action
      when 'save' then
        w.draft := w.draft || (p_data - 'photos' - 'cover' - 'deletedAt');
        if p_data ? 'cover' then
          perform public.validate_editorial_cover(p_data->'cover');
          w.draft := jsonb_set(w.draft,'{cover}',p_data->'cover');
        end if;
      when 'photo' then
        if jsonb_array_length(w.draft->'photos') >= 1 then raise exception 'editorial-photo-limit'; end if;
        w.draft := jsonb_set(w.draft - 'cover','{photos}',jsonb_build_array(p_data));
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
        img := coalesce(w.draft->'cover',w.draft->'photos'->0);
        image_path := case when img is not null then coalesce(img->>'url','/api/editoriale/immagini/' || (img->>'id')) end;
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
            select id into image_id from public.story_images where story_id=w.entry_id and image_url=image_path
              order by is_primary desc nulls last,sort_order,id limit 1;
            update public.story_images set is_primary=false where story_id=w.entry_id and is_primary and id is distinct from image_id;
            if image_id is null then
              image_id := coalesce((img->>'id')::uuid,gen_random_uuid());
              insert into public.story_images(id,story_id,image_url,sort_order,is_primary)
              values(image_id,w.entry_id,image_path,0,true);
            end if;
            update public.story_images set is_primary=true,alt_text=img->>'alt',author=nullif(img->>'author',''),
              license=nullif(img->>'license',''),source_url=nullif(img->>'source',''),license_url=nullif(img->>'licenseUrl','')
              where id=image_id and story_id=w.entry_id;
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
        w.draft := jsonb_set(w.draft - 'cover','{photos}','[]'::jsonb);
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
      if existing.protected and p_action in ('publish','withdraw','archive') then raise exception 'editorial-protected'; end if;
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
