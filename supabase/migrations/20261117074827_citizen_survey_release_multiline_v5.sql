-- Preserve allowed line breaks in optional answers; all other control characters rejected.
CREATE OR REPLACE FUNCTION public.submit_citizen_survey(
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
    OR (cardinality(p_q3)=2 AND p_q3[1]=p_q3[2]) OR length(p_idea)>1000 OR EXISTS(SELECT FROM generate_series(1,31) c WHERE c NOT IN (9,10,13) AND strpos(p_idea,chr(c))>0)
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
