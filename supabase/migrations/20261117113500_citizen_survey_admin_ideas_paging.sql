-- DS-MKT-USER-ADMIN-01: paged read-only access to open answers.
-- Only service_role can execute. No emails or response identifiers are returned.
CREATE OR REPLACE FUNCTION public.admin_citizen_survey_ideas(p_page integer DEFAULT 1, p_search text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' SET statement_timeout = '5s' AS $$
DECLARE v_total bigint; v_items jsonb;
BEGIN
  IF p_page IS NULL OR p_page NOT BETWEEN 1 AND 100000 OR p_search IS NULL OR length(p_search)>80 THEN
    RAISE EXCEPTION 'invalid_pagination';
  END IF;
  SELECT count(*) INTO v_total
  FROM survey_private.responses
  WHERE rehearsal=false AND expires_at>now() AND btrim(idea)<>'' AND
    (p_search='' OR position(lower(p_search) in lower(idea))>0);
  SELECT coalesce(jsonb_agg(jsonb_build_object('date',received_on,'text',idea) ORDER BY received_on DESC,id DESC),'[]'::jsonb)
  INTO v_items FROM (
    SELECT id,received_on,idea FROM survey_private.responses
    WHERE rehearsal=false AND expires_at>now() AND btrim(idea)<>'' AND
      (p_search='' OR position(lower(p_search) in lower(idea))>0)
    ORDER BY received_on DESC,id DESC LIMIT 20 OFFSET ((p_page-1)*20)
  ) t;
  RETURN jsonb_build_object('total',v_total,'items',v_items,'page',p_page,'page_size',20);
END $$;
REVOKE ALL ON FUNCTION public.admin_citizen_survey_ideas(integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_citizen_survey_ideas(integer,text) TO service_role;
NOTIFY pgrst,'reload schema';
