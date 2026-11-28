-- DS-QA-SEC-04/V2. Staging-only authorized execution; no data or RLS changes.
-- Requires PostgreSQL 17. Apply only via a verified Staging connection.
-- Recovery: docs/qa/DT-QA-SEC-01-R04-rollback.sql (separate authorization for restoration).
DO $sec_r04$
DECLARE
  t text; r text; p text; q text; a text; b text;
  before_data jsonb := '{}'::jsonb; after_data jsonb := '{}'::jsonb;
  before_acl jsonb; after_acl jsonb; before_policies text; after_policies text;
  names text[] := ARRAY['culture_entries','culture_images','stories','story_images','villages','village_sources','story_editorial_context'];
  excess text[] := ARRAY['INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN'];
BEGIN
  IF current_user <> 'postgres' OR current_setting('server_version_num')::integer < 170000 THEN
    RAISE EXCEPTION 'SEC-R04: unexpected executor or PostgreSQL version';
  END IF;
  -- Serialize against concurrent editorial writers during the short transaction.
  LOCK TABLE public.culture_entries, public.culture_images, public.stories, public.story_images, public.villages, public.village_sources, public.story_editorial_context IN SHARE ROW EXCLUSIVE MODE;
  FOREACH t IN ARRAY names LOOP
    q := format('public.%I',t);
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid=q::regclass AND relrowsecurity AND relowner='postgres'::regrole) THEN
      RAISE EXCEPTION 'SEC-R04: unexpected owner/RLS on %',t;
    END IF;
    FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF NOT has_table_privilege(r,q,'SELECT') THEN RAISE EXCEPTION 'SEC-R04: missing SELECT on % for %',t,r; END IF;
      FOREACH p IN ARRAY excess LOOP
        IF NOT has_table_privilege(r,q,p) THEN RAISE EXCEPTION 'SEC-R04: unexpected precondition % % %',t,r,p; END IF;
      END LOOP;
    END LOOP;
    EXECUTE format('SELECT md5(coalesce(string_agg(to_jsonb(x)::text, E''\\n'' ORDER BY to_jsonb(x)::text),'''')) FROM public.%I x',t) INTO a;
    before_data := before_data || jsonb_build_object(t,a);
  END LOOP;
  SELECT jsonb_agg(jsonb_build_array(c.relname,a.grantor,a.grantee,a.privilege_type,a.is_grantable) ORDER BY c.relname,a.grantor,a.grantee,a.privilege_type)
    INTO before_acl FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    CROSS JOIN LATERAL aclexplode(c.relacl) a
    WHERE n.nspname='public' AND c.relname=ANY(names) AND a.grantee NOT IN ('anon'::regrole,'authenticated'::regrole);
  SELECT md5(string_agg(to_jsonb(z)::text,E'\n' ORDER BY tablename,policyname)) INTO before_policies FROM pg_policies z WHERE schemaname='public' AND tablename=ANY(names);
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public.culture_entries, public.culture_images, public.stories, public.story_images, public.villages, public.village_sources, public.story_editorial_context FROM anon, authenticated;
  FOREACH t IN ARRAY names LOOP
    q := format('public.%I',t);
    FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF NOT has_table_privilege(r,q,'SELECT') THEN RAISE EXCEPTION 'SEC-R04: SELECT lost % %',t,r; END IF;
      FOREACH p IN ARRAY excess LOOP
        IF has_table_privilege(r,q,p) THEN RAISE EXCEPTION 'SEC-R04: residual privilege % % %',t,r,p; END IF;
      END LOOP;
    END LOOP;
    EXECUTE format('SELECT md5(coalesce(string_agg(to_jsonb(x)::text, E''\\n'' ORDER BY to_jsonb(x)::text),'''')) FROM public.%I x',t) INTO b;
    after_data := after_data || jsonb_build_object(t,b);
  END LOOP;
  SELECT jsonb_agg(jsonb_build_array(c.relname,a.grantor,a.grantee,a.privilege_type,a.is_grantable) ORDER BY c.relname,a.grantor,a.grantee,a.privilege_type)
    INTO after_acl FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    CROSS JOIN LATERAL aclexplode(c.relacl) a
    WHERE n.nspname='public' AND c.relname=ANY(names) AND a.grantee NOT IN ('anon'::regrole,'authenticated'::regrole);
  SELECT md5(string_agg(to_jsonb(z)::text,E'\n' ORDER BY tablename,policyname)) INTO after_policies FROM pg_policies z WHERE schemaname='public' AND tablename=ANY(names);
  IF before_data IS DISTINCT FROM after_data OR before_acl IS DISTINCT FROM after_acl OR before_policies IS DISTINCT FROM after_policies THEN
    RAISE EXCEPTION 'SEC-R04: integrity, service privileges or policy mismatch';
  END IF;
END
$sec_r04$;
