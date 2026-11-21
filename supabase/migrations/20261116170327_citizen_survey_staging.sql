-- DS-MKT-USER-02/V3. Apply ONLY to nzdeoimwikhoidtladnu.
-- Additional guard when the host exposes project_ref; runtime also pins the staging URL.
DO $$ BEGIN
  IF current_setting('app.settings.project_ref', true) IS NOT NULL
     AND current_setting('app.settings.project_ref', true) <> 'nzdeoimwikhoidtladnu' THEN
    RAISE EXCEPTION 'survey migration is staging-only';
  END IF;
END $$;
CREATE SCHEMA IF NOT EXISTS survey_private;
REVOKE ALL ON SCHEMA survey_private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA survey_private TO service_role;
CREATE TABLE survey_private.responses_test (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE,
  received_on date NOT NULL DEFAULT current_date,
  q1 smallint NOT NULL CHECK (q1 BETWEEN 1 AND 4),
  q2 smallint NOT NULL CHECK (q2 BETWEEN 1 AND 4),
  q3 smallint[] NOT NULL CHECK (cardinality(q3) BETWEEN 1 AND 2 AND q3 <@ ARRAY[1,2,3,4]::smallint[] AND array_position(q3,NULL) IS NULL),
  q4 smallint CHECK (q4 BETWEEN 1 AND 4),
  idea text NOT NULL DEFAULT '' CHECK (length(idea) <= 1000 AND (idea='' OR idea LIKE 'COLLAUDO:%')),
  payload_digest text NOT NULL,
  test_only boolean NOT NULL DEFAULT true CHECK (test_only)
);
CREATE TABLE survey_private.launch_contacts_test (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email = lower(email) AND length(email)<=254 AND email ~ '^[a-z0-9._+\-]+@example\.invalid$'),
  consent_at timestamptz NOT NULL DEFAULT now(),
  consent_text text NOT NULL,
  consent_version text NOT NULL CHECK (consent_version='launch-only-v1'),
  privacy_version text NOT NULL CHECK (privacy_version='2026-11-16-v1'),
  purpose text NOT NULL DEFAULT 'single_launch_announcement' CHECK (purpose='single_launch_announcement'),
  test_only boolean NOT NULL DEFAULT true CHECK (test_only)
);
-- No response ID, request ID, IP, browser identifier or answer is stored in the contact archive.
CREATE TABLE survey_private.rate_limits_test (
  scope text NOT NULL CHECK (scope IN ('unlock','submit')),
  actor_hash text NOT NULL CHECK (actor_hash ~ '^[a-f0-9]{64}$'),
  window_start timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 1,
  PRIMARY KEY(scope,actor_hash)
);
ALTER TABLE survey_private.responses_test ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_private.launch_contacts_test ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_private.rate_limits_test ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA survey_private FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA survey_private TO service_role;

CREATE OR REPLACE FUNCTION public.consume_citizen_survey_limit(p_scope text, p_actor text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_count integer; v_limit integer;
BEGIN
  IF p_scope IS NULL OR p_scope NOT IN ('unlock','submit') OR p_actor IS NULL OR p_actor !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'invalid limit'; END IF;
  v_limit := CASE WHEN p_scope='unlock' THEN 10 ELSE 30 END;
  DELETE FROM survey_private.rate_limits_test WHERE window_start < now() - interval '1 day';
  INSERT INTO survey_private.rate_limits_test(scope,actor_hash) VALUES(p_scope,p_actor)
  ON CONFLICT(scope,actor_hash) DO UPDATE SET
    attempts=CASE WHEN survey_private.rate_limits_test.window_start < now()-interval '1 hour' THEN 1 ELSE survey_private.rate_limits_test.attempts+1 END,
    window_start=CASE WHEN survey_private.rate_limits_test.window_start < now()-interval '1 hour' THEN now() ELSE survey_private.rate_limits_test.window_start END
  RETURNING attempts INTO v_count;
  RETURN v_count<=v_limit;
END $$;
REVOKE ALL ON FUNCTION public.consume_citizen_survey_limit(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.consume_citizen_survey_limit(text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.submit_citizen_survey_test(
  p_request_id uuid, p_q1 smallint, p_q2 smallint, p_q3 smallint[], p_q4 smallint,
  p_idea text, p_email text, p_consent boolean, p_privacy_version text, p_consent_version text, p_consent_text text
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_digest text; v_existing text;
BEGIN
  IF p_request_id IS NULL OR p_q1 IS NULL OR p_q2 IS NULL OR p_q3 IS NULL OR p_idea IS NULL OR p_consent IS NULL
    OR p_q1 NOT BETWEEN 1 AND 4 OR p_q2 NOT BETWEEN 1 AND 4 OR (p_q4 IS NOT NULL AND p_q4 NOT BETWEEN 1 AND 4)
    OR cardinality(p_q3) NOT BETWEEN 1 AND 2 OR NOT (p_q3 <@ ARRAY[1,2,3,4]::smallint[])
    OR array_position(p_q3,NULL) IS NOT NULL OR (cardinality(p_q3)=2 AND p_q3[1]=p_q3[2])
    OR length(p_idea)>1000 OR (p_idea<>'' AND p_idea NOT LIKE 'COLLAUDO:%')
    OR p_privacy_version IS DISTINCT FROM '2026-11-16-v1' OR p_consent_version IS DISTINCT FROM 'launch-only-v1'
    OR (p_email IS NOT NULL AND (NOT p_consent OR p_email !~ '^[a-z0-9._+\-]+@example\.invalid$' OR length(p_email)>254))
    OR (p_consent AND (p_email IS NULL OR p_consent_text IS DISTINCT FROM 'Sì, desidero ricevere esclusivamente la comunicazione del lancio via email e ho letto l’informativa privacy')) THEN
    RAISE EXCEPTION 'invalid synthetic survey';
  END IF;
  -- Digest contains ONLY answers; it cannot correlate an email with an answer set.
  v_digest := md5(jsonb_build_array(p_q1,p_q2,p_q3,p_q4,p_idea)::text);
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
  SELECT payload_digest INTO v_existing FROM survey_private.responses_test WHERE request_id=p_request_id;
  IF v_existing IS NOT NULL THEN
    IF v_existing<>v_digest THEN RAISE EXCEPTION 'idempotency conflict'; END IF;
    RETURN true;
  END IF;
  -- Test records have a short retention; purge on each successful submission.
  DELETE FROM survey_private.responses_test WHERE received_on < current_date-7;
  DELETE FROM survey_private.launch_contacts_test WHERE consent_at < now()-interval '7 days';
  INSERT INTO survey_private.responses_test(request_id,q1,q2,q3,q4,idea,payload_digest)
  VALUES(p_request_id,p_q1,p_q2,p_q3,p_q4,p_idea,v_digest);
  IF p_consent THEN
    INSERT INTO survey_private.launch_contacts_test(email,consent_text,consent_version,privacy_version)
    VALUES(p_email,p_consent_text,p_consent_version,p_privacy_version)
    ON CONFLICT(email) DO NOTHING;
  END IF;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.submit_citizen_survey_test(uuid,smallint,smallint,smallint[],smallint,text,text,boolean,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_citizen_survey_test(uuid,smallint,smallint,smallint[],smallint,text,text,boolean,text,text,text) TO service_role;
NOTIFY pgrst, 'reload schema';
