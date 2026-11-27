DO $guard$
DECLARE before_service jsonb; after_service jsonb; n integer;
BEGIN
  SELECT count(*) INTO n FROM pg_class c JOIN pg_namespace ns ON ns.oid=c.relnamespace
  WHERE ns.nspname='public' AND c.relname IN ('analytics_events','contact_messages','operator_applications')
  AND c.relrowsecurity AND NOT EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid=c.oid);
  IF n<>3 THEN RAISE EXCEPTION 'Unexpected RLS baseline'; END IF;
  SELECT count(*) INTO n FROM unnest(ARRAY['analytics_events','contact_messages','operator_applications']) t
  CROSS JOIN unnest(ARRAY['anon','authenticated']) r
  CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','MAINTAIN']) v
  WHERE has_table_privilege(r,format('public.%I',t),v);
  IF n<>30 THEN RAISE EXCEPTION 'Unexpected privilege baseline: %',n; END IF;
  SELECT jsonb_object_agg(t||':'||v,has_table_privilege('service_role',format('public.%I',t),v))
  INTO before_service FROM unnest(ARRAY['analytics_events','contact_messages','operator_applications']) t
  CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN']) v;
  REVOKE SELECT,INSERT,UPDATE,DELETE,MAINTAIN ON public.analytics_events,public.contact_messages,public.operator_applications FROM anon,authenticated;
  SELECT count(*) INTO n FROM unnest(ARRAY['analytics_events','contact_messages','operator_applications']) t
  CROSS JOIN unnest(ARRAY['anon','authenticated']) r
  CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN']) v
  WHERE has_table_privilege(r,format('public.%I',t),v);
  IF n<>0 THEN RAISE EXCEPTION 'Residual privilege: %',n; END IF;
  SELECT jsonb_object_agg(t||':'||v,has_table_privilege('service_role',format('public.%I',t),v))
  INTO after_service FROM unnest(ARRAY['analytics_events','contact_messages','operator_applications']) t
  CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN']) v;
  IF before_service IS DISTINCT FROM after_service THEN RAISE EXCEPTION 'Service privilege changed'; END IF;
END $guard$;
