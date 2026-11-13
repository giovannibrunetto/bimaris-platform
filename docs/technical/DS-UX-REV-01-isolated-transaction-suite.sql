-- DS-UX-REV-01: ISOLATED POSTGRES INTEGRATION TEST, NOT A STAGING MIGRATION.
-- Run ONLY against a disposable, EMPTY PostgreSQL database (never Supabase Staging/Production).
-- From repo root: psql -X -v ON_ERROR_STOP=1 -d "$DISPOSABLE_DATABASE_URL" \
--   -f docs/technical/DS-UX-REV-01-isolated-transaction-suite.sql
-- This suite creates disposable fixtures, loads the exact SQL candidate, exercises
-- trigger transitions and rolls back the ENTIRE setup at the end.
\set ON_ERROR_STOP on
BEGIN;
DO $preflight$
BEGIN
 IF to_regclass('public.experiences') IS NOT NULL
    OR to_regclass('public.experience_revisions') IS NOT NULL
 THEN RAISE EXCEPTION 'REFUSED: test requires a fresh, isolated database without BIMARIS application tables'; END IF;
END;
$preflight$;

-- Supabase predefined roles are absent in a stock PostgreSQL disposable container.
-- Create no-login stand-ins inside this rollback-only transaction.
DO $roles$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END;
$roles$;

CREATE TABLE public.experiences(
 id uuid PRIMARY KEY, operator_id uuid NOT NULL,
 name text, excerpt text, description text,
 duration_minutes integer, price_from numeric,
 territory_id uuid
);
CREATE TABLE public.experience_revisions(
 id uuid PRIMARY KEY, experience_id uuid NOT NULL,
 operator_id uuid NOT NULL, status text NOT NULL,
 content jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE public.discovery_intents(key text PRIMARY KEY);
CREATE TABLE public.experience_activities(key text PRIMARY KEY);
CREATE TABLE public.experience_discovery_intents(
 experience_id uuid NOT NULL, intent_key text NOT NULL REFERENCES public.discovery_intents(key),
 weight numeric NOT NULL, PRIMARY KEY(experience_id,intent_key)
);
CREATE TABLE public.experience_activity_links(
 experience_id uuid NOT NULL, activity_key text NOT NULL REFERENCES public.experience_activities(key),
 operator_id uuid NOT NULL,
 PRIMARY KEY(experience_id,activity_key,operator_id)
);
CREATE TABLE public.experience_media(
 experience_id uuid, storage_path text, sort_order integer,is_cover boolean
);
CREATE TABLE public.experience_revision_media(
 revision_id uuid, storage_path text, sort_order integer,is_cover boolean
);

-- Source under test is the very same candidate file committed in PR #54.
\ir DS-UX-REV-01-taxonomy-atomic-candidate.sql

DO $tests$
DECLARE
 e uuid:='11111111-1111-4111-8111-111111111111';
 o uuid:='22222222-2222-4222-8222-222222222222';
 partner uuid:='33333333-3333-4333-8333-333333333333';
 r uuid:='44444444-4444-4444-8444-444444444444';
 r2 uuid:='55555555-5555-4555-8555-555555555555';
 ok boolean;
BEGIN
 INSERT INTO public.discovery_intents(key) VALUES ('nature'),('culture'),('food');
 INSERT INTO public.experience_activities(key) VALUES ('walk'),('taste'),('partner_activity');
 INSERT INTO public.experiences VALUES(e,o,'Synthetic experience','excerpt','description',60,10,NULL);
 INSERT INTO public.experience_discovery_intents VALUES(e,'nature',1);
 INSERT INTO public.experience_activity_links VALUES(e,'walk',o);
 -- A partner-owned activity must never be erased by the lead operator's edit.
 INSERT INTO public.experience_activity_links VALUES(e,'partner_activity',partner);
 INSERT INTO public.experience_revisions VALUES(r,e,o,'draft',jsonb_build_object(
  'name','Synthetic experience','excerpt','excerpt','description','description',
  'duration_minutes',60,'price_from',10,'territory_id',NULL,
  'interest_keys',jsonb_build_array('nature','culture'),
  'activity_keys',jsonb_build_array('taste'),
  'base_interest_keys',jsonb_build_array('nature'),
  'base_activity_keys',jsonb_build_array('walk')
 ));
 IF NOT public.bimaris_revision_taxonomy_ready() THEN
   RAISE EXCEPTION 'FAIL: readiness false with enabled trigger';
 END IF;
 UPDATE public.experience_revisions SET status='pending' WHERE id=r;
 IF (SELECT status FROM public.experience_revisions WHERE id=r)<>'pending'
 THEN RAISE EXCEPTION 'FAIL: taxonomy-only proposal was rejected'; END IF;
 IF EXISTS(SELECT 1 FROM public.experience_discovery_intents WHERE experience_id=e AND intent_key='culture')
 THEN RAISE EXCEPTION 'FAIL: taxonomy changed before approval'; END IF;
 UPDATE public.experience_revisions SET status='applied' WHERE id=r;
 IF (SELECT count(*) FROM public.experience_discovery_intents WHERE experience_id=e)<>2
   OR NOT EXISTS(SELECT 1 FROM public.experience_discovery_intents WHERE experience_id=e AND intent_key='culture')
   OR EXISTS(SELECT 1 FROM public.experience_activity_links WHERE experience_id=e AND operator_id=o AND activity_key='walk')
   OR NOT EXISTS(SELECT 1 FROM public.experience_activity_links WHERE experience_id=e AND operator_id=o AND activity_key='taste')
   OR NOT EXISTS(SELECT 1 FROM public.experience_activity_links WHERE experience_id=e AND operator_id=partner AND activity_key='partner_activity')
 THEN RAISE EXCEPTION 'FAIL: approval applied wrong taxonomy / modified partner links'; END IF;

 -- A second revision targets a missing FK key. The failing trigger must roll
 -- back its own deletes and the revision status update in the same transaction.
 INSERT INTO public.experience_revisions VALUES(r2,e,o,'pending',jsonb_build_object(
  'interest_keys',jsonb_build_array('culture','absent_foreign_key'),
  'activity_keys',jsonb_build_array('walk'),
  'base_interest_keys',jsonb_build_array('culture','nature'),
  'base_activity_keys',jsonb_build_array('taste')
 ));
 ok:=false;
 BEGIN
  UPDATE public.experience_revisions SET status='applied' WHERE id=r2;
 EXCEPTION WHEN foreign_key_violation THEN
  ok:=true;
 END;
 IF NOT ok THEN RAISE EXCEPTION 'FAIL: invalid FK did not abort approval'; END IF;
 IF (SELECT status FROM public.experience_revisions WHERE id=r2)<>'pending'
    OR (SELECT count(*) FROM public.experience_discovery_intents WHERE experience_id=e)<>2
    OR NOT EXISTS(SELECT 1 FROM public.experience_activity_links WHERE experience_id=e AND operator_id=o AND activity_key='taste')
 THEN RAISE EXCEPTION 'FAIL: partial state persisted after FK failure'; END IF;

 -- Concurrent live modification must reject the pending revision and preserve
 -- the state from the competing writer.
 INSERT INTO public.experience_discovery_intents VALUES(e,'food',1);
 ok:=false;
 BEGIN
  UPDATE public.experience_revisions SET status='applied' WHERE id=r2;
 EXCEPTION WHEN SQLSTATE 'P0001' THEN
  ok:=true;
 END;
 IF NOT ok THEN RAISE EXCEPTION 'FAIL: stale baseline not rejected'; END IF;
 IF (SELECT status FROM public.experience_revisions WHERE id=r2)<>'pending'
    OR NOT EXISTS(SELECT 1 FROM public.experience_discovery_intents WHERE experience_id=e AND intent_key='food')
 THEN RAISE EXCEPTION 'FAIL: conflict check modified persisted data'; END IF;

 RAISE NOTICE 'DS-UX-REV-01 integration suite PASS: readiness; taxonomy-only; deferred apply; atomic apply; partner preservation; FK rollback; concurrency conflict';
END;
$tests$;
-- Verify that readiness is not an unconditional success and the deployment
-- does not expose either privileged function to unauthenticated clients.
DO $security$
BEGIN
 IF has_function_privilege('anon','public.bimaris_revision_taxonomy_ready()','EXECUTE')
    OR has_function_privilege('authenticated','public.bimaris_revision_taxonomy_ready()','EXECUTE')
    OR NOT has_function_privilege('service_role','public.bimaris_revision_taxonomy_ready()','EXECUTE')
 THEN RAISE EXCEPTION 'FAIL: readiness RPC role grants are too permissive'; END IF;
 IF has_function_privilege('anon','public.bimaris_apply_revision_taxonomy()','EXECUTE')
    OR has_function_privilege('authenticated','public.bimaris_apply_revision_taxonomy()','EXECUTE')
 THEN RAISE EXCEPTION 'FAIL: privileged trigger handler exposed to browser roles'; END IF;
END;
$security$;

ALTER TABLE public.experience_revisions DISABLE TRIGGER bimaris_apply_revision_taxonomy_on_approval;
DO $disabled$
BEGIN
 IF public.bimaris_revision_taxonomy_ready() THEN
  RAISE EXCEPTION 'FAIL: readiness returned true while approval trigger was disabled';
 END IF;
 RAISE NOTICE 'DS-UX-REV-01 security PASS: restricted grants and disabled-trigger fail-closed';
END;
$disabled$;
ALTER TABLE public.experience_revisions ENABLE TRIGGER bimaris_apply_revision_taxonomy_on_approval;
DO $enabled$
BEGIN
 IF NOT public.bimaris_revision_taxonomy_ready() THEN
  RAISE EXCEPTION 'FAIL: readiness did not recover when approval trigger was enabled';
 END IF;
END;
$enabled$;

ROLLBACK;
-- The entire fixture and candidate installation are rolled back.
