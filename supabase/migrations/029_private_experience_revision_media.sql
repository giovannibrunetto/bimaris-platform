-- Keep proposed revision media private until an admin approves the revision.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('experience-revision-media','experience-revision-media',false,5242880,array['image/webp']::text[])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "operators read private revision images" on storage.objects;
create policy "operators read private revision images" on storage.objects for select to authenticated
using (bucket_id='experience-revision-media' and exists (
 select 1 from public.operator_memberships m
 where m.user_id=(select auth.uid()) and m.role in ('owner','manager')
 and (storage.foldername(name))[1]=m.operator_id::text
));

drop policy if exists "operators upload private revision images" on storage.objects;
create policy "operators upload private revision images" on storage.objects for insert to authenticated
with check (bucket_id='experience-revision-media' and exists (
 select 1 from public.operator_memberships m
 where m.user_id=(select auth.uid()) and m.role in ('owner','manager')
 and (storage.foldername(name))[1]=m.operator_id::text
));

drop policy if exists "operators update private revision images" on storage.objects;
create policy "operators update private revision images" on storage.objects for update to authenticated
using (bucket_id='experience-revision-media' and exists (
 select 1 from public.operator_memberships m
 where m.user_id=(select auth.uid()) and m.role in ('owner','manager')
 and (storage.foldername(name))[1]=m.operator_id::text
))
with check (bucket_id='experience-revision-media' and exists (
 select 1 from public.operator_memberships m
 where m.user_id=(select auth.uid()) and m.role in ('owner','manager')
 and (storage.foldername(name))[1]=m.operator_id::text
));

drop policy if exists "operators delete private revision images" on storage.objects;
create policy "operators delete private revision images" on storage.objects for delete to authenticated
using (bucket_id='experience-revision-media' and exists (
 select 1 from public.operator_memberships m
 where m.user_id=(select auth.uid()) and m.role in ('owner','manager')
 and (storage.foldername(name))[1]=m.operator_id::text
));
