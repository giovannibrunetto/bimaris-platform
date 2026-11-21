-- DS-MKT-USER-02/V4: apply ONLY to nzdeoimwikhoidtladnu (Staging).
-- Does not create live-collection tables or approve the controller's policy.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

CREATE TABLE survey_private.retention_policy (
  singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
  version text NOT NULL DEFAULT '2026-11-17-v2',
  response_months integer NOT NULL DEFAULT 12 CHECK(response_months=12),
  review_days integer NOT NULL DEFAULT 90 CHECK(review_days=90),
  launch_grace_days integer NOT NULL DEFAULT 30 CHECK(launch_grace_days=30),
  contact_months integer NOT NULL DEFAULT 12 CHECK(contact_months=12),
  test_days integer NOT NULL DEFAULT 7 CHECK(test_days=7),
  controller_approved_by text,
  controller_approved_at timestamptz,
  CHECK((controller_approved_by IS NULL)=(controller_approved_at IS NULL))
);
INSERT INTO survey_private.retention_policy(singleton) VALUES(true);
CREATE TABLE survey_private.retention_runs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  executed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  responses_removed integer NOT NULL,
  contacts_removed integer NOT NULL,
  counters_removed integer NOT NULL,
  reason text NOT NULL CHECK(reason IN ('scheduled','manual','erasure'))
);
ALTER TABLE survey_private.retention_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_private.retention_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON survey_private.retention_policy,survey_private.retention_runs FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON survey_private.retention_policy,survey_private.retention_runs TO service_role;
GRANT INSERT ON survey_private.retention_runs TO service_role;
GRANT USAGE,SELECT ON SEQUENCE survey_private.retention_runs_id_seq TO service_role;

ALTER TABLE survey_private.responses_test ADD COLUMN expires_at timestamptz;
UPDATE survey_private.responses_test SET expires_at=received_on::timestamptz+interval '7 days';
ALTER TABLE survey_private.responses_test ALTER COLUMN expires_at SET DEFAULT (now()+interval '7 days');
ALTER TABLE survey_private.responses_test ALTER COLUMN expires_at SET NOT NULL;
ALTER TABLE survey_private.launch_contacts_test ADD COLUMN launch_announced_at timestamptz;
CREATE INDEX responses_test_expiry_idx ON survey_private.responses_test(expires_at);
CREATE INDEX launch_contacts_test_consent_idx ON survey_private.launch_contacts_test(consent_at);

-- Calculation of the proposed live terms can be tested without activating collection.
CREATE FUNCTION survey_private.contact_expiry(p_collected timestamptz,p_announced timestamptz,p_revoked timestamptz,p_test boolean)
RETURNS timestamptz LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
  SELECT least(p_collected+make_interval(months=>p.contact_months),
    p_announced+make_interval(days=>p.launch_grace_days),p_revoked,
    CASE WHEN p_test THEN p_collected+make_interval(days=>p.test_days) END)
  FROM survey_private.retention_policy p WHERE singleton
$$;
REVOKE ALL ON FUNCTION survey_private.contact_expiry(timestamptz,timestamptz,timestamptz,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION survey_private.contact_expiry(timestamptz,timestamptz,timestamptz,boolean) TO service_role;

CREATE FUNCTION survey_private.run_retention(p_reason text DEFAULT 'scheduled')
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' SET statement_timeout='20s' SET lock_timeout='3s' AS $$
DECLARE r integer; c integer; l integer;
BEGIN
  IF p_reason IS NULL OR p_reason NOT IN ('scheduled','manual') THEN RAISE EXCEPTION 'invalid_reason'; END IF;
  IF NOT pg_try_advisory_xact_lock(746735210901::bigint) THEN RETURN; END IF;
  -- Anticipate the hourly sweep by one hour so deadlines are not exceeded while running.
  DELETE FROM survey_private.responses_test WHERE expires_at<=now()+interval '1 hour';
  GET DIAGNOSTICS r=ROW_COUNT;
  DELETE FROM survey_private.launch_contacts_test t
    WHERE survey_private.contact_expiry(t.consent_at,t.launch_announced_at,NULL,true)<=now()+interval '1 hour';
  GET DIAGNOSTICS c=ROW_COUNT;
  DELETE FROM survey_private.rate_limits_test WHERE window_start<=now()-interval '23 hours';
  GET DIAGNOSTICS l=ROW_COUNT;
  DELETE FROM survey_private.retention_runs WHERE executed_at<now()-interval '30 days';
  INSERT INTO survey_private.retention_runs(responses_removed,contacts_removed,counters_removed,reason) VALUES(r,c,l,p_reason);
  -- Only this job's metadata; never change other BIMARIS jobs.
  DELETE FROM cron.job_run_details d USING cron.job j
    WHERE d.jobid=j.jobid AND j.jobname='bimaris-citizen-survey-retention' AND d.end_time<now()-interval '30 days';
EXCEPTION WHEN OTHERS THEN
  -- Atomic rollback. pg_cron marks failure; next hourly run retries automatically.
  -- Do not copy SQLERRM, values, addresses or SQL fragments into logs.
  RAISE EXCEPTION USING ERRCODE=SQLSTATE,MESSAGE='survey_retention_failed';
END $$;
REVOKE ALL ON FUNCTION survey_private.run_retention(text) FROM PUBLIC,anon,authenticated,service_role;

-- Operator-only erasure of a synthetic contact, immediately deleting its consent too.
-- No public erasure endpoint: the operator must first verify the request out of band.
CREATE FUNCTION survey_private.erase_test_contact(p_email text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE n integer;
BEGIN
  IF p_email IS NULL OR p_email !~ '^[A-Za-z0-9._+\-]+@example\.invalid$' THEN RAISE EXCEPTION 'invalid_synthetic_contact'; END IF;
  DELETE FROM survey_private.launch_contacts_test WHERE email=lower(p_email);
  GET DIAGNOSTICS n=ROW_COUNT;
  INSERT INTO survey_private.retention_runs(responses_removed,contacts_removed,counters_removed,reason) VALUES(0,n,0,'erasure');
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION USING ERRCODE=SQLSTATE,MESSAGE='survey_erasure_failed';
END $$;
REVOKE ALL ON FUNCTION survey_private.erase_test_contact(text) FROM PUBLIC,anon,authenticated,service_role;

SELECT cron.schedule('bimaris-citizen-survey-retention','17 * * * *',$job$SELECT survey_private.run_retention('scheduled');$job$);
-- Private progress/health can be inspected via retention_runs + cron.job_run_details.
-- No email, response, IP/HMAC, identifiers or payloads are written to these run logs.
