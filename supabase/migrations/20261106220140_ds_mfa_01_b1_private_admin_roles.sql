-- DS-MFA-01/C B1: staging-only private Super Admin authorization.
-- Rollback (only while no admin identities exist):
-- DROP FUNCTION IF EXISTS public.is_active_super_admin(uuid);
-- DROP TABLE IF EXISTS security.admin_members;
-- DROP SCHEMA IF EXISTS security;
CREATE SCHEMA IF NOT EXISTS security;
REVOKE ALL ON SCHEMA security FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA security TO service_role;
CREATE TABLE IF NOT EXISTS security.admin_members (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'super_admin' CHECK (role = 'super_admin'),
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT admin_members_revocation_consistency CHECK (active = false OR revoked_at IS NULL)
);
ALTER TABLE security.admin_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON security.admin_members FROM PUBLIC, anon, authenticated;
GRANT SELECT ON security.admin_members TO service_role;
CREATE OR REPLACE FUNCTION public.is_active_super_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM security.admin_members m
    WHERE m.user_id = p_user_id
      AND m.role = 'super_admin'
      AND m.active = true
      AND m.revoked_at IS NULL
  );
$$;
REVOKE ALL ON FUNCTION public.is_active_super_admin(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_super_admin(uuid) TO service_role;
