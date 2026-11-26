begin;
do $test$
declare
  w uuid;
  operator_id uuid;
  request_id uuid := gen_random_uuid();
  file_id uuid := gen_random_uuid();
  request_body jsonb;
  response jsonb;
  model text;
  digest text := repeat('a',64);
begin
  select id into operator_id from auth.users order by created_at limit 1;
  if operator_id is null then
    operator_id := gen_random_uuid();
    insert into auth.users(id) values(operator_id);
  end if;

  insert into storage.objects(bucket_id,name) values('editorial-media',file_id::text);
  request_body := jsonb_build_object('title','QA draft', 'sources','[{"label":"QA"}]'::jsonb,
    'cover',jsonb_build_object('id',file_id,'alt','QA photo','author','QA credits'));
  foreach model in array array['culture','legend','village','historical'] loop
    insert into public.editorial_workspaces(model,draft) values(model,'{"photos":[]}'::jsonb) returning id into w;
    response := public.save_editorial_draft(model,operator_id,w,0,request_id,digest,request_body);
    if response is distinct from '{"version":1,"replayed":false}'::jsonb then
      raise exception 'First save mismatch for %',model;
    end if;
    -- A transport retry can produce another Storage upload ID. It must keep the first one.
    response := public.save_editorial_draft(model,operator_id,w,0,request_id,digest,
      jsonb_set(request_body,'{cover,id}',to_jsonb(gen_random_uuid())));
    if response is distinct from '{"version":1,"replayed":true}'::jsonb then
      raise exception 'Retry mismatch for %',model;
    end if;
    if not exists(select 1 from public.editorial_workspaces where id=w and version=1
      and draft->'cover'=request_body->'cover' and draft->'sources'=request_body->'sources' and draft->>'title'='QA draft')
      or (select count(*) from public.editorial_activity where workspace_id=w and action='save')<>1 then
      raise exception 'Atomic save/audit mismatch for %',model;
    end if;
    begin
      perform public.save_editorial_draft(model,operator_id,w,0,request_id,repeat('b',64),request_body);
      raise exception 'Changed payload accepted with stale version';
    exception when raise_exception then
      if sqlerrm<>'editorial-conflict' then raise; end if;
    end;
    begin
      perform public.save_editorial_draft(model,operator_id,w,0,gen_random_uuid(),digest,request_body);
      raise exception 'Independent stale save accepted';
    exception when raise_exception then
      if sqlerrm<>'editorial-conflict' then raise; end if;
    end;
    begin
      perform public.save_editorial_draft(model,operator_id,w,1,gen_random_uuid(),digest,
        jsonb_set(request_body,'{cover,id}',to_jsonb(gen_random_uuid())));
      raise exception 'Missing Storage object accepted';
    exception when raise_exception then
      if sqlerrm<>'editorial-invalid-cover' then raise; end if;
    end;
    if (select version from public.editorial_workspaces where id=w)<>1 then
      raise exception 'Failed photo save advanced version for %',model;
    end if;
    response := public.save_editorial_draft(model,operator_id,w,1,gen_random_uuid(),digest,request_body);
    if response is distinct from '{"version":2,"replayed":false}'::jsonb then
      raise exception 'Next revision mismatch for %',model;
    end if;
  end loop;
end
$test$;
select 'PASS: exact replay, independent and changed stale requests, invalid photo rollback, next version, four models' as outcome;
rollback;
