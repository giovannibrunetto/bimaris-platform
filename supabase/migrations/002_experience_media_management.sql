-- Consente agli owner/manager di gestire la galleria delle proprie esperienze non pubblicate.
-- Le policy sono idempotenti per poter essere applicate anche a database dove alcune regole esistono gia.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'experience_media'
      and policyname = 'operator owners update experience media'
  ) then
    create policy "operator owners update experience media"
    on public.experience_media
    for update
    to authenticated
    using (
      exists (
        select 1
        from public.experiences e
        join public.operator_memberships m on m.operator_id = e.operator_id
        where e.id = experience_media.experience_id
          and e.published = false
          and m.user_id = auth.uid()
          and m.role in ('owner', 'manager')
      )
    )
    with check (
      exists (
        select 1
        from public.experiences e
        join public.operator_memberships m on m.operator_id = e.operator_id
        where e.id = experience_media.experience_id
          and e.published = false
          and m.user_id = auth.uid()
          and m.role in ('owner', 'manager')
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'experience_media'
      and policyname = 'operator owners delete experience media'
  ) then
    create policy "operator owners delete experience media"
    on public.experience_media
    for delete
    to authenticated
    using (
      exists (
        select 1
        from public.experiences e
        join public.operator_memberships m on m.operator_id = e.operator_id
        where e.id = experience_media.experience_id
          and e.published = false
          and m.user_id = auth.uid()
          and m.role in ('owner', 'manager')
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'operators update experience images'
  ) then
    create policy "operators update experience images"
    on storage.objects
    for update
    to authenticated
    using (
      bucket_id = 'experience-media'
      and exists (
        select 1
        from public.operator_memberships m
        where m.user_id = auth.uid()
          and m.role in ('owner', 'manager')
          and (storage.foldername(name))[1] = m.operator_id::text
      )
    )
    with check (
      bucket_id = 'experience-media'
      and exists (
        select 1
        from public.operator_memberships m
        where m.user_id = auth.uid()
          and m.role in ('owner', 'manager')
          and (storage.foldername(name))[1] = m.operator_id::text
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'operators delete experience images'
  ) then
    create policy "operators delete experience images"
    on storage.objects
    for delete
    to authenticated
    using (
      bucket_id = 'experience-media'
      and exists (
        select 1
        from public.operator_memberships m
        where m.user_id = auth.uid()
          and m.role in ('owner', 'manager')
          and (storage.foldername(name))[1] = m.operator_id::text
      )
    );
  end if;
end $$;
