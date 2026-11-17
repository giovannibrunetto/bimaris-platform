-- Staging only. Keep historic consent evidence; only new submissions use v2.
ALTER TABLE survey_private.launch_contacts_test DROP CONSTRAINT launch_contacts_test_privacy_version_check;
ALTER TABLE survey_private.launch_contacts_test ADD CONSTRAINT launch_contacts_test_privacy_version_check CHECK(privacy_version IN ('2026-11-16-v1','2026-11-17-v2'));
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
    OR p_privacy_version IS DISTINCT FROM '2026-11-17-v2' OR p_consent_version IS DISTINCT FROM 'launch-only-v1'
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
