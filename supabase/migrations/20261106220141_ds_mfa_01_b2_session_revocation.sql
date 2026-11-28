-- DS-MFA-01/C: Staging-only session-aware Super Admin authorization.
-- This migration must NOT be applied to Supabase Production.
-- Rollback: DROP FUNCTION IF EXISTS public.is_active_super_admin_session(uuid,uuid);
CREATE OR REPLACE FUNCTION public.is_active_super_admin_session(
  p_user_id uuid,
  p_session_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.sessions s
    JOIN security.admin_members m ON m.user_id = s.user_id
    WHERE s.id = p_session_id
      AND s.user_id = p_user_id
      AND s.aal = 'aal2'
      AND (s.not_after IS NULL OR s.not_after > now())
      AND m.role = 'super_admin'
      AND m.active = true
      AND m.revoked_at IS NULL
  );
$$;
REVOKE ALL ON FUNCTION public.is_active_super_admin_session(uuid,uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_super_admin_session(uuid,uuid)
  TO service_role;
