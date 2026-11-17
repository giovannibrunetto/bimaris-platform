-- DS-PRIVACY-QUESTIONARIO-01: aggregate rehearsal counts without exposing individual submissions.
-- Staging only; read-only RPC invoked server-side after the Super Admin MFA gate.
CREATE OR REPLACE FUNCTION public.admin_citizen_survey_test_summary()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO ''
AS $function$
  SELECT jsonb_build_object(
    'rehearsal_responses', (SELECT count(*) FROM survey_private.responses WHERE rehearsal IS TRUE),
    'rehearsal_contacts', (SELECT count(*) FROM survey_private.launch_contacts WHERE rehearsal IS TRUE),
    'legacy_test_responses', (SELECT count(*) FROM survey_private.responses_test WHERE test_only IS TRUE),
    'legacy_test_contacts', (SELECT count(*) FROM survey_private.launch_contacts_test WHERE test_only IS TRUE)
  );
$function$;
REVOKE ALL ON FUNCTION public.admin_citizen_survey_test_summary() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_citizen_survey_test_summary() TO service_role;
