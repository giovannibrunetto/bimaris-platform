-- DS-MKT-USER-02 / read-only administration of citizen survey results.
-- STAGING REVIEW ONLY. Do not apply to production or enable collection.
-- Uses existing service_role grants and an invoker RPC; no email or identifiers returned.
CREATE OR REPLACE FUNCTION public.admin_citizen_survey_summary()
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
WITH valid AS (
  SELECT q1,q2,q3,q4,idea,received_on
  FROM survey_private.responses
  WHERE rehearsal = false AND expires_at > now()
),
choice_counts AS (
  SELECT row_number() OVER (ORDER BY ord)::int AS question, counts
  FROM (
    SELECT 1 AS ord, ARRAY[COUNT(*) FILTER (WHERE q1=1),COUNT(*) FILTER (WHERE q1=2),COUNT(*) FILTER (WHERE q1=3),COUNT(*) FILTER (WHERE q1=4)] AS counts FROM valid
    UNION ALL
    SELECT 2, ARRAY[COUNT(*) FILTER (WHERE q2=1),COUNT(*) FILTER (WHERE q2=2),COUNT(*) FILTER (WHERE q2=3),COUNT(*) FILTER (WHERE q2=4)] FROM valid
    UNION ALL
    SELECT 3, ARRAY[(SELECT COUNT(*) FROM valid v WHERE 1=ANY(v.q3)),(SELECT COUNT(*) FROM valid v WHERE 2=ANY(v.q3)),(SELECT COUNT(*) FROM valid v WHERE 3=ANY(v.q3)),(SELECT COUNT(*) FROM valid v WHERE 4=ANY(v.q3))] FROM valid
    UNION ALL
    SELECT 4, ARRAY[COUNT(*) FILTER (WHERE q4=1),COUNT(*) FILTER (WHERE q4=2),COUNT(*) FILTER (WHERE q4=3),COUNT(*) FILTER (WHERE q4=4)] FROM valid
  ) a
)
SELECT jsonb_build_object(
  'responses', (SELECT COUNT(*) FROM valid),
  'launch_contacts', (SELECT COUNT(*) FROM survey_private.launch_contacts WHERE rehearsal=false AND consent_at IS NOT NULL),
  'choices', (SELECT COALESCE(jsonb_agg(to_jsonb(counts) ORDER BY question),'[]'::jsonb) FROM choice_counts),
  'ideas', (SELECT COALESCE(jsonb_agg(jsonb_build_object('date',received_on,'text',idea) ORDER BY received_on DESC),'[]'::jsonb)
            FROM (SELECT received_on,idea FROM valid WHERE btrim(idea)<>'' ORDER BY received_on DESC LIMIT 20) v)
);
$$;
REVOKE ALL ON FUNCTION public.admin_citizen_survey_summary() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_citizen_survey_summary() TO service_role;
NOTIFY pgrst, 'reload schema';
