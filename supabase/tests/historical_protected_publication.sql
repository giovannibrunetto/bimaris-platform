begin;
do $test$
<<historical_protected_test>>
declare
  actor_id uuid;
  story_id uuid;
  workspace_id uuid;
  slug_value text := 'qa-historical-' || gen_random_uuid();
  original_photo uuid := gen_random_uuid();
  new_photo uuid := gen_random_uuid();
  original_content jsonb := '{"title":"Original QA story","subtitle":"Subtitle","theme":"Theme","intro":["Opening"],"conclusion":["Closing"],"chapters":[{"title":"Chapter","paragraphs":["Text"],"transition":[]}]}'::jsonb;
  modified_content jsonb;
  published_content jsonb;
  attempt record;
begin
  select id into actor_id from auth.users order by created_at limit 1;
  if actor_id is null then
    actor_id := gen_random_uuid();
    insert into auth.users(id) values(actor_id);
  end if;
  insert into storage.objects(bucket_id,name) values
    ('editorial-media',original_photo::text),('editorial-media',new_photo::text);
  original_content := original_content || jsonb_build_object('key',slug_value,
    'cover',jsonb_build_object('id',original_photo,'alt','Old photo','author','Old author'));
  insert into public.historical_editorial_stories(slug,published,protected,content)
  values(slug_value,true,true,original_content) returning id into story_id;
  workspace_id := public.manage_historical_editorial('create',actor_id,null,story_id,0,'{}');
  modified_content := original_content || jsonb_build_object('title','Revised QA story',
    'cover',jsonb_build_object('id',new_photo,'alt','New photo','author','New author',
      'source','https://example.invalid/photo','license','CC BY-SA','licenseUrl','https://example.invalid/license'));

  perform public.save_editorial_draft('historical',actor_id,workspace_id,0,gen_random_uuid(),repeat('a',64),modified_content);
  if (select content from public.historical_editorial_stories where id=story_id) is distinct from original_content
    or (select draft->'cover' from public.editorial_workspaces where id=workspace_id) is distinct from modified_content->'cover' then
    raise exception 'Draft replacement failed or reached the public story before publication';
  end if;

  for attempt in select * from (values
    ('publish',1,'{}'::jsonb,'editorial-confirmation-required'),
    ('publish',1,'{"confirmed":"true"}'::jsonb,'editorial-confirmation-required'),
    ('publish',0,'{"confirmed":true}'::jsonb,'editorial-conflict'),
    ('withdraw',1,'{"confirmed":true}'::jsonb,'editorial-protected'),
    ('archive',1,'{"confirmed":true}'::jsonb,'editorial-protected')
  ) as cases(action,version,payload,expected)
  loop
    begin
      perform public.manage_historical_editorial(attempt.action,actor_id,workspace_id,null,attempt.version,attempt.payload);
      raise exception 'Rejected operation mutated state: %',attempt.action;
    exception when raise_exception then
      if sqlerrm<>attempt.expected then raise; end if;
    end;
  end loop;

  perform public.manage_historical_editorial('publish',actor_id,workspace_id,null,1,'{"confirmed":true,"slug":"ignored-qa-slug"}');
  select content into strict published_content from public.historical_editorial_stories
    where id=story_id and slug=slug_value and protected and published;
  if published_content is distinct from modified_content then raise exception 'Published text or photo credits mismatch'; end if;
  if not exists(select 1 from public.editorial_workspaces where id=workspace_id and version=2 and not archived)
    or (select array_agg(action order by version) from public.editorial_activity a where a.workspace_id=historical_protected_test.workspace_id)
      is distinct from array['create','save','publish']::text[] then
    raise exception 'Version or audit mismatch';
  end if;
  if has_function_privilege('anon','public.manage_historical_editorial(text,uuid,uuid,uuid,integer,jsonb)','EXECUTE')
    or has_function_privilege('authenticated','public.manage_historical_editorial(text,uuid,uuid,uuid,integer,jsonb)','EXECUTE') then
    raise exception 'Direct RPC privileges are too broad';
  end if;
end
$test$;
select 'PASS protected publication, photo credits, stale version, confirmation, withdrawal and archive guard, RPC ACL and audit' as outcome;
rollback;
