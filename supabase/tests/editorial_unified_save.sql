-- Transactional acceptance test. Run with PostgreSQL 17 and the BIMARIS schema.
begin;
do $test$
declare
  model text;
  workspace uuid;
  entry uuid;
  test_actor uuid;
  round integer;
  snapshot jsonb;
  public_record jsonb;
  first_photo uuid;
  replacement uuid;
  cover jsonb;
  payload jsonb;
  original_path text;
  new_path text;
  slug text;
  source_count integer;
  activity_count integer;
begin
  select id into test_actor from auth.users order by created_at limit 1;
  if test_actor is null then
    test_actor := gen_random_uuid();
    insert into auth.users(id) values(test_actor);
  end if;

  foreach model in array array['culture','legend','village','historical'] loop
    slug := 'qa-editorial-' || gen_random_uuid();
    first_photo := gen_random_uuid();
    replacement := gen_random_uuid();
    original_path := '/api/editoriale/immagini/' || first_photo;
    new_path := '/api/editoriale/immagini/' || replacement;
    insert into storage.objects(bucket_id,name) values
      ('editorial-media',first_photo::text),('editorial-media',replacement::text);
    cover := jsonb_build_object('id',first_photo,'alt','Initial alt','author','Initial author',
      'source','https://example.invalid/old','license','CC BY','licenseUrl','https://example.invalid/license');
    payload := jsonb_build_object('title','QA title','body','QA body','subtitle','QA subtitle',
      'theme','QA theme','intro',jsonb_build_array('Intro'),'conclusion',jsonb_build_array('Conclusion'),
      'chapters','[{"number":1,"title":"Chapter","paragraphs":["Text"],"transition":[]}]'::jsonb,
      'location','{"latitude":38.1,"longitude":15.5,"address":"QA"}'::jsonb,
      'sources','[{"label":"QA reference","url":"","note":"QA note"}]'::jsonb,'cover',cover);
    case model
      when 'culture' then workspace := public.manage_culture_editorial('create',test_actor,null,null,0,'{}');
      when 'historical' then workspace := public.manage_historical_editorial('create',test_actor,null,null,0,'{}');
      else workspace := public.manage_other_editorial(model,'create',test_actor,null,null,0,'{}');
    end case;

    -- Initial save and publication, then replace the published cover.
    for round in 0..1 loop
      if round=1 then
        cover := cover || jsonb_build_object('id',replacement,'alt','New alt','author','New author',
          'source','https://example.invalid/new','license','CC BY-SA','licenseUrl','https://example.invalid/new-license');
        payload := payload || jsonb_build_object('title','Revised QA title','cover',cover);
      end if;
      case model
        when 'culture' then perform public.manage_culture_editorial('save',test_actor,workspace,null,round*2,payload);
        when 'historical' then perform public.manage_historical_editorial('save',test_actor,workspace,null,round*2,payload);
        else perform public.manage_other_editorial(model,'save',test_actor,workspace,null,round*2,payload);
      end case;
      select draft into strict snapshot from public.editorial_workspaces where id=workspace;
      if snapshot->'cover' is distinct from cover or snapshot->'sources' is distinct from payload->'sources'
        or snapshot->>'title' is distinct from payload->>'title' then
        raise exception 'Draft did not persist for %', model;
      end if;
      if model='historical' then
        perform public.manage_historical_editorial('publish',test_actor,workspace,null,round*2+1,jsonb_build_object('slug',slug));
      else
        perform public.publish_editorial_with_sources(model,test_actor,workspace,round*2+1,jsonb_build_object('slug',slug));
      end if;
    end loop;

    select entry_id into strict entry from public.editorial_workspaces where id=workspace;
    if model='culture' then
      select to_jsonb(c) into strict public_record from public.culture_entries c where id=entry;
      select count(*) into source_count from public.culture_sources where culture_entry_id=entry and label='QA reference';
      if not exists (select 1 from public.culture_images where culture_entry_id=entry and image_url=original_path and not is_primary)
         or not exists (select 1 from public.culture_images where culture_entry_id=entry and image_url=new_path and is_primary and author='New author')
      then raise exception 'Culture cover did not replace or preserve gallery'; end if;
    elsif model='legend' then
      select to_jsonb(s) into strict public_record from public.stories s where id=entry;
      select count(*) into source_count from public.story_sources where story_id=entry and label='QA reference';
    elsif model='village' then
      select to_jsonb(v) || jsonb_build_object('title',name) into strict public_record from public.villages v where id=entry;
      select count(*) into source_count from public.village_sources where village_id=entry and label='QA reference';
    else
      select content into strict public_record from public.historical_editorial_stories where id=entry and published;
      source_count := jsonb_array_length(public_record->'sources');
      if public_record->'cover' is distinct from cover then raise exception 'Historical public cover mismatch'; end if;
    end if;
    if public_record->>'title' is distinct from 'Revised QA title' or source_count is distinct from 1 then
      raise exception 'Published text or sources mismatch for %', model;
    end if;
    if model<>'historical' and (
       public_record->>'image_url' is distinct from new_path or public_record->>'image_alt' is distinct from 'New alt'
       or public_record->>'image_author' is distinct from 'New author' or public_record->>'image_source_url' is distinct from 'https://example.invalid/new'
       or public_record->>'image_license' is distinct from 'CC BY-SA' or public_record->>'image_license_url' is distinct from 'https://example.invalid/new-license'
    ) then raise exception 'Published credits mismatch for %', model; end if;

    -- Edit credits with the same image, then verify idempotent publication and version rejection.
    cover := cover || jsonb_build_object('author','Credits only');
    if model<>'historical' then cover := cover || jsonb_build_object('url',new_path); end if;
    payload := (payload - 'sources') || jsonb_build_object('cover',cover);
    case model
      when 'culture' then perform public.manage_culture_editorial('save',test_actor,workspace,null,4,payload);
      when 'historical' then perform public.manage_historical_editorial('save',test_actor,workspace,null,4,payload);
      else perform public.manage_other_editorial(model,'save',test_actor,workspace,null,4,payload);
    end case;
    begin
      case model
        when 'culture' then perform public.manage_culture_editorial('save',test_actor,workspace,null,4,payload);
        when 'historical' then perform public.manage_historical_editorial('save',test_actor,workspace,null,4,payload);
        else perform public.manage_other_editorial(model,'save',test_actor,workspace,null,4,payload);
      end case;
      raise exception 'Stale version accepted for %', model;
    exception when raise_exception then
      if sqlerrm <> 'editorial-conflict' then raise; end if;
    end;
    if model='historical' then
      perform public.manage_historical_editorial('publish',test_actor,workspace,null,5,jsonb_build_object('slug',slug));
      select content->'cover'->>'author' into original_path from public.historical_editorial_stories where id=entry;
    else
      perform public.publish_editorial_with_sources(model,test_actor,workspace,5,jsonb_build_object('slug',slug));
      case model
        when 'culture' then select author into strict original_path from public.culture_images where culture_entry_id=entry and is_primary and image_url=new_path;
        when 'legend' then select author into strict original_path from public.story_images where story_id=entry and is_primary and image_url=new_path;
        when 'village' then select image_author into original_path from public.villages where id=entry and image_url=new_path;
      end case;
    end if;
    if original_path is distinct from 'Credits only' then raise exception 'Credits-only save did not publish for %', model; end if;
    select count(*) into activity_count from public.editorial_activity where workspace_id=workspace and editorial_activity.actor=test_actor;
    if activity_count<>7 then raise exception 'Audit count mismatch for %: %', model, activity_count; end if;
    if not exists (select 1 from public.editorial_workspaces where id=workspace and draft ? 'sources' and editorial_workspaces.version=6) then
      raise exception 'Sources lost after credits-only save for %', model;
    end if;
  end loop;
end
$test$;
select 'PASS: four models, save and publish, replace and edit credits, preserve sources, stale version and audit' as outcome;
rollback;
