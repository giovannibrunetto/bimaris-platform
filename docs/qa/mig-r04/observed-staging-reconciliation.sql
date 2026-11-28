-- Diagnostic replay only: match observed Staging definitions; not deployable migration.
CREATE OR REPLACE FUNCTION public.is_active_super_admin_session(p_user_id uuid, p_session_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ SELECT EXISTS (SELECT 1 FROM auth.sessions s JOIN security.admin_members m ON m.user_id = s.user_id WHERE s.id = p_session_id AND s.user_id = p_user_id AND s.aal = 'aal2' AND (s.not_after IS NULL OR s.not_after > now()) AND m.role = 'super_admin' AND m.active = true AND m.revoked_at IS NULL); $function$;

CREATE OR REPLACE FUNCTION public.respond_to_experience_collaboration(p_experience_id uuid, p_operator_id uuid, p_decision text)
 RETURNS experience_operators
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare v_row public.experience_operators;
begin
  if p_decision not in ('accepted','rejected') then
    raise exception 'Decisione non valida';
  end if;

  update public.experience_operators
  set approval_status=p_decision,
      approved_at=case when p_decision='accepted' then now() else null end,
      updated_at=now()
  where experience_id=p_experience_id
    and operator_id=p_operator_id
    and role='participant'
  returning * into v_row;

  if not found then
    raise exception 'Collaborazione non trovata o non autorizzata';
  end if;
  return v_row;
end;
$function$;
REVOKE EXECUTE ON FUNCTION public.respond_to_experience_collaboration(uuid,uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.respond_to_experience_collaboration(uuid,uuid,text) TO authenticated,service_role;
REVOKE EXECUTE ON FUNCTION public.guard_partner_collaboration_update() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.guard_partner_collaboration_update() TO service_role;
DROP POLICY IF EXISTS "operator owners can read own experience interests" ON public.experience_discovery_intents;
DROP POLICY IF EXISTS "public read experience discovery intents" ON public.experience_discovery_intents;
CREATE POLICY "partner managers respond to collaboration" ON public.experience_operators AS PERMISSIVE FOR UPDATE TO authenticated USING ((role = 'participant'::text) AND (EXISTS ( SELECT 1 FROM public.operator_memberships m WHERE ((m.operator_id = experience_operators.operator_id) AND (m.user_id = ( SELECT auth.uid() AS uid)) AND (m.role = ANY (ARRAY['owner'::text, 'manager'::text])))))) WITH CHECK ((role = 'participant'::text) AND (EXISTS ( SELECT 1 FROM public.operator_memberships m WHERE ((m.operator_id = experience_operators.operator_id) AND (m.user_id = ( SELECT auth.uid() AS uid)) AND (m.role = ANY (ARRAY['owner'::text, 'manager'::text]))))));
