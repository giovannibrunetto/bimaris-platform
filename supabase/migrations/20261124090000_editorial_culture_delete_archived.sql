CREATE OR REPLACE FUNCTION public.manage_culture_editorial(p_action text, p_actor uuid, p_workspace uuid, p_entry uuid, p_version integer, p_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
 w public.editorial_workspaces;
 c public.culture_entries;
 media jsonb;
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
   if w.version <> p_version or w.draft ? 'deletedAt' or (w.archived and p_action <> 'delete') then raise exception 'editorial-conflict'; end if;
   case p_action
   when 'save' then
     w.draft := w.draft || (p_data - 'photos');
   when 'photo' then
     if jsonb_array_length(w.draft->'photos') >= 8 then raise exception 'editorial-photo-limit'; end if;
     w.draft := jsonb_set(w.draft,'{photos}',(w.draft->'photos') || jsonb_build_array(p_data));
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
     for media in select value from jsonb_array_elements(w.draft->'photos') loop
       media_id := (media->>'id')::uuid;
       image_path := '/api/editoriale/immagini/' || media_id;
       insert into public.culture_images(id,culture_entry_id,image_url,alt_text,author,source_url,license,license_url,sort_order,is_primary)
       values(media_id,w.entry_id,image_path,media->>'alt',nullif(media->>'author',''),
         nullif(media->>'source',''),nullif(media->>'license',''),nullif(media->>'licenseUrl',''),100,false)
       on conflict (id) do nothing;
       update public.culture_entries set image_url=image_path,image_alt=media->>'alt'
        where id=w.entry_id and image_url is null;
     end loop;
     w.draft := jsonb_set(w.draft,'{photos}','[]'::jsonb);
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
