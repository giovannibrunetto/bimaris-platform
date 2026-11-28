create table public.editorial_workspaces (
 id uuid primary key default gen_random_uuid(),
 model text not null,
 entry_id uuid,
 draft jsonb not null default '{}',
 version integer not null default 0,
 archived boolean not null default false,
 unique (model, entry_id)
);
create table public.editorial_activity (
 id bigint generated always as identity primary key,
 workspace_id uuid not null references public.editorial_workspaces(id),
 actor uuid not null,
 action text not null,
 version integer not null,
 created_at timestamptz not null default now()
);
alter table public.editorial_workspaces enable row level security;
alter table public.editorial_activity enable row level security;
revoke all on public.editorial_workspaces, public.editorial_activity from public, anon, authenticated;
grant select, insert, update on public.editorial_workspaces to service_role;
grant select, insert on public.editorial_activity to service_role;
grant usage on sequence public.editorial_activity_id_seq to service_role;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('editorial-media','editorial-media',false,3145728,array['image/jpeg','image/png','image/webp']);

create function public.manage_culture_editorial(
 p_action text, p_actor uuid, p_workspace uuid, p_entry uuid, p_version integer, p_data jsonb
) returns uuid language plpgsql security invoker set search_path = ''
as $$
declare
 w public.editorial_workspaces;
 c public.culture_entries;
 media jsonb;
 media_id uuid;
 image_path text;
 generated_slug text;
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
   if w.version <> p_version or w.archived then raise exception 'editorial-conflict'; end if;
   case p_action
   when 'save' then
     w.draft := w.draft || (p_data - 'photos');
   when 'photo' then
     if jsonb_array_length(w.draft->'photos') >= 8 then raise exception 'editorial-photo-limit'; end if;
     w.draft := jsonb_set(w.draft,'{photos}',(w.draft->'photos') || jsonb_build_array(p_data));
   when 'publish' then
     if nullif(btrim(w.draft->>'title'),'') is null or nullif(btrim(w.draft->>'body'),'') is null
       or nullif(w.draft->>'placeId','') is null then raise exception 'editorial-fields-required'; end if;
     if w.entry_id is null then
       generated_slug := trim(both '-' from regexp_replace(lower(p_data->>'slug'),'[^a-z0-9]+','-','g'));
       if generated_slug is null or generated_slug = '' then raise exception 'editorial-invalid-slug'; end if;
       insert into public.culture_entries(place_id,slug,title,body,excerpt,category,published)
       values ((w.draft->>'placeId')::uuid,generated_slug,w.draft->>'title',w.draft->>'body',
         left(w.draft->>'body',240),'monumento',true) returning id into w.entry_id;
     else
       update public.culture_entries set title=w.draft->>'title', body=w.draft->>'body',
         place_id=(w.draft->>'placeId')::uuid,published=true,updated_at=now() where id=w.entry_id;
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
$$;
revoke all on function public.manage_culture_editorial(text,uuid,uuid,uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.manage_culture_editorial(text,uuid,uuid,uuid,integer,jsonb) to service_role;
