-- DS-MKT-USER-02/V5. Apply ONLY in Staging now. Does NOT authorize a launch.
CREATE TABLE survey_private.collection_control (
  singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
  enabled boolean NOT NULL DEFAULT false,
  staging_only boolean NOT NULL DEFAULT true,
  privacy_version text NOT NULL DEFAULT '2026-11-17-v2' CHECK(privacy_version='2026-11-17-v2'),
  release_authorized_by text,
  release_authorized_at timestamptz,
  CHECK(NOT enabled OR (NOT staging_only AND release_authorized_by IS NOT NULL AND release_authorized_at IS NOT NULL))
);
INSERT INTO survey_private.collection_control(singleton) VALUES(true);
CREATE TABLE survey_private.responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE,
  received_on date NOT NULL DEFAULT current_date,
  expires_at timestamptz NOT NULL,
  review_on date NOT NULL,
  q1 smallint NOT NULL CHECK(q1 BETWEEN 1 AND 4),
  q2 smallint NOT NULL CHECK(q2 BETWEEN 1 AND 4),
  q3 smallint[] NOT NULL CHECK(cardinality(q3) BETWEEN 1 AND 2 AND q3 <@ ARRAY[1,2,3,4]::smallint[] AND array_position(q3,NULL) IS NULL AND (cardinality(q3)=1 OR q3[1]<>q3[2])),
  q4 smallint CHECK(q4 BETWEEN 1 AND 4),
  idea text NOT NULL CHECK(length(idea)<=1000),
  payload_digest text NOT NULL,
  rehearsal boolean NOT NULL,
  CHECK(NOT rehearsal OR idea='' OR idea LIKE 'COLLAUDO:%')
);
CREATE TABLE survey_private.launch_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK(email=lower(email) AND length(email)<=254),
  consent_at timestamptz NOT NULL DEFAULT now(),
  consent_text text NOT NULL,
  consent_version text NOT NULL CHECK(consent_version='launch-only-v1'),
  privacy_version text NOT NULL CHECK(privacy_version='2026-11-17-v2'),
  purpose text NOT NULL DEFAULT 'single_launch_announcement' CHECK(purpose='single_launch_announcement'),
  launch_announced_at timestamptz,
  rehearsal boolean NOT NULL,
  CHECK(NOT rehearsal OR email ~ '^[a-z0-9._+-]+@example[.]invalid$')
);
-- No common identifier, request ID, answer, IP, or response digest in contacts.
CREATE TABLE survey_private.rate_limits (
  actor_hash text PRIMARY KEY CHECK(actor_hash ~ '^[a-f0-9]{64}$'),
  window_start timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 1
);
CREATE TABLE survey_private.release_retention_runs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  executed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  responses_removed integer NOT NULL,
  contacts_removed integer NOT NULL,
  counters_removed integer NOT NULL,
  reason text NOT NULL CHECK(reason IN ('scheduled','manual','erasure'))
);
ALTER TABLE survey_private.collection_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_private.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_private.launch_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_private.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_private.release_retention_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON survey_private.collection_control,survey_private.responses,survey_private.launch_contacts,survey_private.rate_limits,survey_private.release_retention_runs FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON survey_private.collection_control,survey_private.retention_policy TO service_role;
GRANT SELECT,INSERT,UPDATE ON survey_private.responses,survey_private.launch_contacts,survey_private.rate_limits TO service_role;
CREATE INDEX survey_responses_expiry ON survey_private.responses(expires_at);
CREATE INDEX survey_responses_review ON survey_private.responses(review_on);
CREATE INDEX survey_contacts_consent ON survey_private.launch_contacts(consent_at);

CREATE FUNCTION public.citizen_survey_collection_open(p_privacy_version text)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
  SELECT coalesce((SELECT c.enabled AND NOT c.staging_only AND c.privacy_version=p_privacy_version
    AND p.version=c.privacy_version AND p.controller_approved_at IS NOT NULL AND p.controller_approved_by IS NOT NULL
    AND c.release_authorized_at IS NOT NULL AND c.release_authorized_by IS NOT NULL
    FROM survey_private.collection_control c CROSS JOIN survey_private.retention_policy p
    WHERE c.singleton AND p.singleton),false)
$$;
REVOKE ALL ON FUNCTION public.citizen_survey_collection_open(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.citizen_survey_collection_open(text) TO service_role;

CREATE FUNCTION public.consume_citizen_survey_live_limit(p_actor text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE n integer;
BEGIN
  IF NOT public.citizen_survey_collection_open('2026-11-17-v2') THEN RETURN false; END IF;
  IF p_actor IS NULL OR p_actor !~ '^[a-f0-9]{64}$' THEN RETURN false; END IF;
  INSERT INTO survey_private.rate_limits(actor_hash) VALUES(p_actor)
  ON CONFLICT(actor_hash) DO UPDATE SET
    attempts=CASE WHEN survey_private.rate_limits.window_start<now()-interval '1 hour' THEN 1 ELSE survey_private.rate_limits.attempts+1 END,
    window_start=CASE WHEN survey_private.rate_limits.window_start<now()-interval '1 hour' THEN now() ELSE survey_private.rate_limits.window_start END
  RETURNING attempts INTO n;
  RETURN n<=30;
END $$;
REVOKE ALL ON FUNCTION public.consume_citizen_survey_live_limit(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.consume_citizen_survey_live_limit(text) TO service_role;

CREATE FUNCTION public.submit_citizen_survey(
  p_request_id uuid,p_q1 smallint,p_q2 smallint,p_q3 smallint[],p_q4 smallint,
  p_idea text,p_email text,p_consent boolean,p_privacy_version text,p_consent_version text,p_consent_text text,
  p_rehearsal boolean DEFAULT false
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' SET statement_timeout='20s' SET lock_timeout='3s' AS $$
DECLARE v_digest text; v_existing text; v_rehearsal boolean; v_expiry timestamptz; v_review date;
BEGIN
  IF p_rehearsal IS NULL THEN RAISE EXCEPTION 'invalid_mode'; END IF;
  -- Rehearsal is permitted only on the staging installation and only with synthetic payloads.
  IF p_rehearsal THEN
    IF NOT coalesce((SELECT staging_only FROM survey_private.collection_control WHERE singleton),false)
      OR (p_idea<>'' AND p_idea NOT LIKE 'COLLAUDO:%')
      OR (p_email IS NOT NULL AND p_email !~ '^[a-z0-9._+-]+@example[.]invalid$') THEN RAISE EXCEPTION 'rehearsal_only'; END IF;
  ELSIF NOT public.citizen_survey_collection_open(p_privacy_version) THEN RAISE EXCEPTION 'collection_disabled';
  END IF;
  IF p_request_id IS NULL OR p_q1 IS NULL OR p_q2 IS NULL OR p_q3 IS NULL OR p_idea IS NULL OR p_consent IS NULL
    OR p_q1 NOT BETWEEN 1 AND 4 OR p_q2 NOT BETWEEN 1 AND 4 OR (p_q4 IS NOT NULL AND p_q4 NOT BETWEEN 1 AND 4)
    OR array_ndims(p_q3)<>1 OR array_lower(p_q3,1)<>1 OR cardinality(p_q3) NOT BETWEEN 1 AND 2
    OR NOT(p_q3 <@ ARRAY[1,2,3,4]::smallint[]) OR array_position(p_q3,NULL) IS NOT NULL
    OR (cardinality(p_q3)=2 AND p_q3[1]=p_q3[2]) OR length(p_idea)>1000 OR p_idea ~ '[[:cntrl:]]'
    OR p_privacy_version IS DISTINCT FROM '2026-11-17-v2' OR p_consent_version IS DISTINCT FROM 'launch-only-v1'
    OR (p_email IS NOT NULL AND (NOT p_consent OR length(p_email)>254 OR p_email<>lower(p_email)
      OR p_email !~ '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?([.][a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'))
    OR (p_consent AND (p_email IS NULL OR p_consent_text IS DISTINCT FROM 'Sì, desidero ricevere esclusivamente la comunicazione del lancio via email e ho letto l’informativa privacy')) THEN RAISE EXCEPTION 'invalid_submission';
  END IF;
  v_digest:=md5(jsonb_build_array(p_q1,p_q2,p_q3,p_q4,p_idea)::text);
  PERFORM pg_advisory_xact_lock(hashtextextended('citizen-release:'||p_request_id::text,0));
  SELECT payload_digest,rehearsal INTO v_existing,v_rehearsal FROM survey_private.responses WHERE request_id=p_request_id;
  IF v_existing IS NOT NULL AND (v_existing<>v_digest OR v_rehearsal<>p_rehearsal) THEN RAISE EXCEPTION 'request_conflict'; END IF;
  SELECT CASE WHEN p_rehearsal THEN now()+make_interval(days=>test_days) ELSE now()+make_interval(months=>response_months) END,
    current_date+review_days INTO v_expiry,v_review FROM survey_private.retention_policy WHERE singleton;
  IF v_expiry IS NULL THEN RAISE EXCEPTION 'policy_missing'; END IF;
  IF v_existing IS NULL THEN
    INSERT INTO survey_private.responses(request_id,expires_at,review_on,q1,q2,q3,q4,idea,payload_digest,rehearsal)
    VALUES(p_request_id,v_expiry,v_review,p_q1,p_q2,p_q3,p_q4,p_idea,v_digest,p_rehearsal);
  END IF;
  IF p_consent THEN
    INSERT INTO survey_private.launch_contacts(email,consent_text,consent_version,privacy_version,rehearsal)
    VALUES(p_email,p_consent_text,p_consent_version,p_privacy_version,p_rehearsal)
    ON CONFLICT(email) DO NOTHING;
  END IF;
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='survey_submission_failed';
END $$;
REVOKE ALL ON FUNCTION public.submit_citizen_survey(uuid,smallint,smallint,smallint[],smallint,text,text,boolean,text,text,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_citizen_survey(uuid,smallint,smallint,smallint[],smallint,text,text,boolean,text,text,text,boolean) TO service_role;

CREATE FUNCTION survey_private.run_release_retention(p_reason text DEFAULT 'scheduled')
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' SET statement_timeout='20s' SET lock_timeout='3s' AS $$
DECLARE r integer; c integer; l integer;
BEGIN
  IF p_reason IS NULL OR p_reason NOT IN ('scheduled','manual') THEN RAISE EXCEPTION 'invalid_reason'; END IF;
  IF NOT pg_try_advisory_xact_lock(746735210902::bigint) THEN RETURN; END IF;
  DELETE FROM survey_private.responses WHERE expires_at<=now()+interval '1 hour'; GET DIAGNOSTICS r=ROW_COUNT;
  DELETE FROM survey_private.launch_contacts t WHERE survey_private.contact_expiry(t.consent_at,t.launch_announced_at,NULL,t.rehearsal)<=now()+interval '1 hour'; GET DIAGNOSTICS c=ROW_COUNT;
  DELETE FROM survey_private.rate_limits WHERE window_start<=now()-interval '23 hours'; GET DIAGNOSTICS l=ROW_COUNT;
  DELETE FROM survey_private.release_retention_runs WHERE executed_at<now()-interval '30 days';
  INSERT INTO survey_private.release_retention_runs(responses_removed,contacts_removed,counters_removed,reason) VALUES(r,c,l,p_reason);
  DELETE FROM cron.job_run_details d USING cron.job j WHERE d.jobid=j.jobid
    AND j.jobname='bimaris-citizen-survey-release-retention' AND d.end_time<now()-interval '30 days';
EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='survey_retention_failed';
END $$;
REVOKE ALL ON FUNCTION survey_private.run_release_retention(text) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION survey_private.erase_launch_contact(p_email text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE n integer;
BEGIN
  IF p_email IS NULL OR length(p_email)>254 THEN RAISE EXCEPTION 'invalid_contact'; END IF;
  DELETE FROM survey_private.launch_contacts WHERE email=lower(trim(p_email)); GET DIAGNOSTICS n=ROW_COUNT;
  INSERT INTO survey_private.release_retention_runs(responses_removed,contacts_removed,counters_removed,reason) VALUES(0,n,0,'erasure');
EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='survey_erasure_failed';
END $$;
REVOKE ALL ON FUNCTION survey_private.erase_launch_contact(text) FROM PUBLIC,anon,authenticated,service_role;
SELECT cron.schedule('bimaris-citizen-survey-release-retention','19 * * * *',$job$SELECT survey_private.run_release_retention('scheduled');$job$);
NOTIFY pgrst,'reload schema';
