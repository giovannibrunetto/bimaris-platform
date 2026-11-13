-- DS-UX-REV-01: full RPC transaction integration against a disposable EMPTY PostgreSQL.
-- The source of the RPC is an extracted Staging definition, not a substitute implementation.
-- Every schema object and test record is inside BEGIN/ROLLBACK. No Supabase project touched.
\set ON_ERROR_STOP on
BEGIN;
DO $preflight$
BEGIN
 IF to_regclass('public.experiences') IS NOT NULL OR to_regclass('public.experience_revisions') IS NOT NULL
 THEN RAISE EXCEPTION 'REFUSED: this suite requires an empty disposable PostgreSQL database'; END IF;
END $preflight$;

DO $roles$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END $roles$;

CREATE TABLE public.categories(id uuid PRIMARY KEY);
CREATE TABLE public.territories(id uuid PRIMARY KEY);
CREATE TABLE public.operators(id uuid PRIMARY KEY,name text,selection_status text,published boolean);
CREATE TABLE public.allowed_intents(key text PRIMARY KEY);
CREATE TABLE public.allowed_activities(key text PRIMARY KEY);
CREATE TABLE public.experiences(
 id uuid PRIMARY KEY,
 operator_id uuid,
 review_status text NOT NULL,
 name text NOT NULL,
 excerpt text,
 description text,
 duration_minutes integer,
 price_from numeric,
 category_id uuid,
 territory_id uuid,
 locality text,
 meeting_point text,
 google_maps_place_id text,
 location_kind text,
 latitude numeric,
 longitude numeric,
 territory_assignment_status text,
 territory_municipality_code text,
 image_url text,
 image_alt text,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.experience_revisions(
 id uuid PRIMARY KEY,
 experience_id uuid NOT NULL,
 operator_id uuid NOT NULL,
 status text NOT NULL,
 content jsonb NOT NULL DEFAULT '{}'::jsonb,
 review_notes text,
 review_sections jsonb NOT NULL DEFAULT '{}'::jsonb,
 reviewed_at timestamptz,
 applied_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.experience_media(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 experience_id uuid NOT NULL,
 storage_path text NOT NULL,
 alt_text text,
 sort_order integer NOT NULL,
 is_cover boolean NOT NULL
);
CREATE TABLE public.experience_revision_media(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 revision_id uuid NOT NULL,
 storage_path text NOT NULL,
 alt_text text,
 sort_order integer NOT NULL,
 is_cover boolean NOT NULL
);
CREATE TABLE public.experience_discovery_intents(
 experience_id uuid NOT NULL,
 intent_key text NOT NULL REFERENCES public.allowed_intents(key),
 weight numeric NOT NULL,
 PRIMARY KEY(experience_id,intent_key)
);
CREATE TABLE public.experience_activity_links(
 experience_id uuid NOT NULL,
 activity_key text NOT NULL REFERENCES public.allowed_activities(key),
 operator_id uuid NOT NULL,
 PRIMARY KEY(experience_id,activity_key,operator_id)
);

-- Do not edit the RPC snapshot to make the test pass.
\ir DS-UX-REV-01-admin-rpc-staging-snapshot.sql
\ir DS-UX-REV-01-taxonomy-atomic-candidate.sql

DO $tests$
DECLARE
 e uuid:='11111111-1111-4111-8111-111111111111';
 o uuid:='22222222-2222-4222-8222-222222222222';
 partner uuid:='33333333-3333-4333-8333-333333333333';
 r uuid:='44444444-4444-4444-8444-444444444444';
 failed uuid:='55555555-5555-4555-8555-555555555555';
 did_fail boolean;
BEGIN
 INSERT INTO public.operators(id,name,selection_status,published)
 VALUES(o,'Synthetic operator','selected',true);
 INSERT INTO public.allowed_intents VALUES('nature'),('culture'),('food');
 INSERT INTO public.allowed_activities VALUES('walk'),('taste'),('partner');
 INSERT INTO public.experiences(id,operator_id,review_status,name,excerpt,description,duration_minutes,price_from)
 VALUES(e,o,'approved','Original name','Original excerpt','Original description',60,12);
 INSERT INTO public.experience_media(experience_id,storage_path,alt_text,sort_order,is_cover)
 VALUES(e,'original.jpg','Original',0,true);
 INSERT INTO public.experience_discovery_intents VALUES(e,'nature',1);
 INSERT INTO public.experience_activity_links VALUES(e,'walk',o),(e,'partner',partner);
 INSERT INTO public.experience_revisions(id,experience_id,operator_id,status,content)
 VALUES(r,e,o,'pending',jsonb_build_object(
 'name','Applied name','excerpt','New excerpt','description','New description',
 'duration_minutes',90,'price_from',15,'interest_keys',jsonb_build_array('culture'),
 'activity_keys',jsonb_build_array('taste'),
 'base_interest_keys',jsonb_build_array('nature'),
 'base_activity_keys',jsonb_build_array('walk')));
 INSERT INTO public.experience_revision_media(revision_id,storage_path,alt_text,sort_order,is_cover)
 VALUES(r,'approved.jpg','Approved',0,true);

 PERFORM * FROM public.admin_apply_experience_revision(r,'Test approval','https://demo.supabase.co');
 IF NOT EXISTS(SELECT 1 FROM public.experiences
   WHERE id=e AND name='Applied name' AND excerpt='New excerpt' AND description='New description'
   AND duration_minutes=90 AND price_from=15 AND image_url LIKE '%approved.jpg')
 OR NOT EXISTS(SELECT 1 FROM public.experience_revisions WHERE id=r AND status='applied')
 OR NOT EXISTS(SELECT 1 FROM public.experience_discovery_intents WHERE experience_id=e AND intent_key='culture')
 OR NOT EXISTS(SELECT 1 FROM public.experience_activity_links WHERE experience_id=e AND operator_id=o AND activity_key='taste')
 OR NOT EXISTS(SELECT 1 FROM public.experience_activity_links WHERE experience_id=e AND operator_id=partner AND activity_key='partner')
 THEN RAISE EXCEPTION 'FAIL: full admin RPC did not atomically apply content, media and taxonomy'; END IF;

 INSERT INTO public.experience_revisions(id,experience_id,operator_id,status,content)
 VALUES(failed,e,o,'pending',jsonb_build_object(
 'name','MUST ROLLBACK','interest_keys',jsonb_build_array('absent_fk'),
 'activity_keys',jsonb_build_array('walk'),
 'base_interest_keys',jsonb_build_array('culture'),
 'base_activity_keys',jsonb_build_array('taste')));
 INSERT INTO public.experience_revision_media(revision_id,storage_path,alt_text,sort_order,is_cover)
 VALUES(failed,'must-rollback.jpg','Rollback',0,true);
 did_fail:=false;
 BEGIN
  PERFORM * FROM public.admin_apply_experience_revision(failed,'Test rollback','https://demo.supabase.co');
 EXCEPTION WHEN foreign_key_violation THEN did_fail:=true;
 END;
 IF NOT did_fail THEN RAISE EXCEPTION 'FAIL: invalid taxonomy FK unexpectedly approved'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.experiences WHERE id=e AND name='Applied name'
   AND image_url LIKE '%approved.jpg')
 OR NOT EXISTS(SELECT 1 FROM public.experience_revisions WHERE id=failed AND status='pending')
 OR NOT EXISTS(SELECT 1 FROM public.experience_media WHERE experience_id=e AND storage_path='approved.jpg')
 OR EXISTS(SELECT 1 FROM public.experience_media WHERE experience_id=e AND storage_path='must-rollback.jpg')
 OR NOT EXISTS(SELECT 1 FROM public.experience_discovery_intents WHERE experience_id=e AND intent_key='culture')
 OR NOT EXISTS(SELECT 1 FROM public.experience_activity_links WHERE experience_id=e AND operator_id=o AND activity_key='taste')
 THEN RAISE EXCEPTION 'FAIL: partial content, media or taxonomy survived RPC rollback'; END IF;

 RAISE NOTICE 'DS-UX-REV-01 full actual RPC PASS: content + media + taxonomy apply; partner preservation; rejection and atomic rollback';
END;
$tests$;
ROLLBACK;
