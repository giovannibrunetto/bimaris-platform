DO $guard$
DECLARE before_service jsonb; after_service jsonb; n integer;
BEGIN
  SELECT count(*) INTO n FROM pg_class c JOIN pg_namespace ns ON ns.oid=c.relnamespace
  WHERE ns.nspname='public' AND c.relname IN ('profiles','event_import_batches')
  AND c.relrowsecurity AND NOT EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid=c.oid);
  IF n<>2 THEN RAISE EXCEPTION 'Unexpected RLS baseline'; END IF;
  SELECT count(*) INTO n FROM unnest(ARRAY['profiles','event_import_batches']) t
  CROSS JOIN unnest(ARRAY['anon','authenticated']) r
  CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','MAINTAIN']) v
  WHERE has_table_privilege(r,format('public.%I',t),v);
  IF n<>20 THEN RAISE EXCEPTION 'Unexpected privilege baseline: %',n; END IF;
  SELECT jsonb_object_agg(t||':'||v,has_table_privilege('service_role',format('public.%I',t),v))
  INTO before_service FROM unnest(ARRAY['profiles','event_import_batches']) t
  CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN']) v;
  REVOKE SELECT,INSERT,UPDATE,DELETE,MAINTAIN ON public.profiles,public.event_import_batches FROM anon,authenticated;
  SELECT count(*) INTO n FROM unnest(ARRAY['profiles','event_import_batches']) t
  CROSS JOIN unnest(ARRAY['anon','authenticated']) r
  CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN']) v
  WHERE has_table_privilege(r,format('public.%I',t),v);
  IF n<>0 THEN RAISE EXCEPTION 'Residual privilege: %',n; END IF;
  SELECT count(*) INTO n FROM unnest(ARRAY['profiles','event_import_batches']) t
  CROSS JOIN unnest(ARRAY['anon','authenticated']) r
  CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','REFERENCES']) v
  WHERE has_any_column_privilege(r,format('public.%I',t),v);
  IF n<>0 THEN RAISE EXCEPTION 'Residual column privileges: %',n; END IF;
  SELECT jsonb_object_agg(t||':'||v,has_table_privilege('service_role',format('public.%I',t),v))
  INTO after_service FROM unnest(ARRAY['profiles','event_import_batches']) t
  CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN']) v;
  IF before_service IS DISTINCT FROM after_service THEN RAISE EXCEPTION 'Service privilege changed'; END IF;
END $guard$;
