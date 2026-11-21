BEGIN;
-- All fixtures are synthetic and every change is rolled back.
CREATE FUNCTION pg_temp.fail_survey_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'DO_NOT_LOG_PAYLOAD'; END $$;
DO $$
DECLARE due uuid:=gen_random_uuid(); fresh uuid:=gen_random_uuid(); failed boolean:=false; before_runs bigint;
BEGIN
  ASSERT NOT has_schema_privilege('anon','survey_private','USAGE');
  ASSERT NOT has_function_privilege('anon','survey_private.run_retention(text)','EXECUTE');
  ASSERT NOT has_function_privilege('authenticated','survey_private.erase_test_contact(text)','EXECUTE');
  ASSERT (SELECT controller_approved_at IS NULL AND controller_approved_by IS NULL FROM survey_private.retention_policy);
  ASSERT survey_private.contact_expiry('2024-02-29 UTC',NULL,NULL,false)='2025-02-28 UTC'::timestamptz;
  ASSERT survey_private.contact_expiry('2026-01-01 UTC','2026-02-01 UTC',NULL,false)='2026-03-03 UTC'::timestamptz;
  ASSERT survey_private.contact_expiry('2026-01-01 UTC',NULL,'2026-01-02 UTC',false)='2026-01-02 UTC'::timestamptz;
  ASSERT survey_private.contact_expiry('2026-01-01 UTC',NULL,NULL,true)='2026-01-08 UTC'::timestamptz;
  INSERT INTO survey_private.responses_test(id,request_id,q1,q2,q3,payload_digest,expires_at)
    VALUES(due,gen_random_uuid(),1,2,ARRAY[1]::smallint[],md5('fixture'),now()-interval '1 hour'),
          (fresh,gen_random_uuid(),1,2,ARRAY[1]::smallint[],md5('fixture'),now()+interval '7 days');
  INSERT INTO survey_private.launch_contacts_test(email,consent_at,consent_text,consent_version,privacy_version)
    VALUES('v4-expired@example.invalid',now()-interval '8 days','synthetic','launch-only-v1','2026-11-17-v2'),
          ('v4-current@example.invalid',now(),'synthetic','launch-only-v1','2026-11-17-v2');
  SELECT count(*) INTO before_runs FROM survey_private.retention_runs;
  CREATE TRIGGER simulate_failure BEFORE DELETE ON survey_private.responses_test FOR EACH ROW EXECUTE FUNCTION pg_temp.fail_survey_delete();
  BEGIN
    PERFORM survey_private.run_retention('manual');
  EXCEPTION WHEN OTHERS THEN failed:=true; ASSERT SQLERRM='survey_retention_failed'; END;
  ASSERT failed;
  ASSERT EXISTS(SELECT FROM survey_private.responses_test WHERE id=due);
  ASSERT (SELECT count(*)=before_runs FROM survey_private.retention_runs);
  DROP TRIGGER simulate_failure ON survey_private.responses_test;
  PERFORM survey_private.run_retention('manual');
  ASSERT NOT EXISTS(SELECT FROM survey_private.responses_test WHERE id=due);
  ASSERT EXISTS(SELECT FROM survey_private.responses_test WHERE id=fresh);
  ASSERT NOT EXISTS(SELECT FROM survey_private.launch_contacts_test WHERE email='v4-expired@example.invalid');
  ASSERT EXISTS(SELECT FROM survey_private.launch_contacts_test WHERE email='v4-current@example.invalid');
  PERFORM survey_private.run_retention('manual'); -- Safe retry, including empty result sets.
  PERFORM survey_private.erase_test_contact('v4-current@example.invalid');
  PERFORM survey_private.erase_test_contact('v4-current@example.invalid'); -- Idempotent erasure.
  ASSERT NOT EXISTS(SELECT FROM survey_private.launch_contacts_test WHERE email='v4-current@example.invalid');
  ASSERT EXISTS(SELECT FROM survey_private.responses_test WHERE id=fresh); -- Separate archives.
  ASSERT (SELECT count(*)=before_runs+4 FROM survey_private.retention_runs);
END $$;
ROLLBACK;
